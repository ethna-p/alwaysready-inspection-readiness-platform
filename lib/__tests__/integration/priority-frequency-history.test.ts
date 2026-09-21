/**
 * Priority and review-frequency history trigger
 *
 * The audit trail promises that every change to a KLOE's priority or review frequency
 * is recorded. That used to depend on the app making two extra requests it never checked
 * (a failure was invisible). Migration 20260921000001 moved it into a trigger on
 * compliance_record_history, so it commits or fails together with the save.
 *
 * These tests pin the behaviour the KLOE timeline relies on:
 *   - an admin's save that changes priority / frequency writes one history row each,
 *     holding the OLD value (which also proves this trigger runs before the one that
 *     updates compliance_records, because it fires in alphabetical order),
 *   - a save that changes nothing writes none,
 *   - a first-ever save records old value NULL,
 *   - non-admins and service-role writes record nothing (as the app did),
 *   - and if a history write fails, the whole save fails instead of half succeeding.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import { connectSuperuser, seedOrg, seedUser, withAuthUser, cleanupOrg } from './helpers'

let client: Client
let orgId: string
let adminId: string
let userId: string
let kloWithRecord: string
let kloWithRecord2: string
let kloWithoutRecord: string

beforeAll(async () => {
  client = await connectSuperuser()

  const { rows } = await client.query<{ id: string }>(`SELECT id FROM public.klo_items ORDER BY display_order LIMIT 3`)
  if (rows.length < 3) throw new Error('Need at least 3 klo_items - run supabase start first')
  ;[kloWithRecord, kloWithRecord2, kloWithoutRecord] = rows.map(r => r.id)

  orgId = await seedOrg(client, { name: 'Priority History Test Org' })
  adminId = (await seedUser(client, { organisationId: orgId, role: 'admin' })).authUserId
  userId = (await seedUser(client, { organisationId: orgId, role: 'user' })).authUserId

  // Current-state rows: priority 3, frequency 90 (the app's defaults). kloWithoutRecord has none.
  await client.query(
    `INSERT INTO public.compliance_records (organisation_id, klo_item_id, priority, review_frequency_days, assigned_to)
     VALUES ($1, $2, 3, 90, $4), ($1, $3, 3, 90, $4)
     ON CONFLICT (organisation_id, klo_item_id) DO UPDATE SET priority = 3, review_frequency_days = 90`,
    [orgId, kloWithRecord, kloWithRecord2, userId]
  )
})

afterAll(async () => {
  await cleanupOrg(client, orgId)
  await client.end()
})

/** Insert a compliance_record_history row as the given signed-in user, then read what the trigger recorded. */
async function saveAs(authUserId: string, kloId: string, priority: number, frequency: number) {
  return withAuthUser(client, authUserId, async c => {
    await c.query(
      `INSERT INTO public.compliance_record_history
         (organisation_id, klo_item_id, status, priority, review_frequency_days, changed_by)
       VALUES ($1, $2, 'in_progress', $3, $4, $5)`,
      [orgId, kloId, priority, frequency, authUserId]
    )
    const p = await c.query(
      `SELECT old_priority, new_priority, changed_by FROM public.priority_history WHERE organisation_id = $1 AND klo_item_id = $2`,
      [orgId, kloId]
    )
    const f = await c.query(
      `SELECT old_frequency_days, new_frequency_days, changed_by FROM public.review_frequency_history WHERE organisation_id = $1 AND klo_item_id = $2`,
      [orgId, kloId]
    )
    const cur = await c.query(
      `SELECT priority, review_frequency_days FROM public.compliance_records WHERE organisation_id = $1 AND klo_item_id = $2`,
      [orgId, kloId]
    )
    return { priority: p.rows, frequency: f.rows, current: cur.rows[0] }
  })
}

describe('an admin save', () => {
  it('records one row each for a changed priority and frequency, holding the OLD values', async () => {
    const r = await saveAs(adminId, kloWithRecord, 1, 60)
    expect(r.priority).toEqual([{ old_priority: 3, new_priority: 1, changed_by: adminId }])
    expect(r.frequency).toEqual([{ old_frequency_days: 90, new_frequency_days: 60, changed_by: adminId }])
    // The record itself was also updated, so the old values were read before that happened.
    expect(r.current).toEqual({ priority: 1, review_frequency_days: 60 })
  })

  it('records nothing when priority and frequency are unchanged', async () => {
    const r = await saveAs(adminId, kloWithRecord2, 3, 90)
    expect(r.priority).toEqual([])
    expect(r.frequency).toEqual([])
  })

  it('records only the value that changed', async () => {
    const r = await saveAs(adminId, kloWithRecord2, 3, 30)
    expect(r.priority).toEqual([])
    expect(r.frequency).toEqual([{ old_frequency_days: 90, new_frequency_days: 30, changed_by: adminId }])
  })

  it('records old value NULL on the first ever save of a KLOE', async () => {
    const r = await saveAs(adminId, kloWithoutRecord, 3, 90)
    expect(r.priority).toEqual([{ old_priority: null, new_priority: 3, changed_by: adminId }])
    expect(r.frequency).toEqual([{ old_frequency_days: null, new_frequency_days: 90, changed_by: adminId }])
  })
})

describe('saves that must not write history', () => {
  it('a non-admin member records nothing', async () => {
    // Unchanged values, on a KLOE assigned to this user (which their insert policy allows).
    const r = await saveAs(userId, kloWithRecord2, 3, 90)
    expect(r.priority).toEqual([])
    expect(r.frequency).toEqual([])
  })

  it('a service-role style insert (no signed-in user) records nothing', async () => {
    await client.query('BEGIN')
    try {
      await client.query(
        `INSERT INTO public.compliance_record_history (organisation_id, klo_item_id, status, priority, review_frequency_days, changed_by)
         VALUES ($1, $2, 'in_progress', 5, 14, $3)`,
        [orgId, kloWithRecord2, adminId]
      )
      const { rows } = await client.query(
        `SELECT (SELECT count(*) FROM public.priority_history WHERE organisation_id = $1 AND klo_item_id = $2)::int AS p,
                (SELECT count(*) FROM public.review_frequency_history WHERE organisation_id = $1 AND klo_item_id = $2)::int AS f`,
        [orgId, kloWithRecord2]
      )
      expect(rows[0]).toEqual({ p: 0, f: 0 })
    } finally {
      await client.query('ROLLBACK')
    }
  })
})

describe('atomicity', () => {
  it('fails the whole save when a history row cannot be written, instead of half succeeding', async () => {
    await client.query('BEGIN')
    try {
      // Make every insert into priority_history fail, then attempt a normal admin save that changes priority.
      await client.query(`ALTER TABLE public.priority_history ADD CONSTRAINT zz_audit_test_always_fail CHECK (false) NOT VALID`)
      await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
        JSON.stringify({ sub: adminId, role: 'authenticated', iss: 'supabase-demo', aal: 'aal2' }),
      ])
      await client.query('SET LOCAL ROLE authenticated')
      await expect(
        client.query(
          `INSERT INTO public.compliance_record_history (organisation_id, klo_item_id, status, priority, review_frequency_days, changed_by)
           VALUES ($1, $2, 'in_progress', 4, 90, $3)`,
          [orgId, kloWithRecord2, adminId]
        )
      ).rejects.toThrow(/zz_audit_test_always_fail|check constraint/i)
    } finally {
      await client.query('ROLLBACK') // also removes the temporary constraint
    }
  })
})
