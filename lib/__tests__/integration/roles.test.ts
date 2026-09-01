/**
 * Role permission boundary tests
 *
 * Verifies that the role-aware RLS policies on compliance_record_history
 * are enforced correctly:
 *
 *   admin  → can insert history for any KLOE in their org
 *   user   → can only insert for KLOEs assigned to them
 *   viewer → blocked from all inserts
 *
 * Also verifies that the assigned_to column controls user-level write access.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import {
  connectSuperuser,
  seedOrg,
  seedUser,
  withAuthUser,
  cleanupOrg,
} from './helpers'

let client: Client
let orgId: string
let adminId: string
let userId: string
let viewerId: string
let kloItemId: string
let kloItemId2: string

beforeAll(async () => {
  client = await connectSuperuser()

  // Pick two klo_items for the assignment tests
  const { rows: kloRows } = await client.query<{ id: string }>(
    `SELECT id FROM public.klo_items LIMIT 2`
  )
  if (kloRows.length < 2) throw new Error('Need at least 2 klo_items — run supabase start first')
  kloItemId  = kloRows[0].id
  kloItemId2 = kloRows[1].id

  orgId = await seedOrg(client, { name: 'Roles Test Org' })

  const admin  = await seedUser(client, { organisationId: orgId, role: 'admin' })
  const user   = await seedUser(client, { organisationId: orgId, role: 'user' })
  const viewer = await seedUser(client, { organisationId: orgId, role: 'viewer' })
  adminId  = admin.authUserId
  userId   = user.authUserId
  viewerId = viewer.authUserId

  // Seed compliance_records for both KLOEs (current-state table).
  // These must exist before the history inserts and the assigned_to update below.
  await client.query(
    `INSERT INTO public.compliance_records (organisation_id, klo_item_id)
     VALUES ($1, $2), ($1, $3)
     ON CONFLICT (organisation_id, klo_item_id) DO NOTHING`,
    [orgId, kloItemId, kloItemId2]
  )

  // Also seed compliance_record_history (audit trail).
  await client.query(
    `INSERT INTO public.compliance_record_history
       (organisation_id, klo_item_id, status, priority, changed_by)
     VALUES ($1, $2, 'not_started', 3, $3)`,
    [orgId, kloItemId, adminId]
  )
  await client.query(
    `INSERT INTO public.compliance_record_history
       (organisation_id, klo_item_id, status, priority, changed_by)
     VALUES ($1, $2, 'not_started', 3, $3)`,
    [orgId, kloItemId2, adminId]
  )

  // Assign kloItemId to the 'user' role member (kloItemId2 is unassigned)
  await client.query(
    `UPDATE public.compliance_records SET assigned_to = $1
     WHERE organisation_id = $2 AND klo_item_id = $3`,
    [userId, orgId, kloItemId]
  )
})

afterAll(async () => {
  await cleanupOrg(client, orgId)
  await client.end()
})

// ── admin ────────────────────────────────────────────────────────────────────

describe('admin role', () => {
  it('can insert a history row for any KLOE in their org', async () => {
    await expect(
      withAuthUser(client, adminId, async (c) => {
        await c.query(
          `INSERT INTO public.compliance_record_history
             (organisation_id, klo_item_id, status, priority, changed_by)
           VALUES ($1, $2, 'in_progress', 3, $3)`,
          [orgId, kloItemId, adminId]
        )
      })
    ).resolves.toBeUndefined()
  })

  it('can insert a history row for an unassigned KLOE', async () => {
    await expect(
      withAuthUser(client, adminId, async (c) => {
        await c.query(
          `INSERT INTO public.compliance_record_history
             (organisation_id, klo_item_id, status, priority, changed_by)
           VALUES ($1, $2, 'in_progress', 3, $3)`,
          [orgId, kloItemId2, adminId]
        )
      })
    ).resolves.toBeUndefined()
  })
})

// ── user ─────────────────────────────────────────────────────────────────────

describe('user role', () => {
  it('can insert a history row for a KLOE assigned to them', async () => {
    await expect(
      withAuthUser(client, userId, async (c) => {
        await c.query(
          `INSERT INTO public.compliance_record_history
             (organisation_id, klo_item_id, status, priority, changed_by)
           VALUES ($1, $2, 'in_progress', 3, $3)`,
          [orgId, kloItemId, userId]
        )
      })
    ).resolves.toBeUndefined()
  })

  it('cannot insert a history row for an unassigned KLOE', async () => {
    await expect(
      withAuthUser(client, userId, async (c) => {
        await c.query(
          `INSERT INTO public.compliance_record_history
             (organisation_id, klo_item_id, status, priority, changed_by)
           VALUES ($1, $2, 'in_progress', 3, $3)`,
          [orgId, kloItemId2, userId]
        )
      })
    ).rejects.toThrow()
  })

  it('can read all compliance records in their org', async () => {
    const rows = await withAuthUser(client, userId, async (c) => {
      const { rows } = await c.query<{ organisation_id: string }>(
        `SELECT organisation_id FROM public.compliance_records
         WHERE organisation_id = $1`, [orgId]
      )
      return rows
    })
    expect(rows.length).toBeGreaterThan(0)
  })
})

// ── viewer ───────────────────────────────────────────────────────────────────

describe('viewer role', () => {
  it('can read compliance records in their org', async () => {
    const rows = await withAuthUser(client, viewerId, async (c) => {
      const { rows } = await c.query<{ organisation_id: string }>(
        `SELECT organisation_id FROM public.compliance_records
         WHERE organisation_id = $1`, [orgId]
      )
      return rows
    })
    expect(rows.length).toBeGreaterThan(0)
  })

  it('cannot insert a history row (viewers are blocked from all writes)', async () => {
    await expect(
      withAuthUser(client, viewerId, async (c) => {
        await c.query(
          `INSERT INTO public.compliance_record_history
             (organisation_id, klo_item_id, status, priority, changed_by)
           VALUES ($1, $2, 'in_progress', 3, $3)`,
          [orgId, kloItemId, viewerId]
        )
      })
    ).rejects.toThrow()
  })
})
