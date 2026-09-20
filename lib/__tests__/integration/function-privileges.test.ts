/**
 * Function privilege tests
 *
 * Postgres grants EXECUTE on new functions to PUBLIC by default, and Supabase
 * adds anon and authenticated on top, so a SECURITY DEFINER function written
 * without an explicit REVOKE is callable through /rest/v1/rpc by anyone,
 * logged in or not. That went unnoticed until the 2026-09-20 review. These
 * tests make it impossible to reintroduce quietly:
 *
 *   1. No SECURITY DEFINER function in public is executable by anon or
 *      authenticated, apart from the two RLS helpers that only ever return the
 *      caller's own values.
 *   2. New functions no longer start out executable by anon or authenticated
 *      (the default privileges set in 20260920000005).
 *   3. get_usage_summary() works for service_role and is refused to everyone else.
 *
 * Runs against the local Supabase instance started by `supabase start`.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import { connectSuperuser } from './helpers'

let client: Client

beforeAll(async () => {
  client = await connectSuperuser()
})

afterAll(async () => {
  await client.end()
})

/** RLS helper functions: callable by design, they only return the caller's own values. */
const ALLOWED_TO_OUTSIDE_ROLES = ['get_user_org_id', 'get_user_role']

describe('SECURITY DEFINER functions in public', () => {
  it('are not executable by anon or authenticated, apart from the RLS helpers', async () => {
    const { rows } = await client.query<{ proname: string; anon: boolean; authenticated: boolean }>(
      `SELECT p.proname,
              has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon,
              has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated
         FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'
          AND p.prosecdef
          AND p.prorettype NOT IN ('trigger'::regtype, 'event_trigger'::regtype)`
    )

    const exposed = rows
      .filter(r => (r.anon || r.authenticated) && !ALLOWED_TO_OUTSIDE_ROLES.includes(r.proname))
      .map(r => `${r.proname} (anon=${r.anon}, authenticated=${r.authenticated})`)

    expect(exposed).toEqual([])
  })

  it('include the functions that used to be exposed, now limited to service_role', async () => {
    for (const fn of [
      'get_org_upload_usage(uuid)',
      'seed_default_training_types(uuid)',
      'get_usage_summary()',
    ]) {
      const { rows } = await client.query<{ anon: boolean; authenticated: boolean; service: boolean }>(
        `SELECT has_function_privilege('anon', $1::regprocedure, 'EXECUTE')          AS anon,
                has_function_privilege('authenticated', $1::regprocedure, 'EXECUTE') AS authenticated,
                has_function_privilege('service_role', $1::regprocedure, 'EXECUTE')  AS service`,
        [`public.${fn}`]
      )
      expect(rows[0], fn).toEqual({ anon: false, authenticated: false, service: true })
    }
  })

  it('no longer include the retired demo functions', async () => {
    const { rows } = await client.query(
      `SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND proname IN ('create_demo_session', 'cleanup_expired_demo_orgs')`
    )
    expect(rows).toHaveLength(0)
  })
})

describe('default privileges for new functions', () => {
  it('do not grant EXECUTE to PUBLIC, anon or authenticated, but keep service_role', async () => {
    await client.query('BEGIN')
    try {
      await client.query(
        `CREATE FUNCTION public.__privilege_probe() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$`
      )
      const { rows } = await client.query<{ role: string; can_run: boolean }>(
        `SELECT r AS role, has_function_privilege(r, 'public.__privilege_probe()'::regprocedure, 'EXECUTE') AS can_run
           FROM unnest(ARRAY['public', 'anon', 'authenticated', 'service_role']) AS r`
      )
      const byRole = Object.fromEntries(rows.map(r => [r.role, r.can_run]))
      expect(byRole).toEqual({ public: false, anon: false, authenticated: false, service_role: true })
    } finally {
      await client.query('ROLLBACK')
    }
  })
})

describe('get_usage_summary()', () => {
  it('returns database size, storage totals and up to five table sizes to service_role', async () => {
    await client.query('BEGIN')
    try {
      await client.query('SET LOCAL ROLE service_role')
      const { rows } = await client.query<{ summary: Record<string, unknown> }>(
        'SELECT public.get_usage_summary() AS summary'
      )
      const s = rows[0].summary as {
        database_bytes: number
        storage_bytes: number
        storage_files: number
        top_tables: { name: string; bytes: number }[]
      }
      expect(s.database_bytes).toBeGreaterThan(0)
      expect(s.storage_bytes).toBeGreaterThanOrEqual(0)
      expect(s.storage_files).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(s.top_tables)).toBe(true)
      expect(s.top_tables.length).toBeGreaterThan(0)
      expect(s.top_tables.length).toBeLessThanOrEqual(5)
      const sizes = s.top_tables.map(t => t.bytes)
      expect(sizes).toEqual([...sizes].sort((a, b) => b - a))
    } finally {
      await client.query('ROLLBACK')
    }
  })

  for (const role of ['anon', 'authenticated']) {
    it(`is refused to ${role}`, async () => {
      await client.query('BEGIN')
      try {
        await client.query(`SET LOCAL ROLE ${role}`)
        await expect(client.query('SELECT public.get_usage_summary()')).rejects.toThrow(/permission denied/i)
      } finally {
        await client.query('ROLLBACK')
      }
    })
  }
})
