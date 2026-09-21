/**
 * A viewer (visitor, e.g. a CQC inspector) whose expiry date has passed must not be given access to
 * anything. This is enforced in the database, not just the UI: get_user_org_id() and get_user_role()
 * (which every organisation-scoped policy relies on) return NULL for a viewer whose viewer_expires_at is
 * in the past OR missing. These tests pin that across EVERY table that has an organisation_id column, so
 * a table added later without the protection, or a weakened helper, fails here.
 *
 * Control: the same query as a viewer whose access is still current must see the data, so a pass
 * proves the expiry is what blocks access, not an empty table.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import { connectSuperuser, seedOrg, seedUser, withAuthUser, cleanupOrg } from './helpers'

let client: Client
let orgId: string
let activeViewer: string
let expiredViewer: string
let noExpiryViewer: string
let orgTables: string[]

beforeAll(async () => {
  client = await connectSuperuser()
  orgId = await seedOrg(client, { name: 'Viewer Expiry Test Org' })
  activeViewer = (await seedUser(client, { organisationId: orgId, role: 'viewer' })).authUserId
  expiredViewer = (await seedUser(client, { organisationId: orgId, role: 'viewer' })).authUserId
  noExpiryViewer = (await seedUser(client, { organisationId: orgId, role: 'viewer' })).authUserId
  await client.query(`UPDATE public.users SET viewer_expires_at = now() - interval '1 minute' WHERE id = $1`, [expiredViewer])
  await client.query(`UPDATE public.users SET viewer_expires_at = NULL WHERE id = $1`, [noExpiryViewer])

  // Give the org some data in a table an inspector would read.
  const { rows: klo } = await client.query<{ id: string }>(`SELECT id FROM public.klo_items LIMIT 1`)
  await client.query(
    `INSERT INTO public.compliance_records (organisation_id, klo_item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [orgId, klo[0].id]
  )

  const { rows } = await client.query<{ table_name: string }>(
    `SELECT c.table_name
       FROM information_schema.columns c
       JOIN pg_class t ON t.relname = c.table_name AND t.relnamespace = 'public'::regnamespace
      WHERE c.table_schema = 'public' AND c.column_name = 'organisation_id' AND t.relkind = 'r'
      ORDER BY c.table_name`
  )
  orgTables = rows.map(r => r.table_name)
})

afterAll(async () => {
  await cleanupOrg(client, orgId)
  await client.end()
})

async function rowCounts(authUserId: string): Promise<Record<string, number>> {
  return withAuthUser(client, authUserId, async c => {
    const out: Record<string, number> = {}
    for (const t of orgTables) {
      const { rows } = await c.query<{ n: number }>(`SELECT count(*)::int AS n FROM public.${t}`)
      out[t] = rows[0].n
    }
    return out
  }, 'aal1')
}

describe('viewer expiry', () => {
  it('finds the organisation-scoped tables to check (guards against the query silently matching nothing)', () => {
    expect(orgTables.length).toBeGreaterThan(15)
    expect(orgTables).toContain('compliance_records')
  })

  it('control: a viewer whose access is current can read the organisation data', async () => {
    const counts = await rowCounts(activeViewer)
    expect(counts.compliance_records).toBeGreaterThan(0)
  })

  it('an expired viewer reads nothing from any organisation-scoped table', async () => {
    const counts = await rowCounts(expiredViewer)
    expect(Object.entries(counts).filter(([, n]) => n > 0)).toEqual([])
  })

  it('a viewer with no expiry date set reads nothing either (no expiry means no access, not unlimited access)', async () => {
    const counts = await rowCounts(noExpiryViewer)
    expect(Object.entries(counts).filter(([, n]) => n > 0)).toEqual([])
  })

  it('an expired viewer cannot read their own user row or anyone else in the organisation', async () => {
    const own = await withAuthUser(client, expiredViewer, async c =>
      (await c.query(`SELECT id FROM public.users`)).rows, 'aal1')
    expect(own).toEqual([])
  })

  it('the RLS helpers return NULL for an expired viewer and a real value for a current one', async () => {
    const helpers = (id: string) => withAuthUser(client, id, async c =>
      (await c.query(`SELECT public.get_user_org_id() AS org, public.get_user_role() AS role`)).rows[0], 'aal1')
    expect(await helpers(expiredViewer)).toEqual({ org: null, role: null })
    expect(await helpers(activeViewer)).toEqual({ org: orgId, role: 'viewer' })
  })

  it('an expired viewer cannot write anything either', async () => {
    const attempt = withAuthUser(client, expiredViewer, async c => {
      await c.query(`UPDATE public.compliance_records SET notes = 'tampered' WHERE organisation_id = $1`, [orgId])
      return (await c.query(`SELECT count(*)::int AS n FROM public.compliance_records WHERE notes = 'tampered'`)).rows[0].n
    }, 'aal1')
    // Either the update matches no rows (RLS filters them out) or it is refused outright.
    await expect(attempt.then(n => n, () => 0)).resolves.toBe(0)
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM public.compliance_records WHERE notes = 'tampered'`)
    expect(rows[0].n).toBe(0)
  })
})
