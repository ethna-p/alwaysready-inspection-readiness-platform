/**
 * cron_heartbeats: server-only. Only the service role may read or write it, and the migration seeds a
 * row for every scheduled job so a job that never runs still goes stale.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { connectSuperuser } from './helpers'

let client: Client
beforeAll(async () => { client = await connectSuperuser() })
afterAll(async () => { await client.end() })

describe('cron_heartbeats', () => {
  it('has row level security enabled and no privileges for anon or authenticated', async () => {
    const { rows } = await client.query(
      `SELECT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.cron_heartbeats'::regclass) AS rls,
              has_table_privilege('anon', 'public.cron_heartbeats', 'SELECT,INSERT,UPDATE,DELETE') AS anon,
              has_table_privilege('authenticated', 'public.cron_heartbeats', 'SELECT,INSERT,UPDATE,DELETE') AS authenticated,
              has_table_privilege('service_role', 'public.cron_heartbeats', 'SELECT,INSERT,UPDATE') AS service_role`
    )
    expect(rows[0]).toEqual({ rls: true, anon: false, authenticated: false, service_role: true })
  })

  it('is seeded with a row for every job scheduled in vercel.json', async () => {
    const vercel = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as { crons: { path: string }[] }
    const scheduled = vercel.crons.map(c => c.path.replace('/api/cron/', '')).sort()
    const { rows } = await client.query<{ job: string }>(`SELECT job FROM public.cron_heartbeats ORDER BY job`)
    expect(rows.map(r => r.job)).toEqual(scheduled)
  })
})
