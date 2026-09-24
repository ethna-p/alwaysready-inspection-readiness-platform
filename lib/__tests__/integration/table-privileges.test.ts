/**
 * Table privilege tests
 *
 * Supabase is ending the automatic exposure of new public tables to the Data API (existing
 * projects on 2026-10-30), and 20260924000001 switches the same defaults off here first. These
 * tests keep that honest:
 *
 *   1. New tables and sequences start with no privileges for anon, authenticated or service_role,
 *      so a migration that forgets its GRANT fails here in CI, not in production.
 *   2. Every existing table in public is still usable by service_role and authenticated, apart
 *      from the deliberate server-only tables below.
 *   3. The server-only tables stay closed to anon and authenticated.
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

/** Only ever read or written through the service-role client. anon and authenticated must have nothing. */
const SERVER_ONLY_TABLES = ['cron_claims', 'cron_heartbeats']

const WRITE = 'SELECT,INSERT,UPDATE,DELETE'

describe('default privileges for new tables and sequences', () => {
  it('give anon, authenticated and service_role nothing until a migration grants it explicitly', async () => {
    await client.query('BEGIN')
    try {
      await client.query(`CREATE TABLE public.__grant_probe (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY)`)
      const { rows } = await client.query<{ role: string; table_access: boolean; sequence_access: boolean }>(
        `SELECT r.role,
                has_table_privilege(r.role, 'public.__grant_probe', 'SELECT,INSERT,UPDATE,DELETE') AS table_access,
                has_sequence_privilege(r.role, pg_get_serial_sequence('public.__grant_probe', 'id'), 'USAGE') AS sequence_access
           FROM (VALUES ('anon'), ('authenticated'), ('service_role')) r(role)`
      )
      for (const row of rows) {
        expect(row, row.role).toEqual({ role: row.role, table_access: false, sequence_access: false })
      }
    } finally {
      await client.query('ROLLBACK')
    }
  })
})

describe('tables that already exist', () => {
  it('remain usable by service_role and authenticated, apart from the server-only tables', async () => {
    const { rows } = await client.query<{ relname: string; role: string }>(
      `SELECT c.relname, r.role
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public' AND c.relkind IN ('r', 'p')
        CROSS JOIN (VALUES ('service_role'), ('authenticated')) r(role)
        WHERE c.relname <> ALL ($1::text[])
          AND NOT has_table_privilege(r.role, c.oid, '${WRITE}')
        ORDER BY 1, 2`,
      [SERVER_ONLY_TABLES]
    )
    expect(rows.map(r => `${r.relname} (${r.role})`)).toEqual([])
  })

  it('keep the server-only tables closed to anon and authenticated but open to service_role', async () => {
    for (const table of SERVER_ONLY_TABLES) {
      const { rows } = await client.query<{ anon: boolean; authenticated: boolean; service: boolean }>(
        `SELECT has_table_privilege('anon', $1::regclass, '${WRITE}')          AS anon,
                has_table_privilege('authenticated', $1::regclass, '${WRITE}') AS authenticated,
                has_table_privilege('service_role', $1::regclass, '${WRITE}')  AS service`,
        [`public.${table}`]
      )
      expect(rows[0], table).toEqual({ anon: false, authenticated: false, service: true })
    }
  })
})
