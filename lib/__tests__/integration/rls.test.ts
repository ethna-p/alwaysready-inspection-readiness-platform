/**
 * RLS cross-org isolation tests
 *
 * Seeds two separate organisations (Org A and Org B) with users and
 * compliance records, then verifies that a user authenticated as Org A
 * cannot read or write Org B's data — and vice versa.
 *
 * All DB mutations run inside transactions that are rolled back, so these
 * tests leave the database clean regardless of pass/fail.
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
let orgAId: string
let orgBId: string
let userAId: string
let userBId: string
let kloItemId: string

beforeAll(async () => {
  client = await connectSuperuser()

  // Pick a real klo_item_id from the reference table
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM public.klo_items LIMIT 1`
  )
  if (rows.length === 0) throw new Error('No klo_items seeded — run supabase start first')
  kloItemId = rows[0].id

  // Seed two independent organisations
  orgAId = await seedOrg(client, { name: 'RLS Test — Org A' })
  orgBId = await seedOrg(client, { name: 'RLS Test — Org B' })

  // Seed one admin user per org
  const userA = await seedUser(client, { organisationId: orgAId, role: 'admin' })
  const userB = await seedUser(client, { organisationId: orgBId, role: 'admin' })
  userAId = userA.authUserId
  userBId = userB.authUserId

  // Seed one compliance_record_history row per org (trigger creates the current-state row)
  await client.query(
    `INSERT INTO public.compliance_record_history
       (organisation_id, klo_item_id, status, priority, changed_by)
     VALUES ($1, $2, 'not_started', 3, $3)`,
    [orgAId, kloItemId, userAId]
  )
  await client.query(
    `INSERT INTO public.compliance_record_history
       (organisation_id, klo_item_id, status, priority, changed_by)
     VALUES ($1, $2, 'not_started', 3, $3)`,
    [orgBId, kloItemId, userBId]
  )
})

afterAll(async () => {
  await cleanupOrg(client, orgAId)
  await cleanupOrg(client, orgBId)
  await client.end()
})

// ── organisations ────────────────────────────────────────────────────────────

describe('organisations RLS', () => {
  it('User A can read their own organisation', async () => {
    const rows = await withAuthUser(client, userAId, async (c) => {
      const { rows } = await c.query<{ id: string }>(
        `SELECT id FROM public.organisations WHERE id = $1`, [orgAId]
      )
      return rows
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(orgAId)
  })

  it('User A cannot read Org B', async () => {
    const rows = await withAuthUser(client, userAId, async (c) => {
      const { rows } = await c.query<{ id: string }>(
        `SELECT id FROM public.organisations WHERE id = $1`, [orgBId]
      )
      return rows
    })
    expect(rows).toHaveLength(0)
  })

  it('User B cannot read Org A', async () => {
    const rows = await withAuthUser(client, userBId, async (c) => {
      const { rows } = await c.query<{ id: string }>(
        `SELECT id FROM public.organisations WHERE id = $1`, [orgAId]
      )
      return rows
    })
    expect(rows).toHaveLength(0)
  })
})

// ── compliance_records ───────────────────────────────────────────────────────

describe('compliance_records RLS', () => {
  it('User A can read their own compliance records', async () => {
    const rows = await withAuthUser(client, userAId, async (c) => {
      const { rows } = await c.query<{ organisation_id: string }>(
        `SELECT organisation_id FROM public.compliance_records WHERE organisation_id = $1`,
        [orgAId]
      )
      return rows
    })
    expect(rows.length).toBeGreaterThan(0)
    rows.forEach((r) => expect(r.organisation_id).toBe(orgAId))
  })

  it('User A cannot read Org B compliance records', async () => {
    const rows = await withAuthUser(client, userAId, async (c) => {
      const { rows } = await c.query<{ organisation_id: string }>(
        `SELECT organisation_id FROM public.compliance_records WHERE organisation_id = $1`,
        [orgBId]
      )
      return rows
    })
    expect(rows).toHaveLength(0)
  })

  it('SELECT * returns only the authenticated user\'s org records', async () => {
    // Even an unfiltered SELECT must not leak cross-org data
    const rows = await withAuthUser(client, userAId, async (c) => {
      const { rows } = await c.query<{ organisation_id: string }>(
        `SELECT organisation_id FROM public.compliance_records`
      )
      return rows
    })
    const orgIds = [...new Set(rows.map((r) => r.organisation_id))]
    expect(orgIds).toEqual([orgAId])
  })
})

// ── compliance_record_history ────────────────────────────────────────────────

describe('compliance_record_history RLS', () => {
  it('User A can read their own history rows', async () => {
    const rows = await withAuthUser(client, userAId, async (c) => {
      const { rows } = await c.query<{ organisation_id: string }>(
        `SELECT organisation_id FROM public.compliance_record_history
         WHERE organisation_id = $1`,
        [orgAId]
      )
      return rows
    })
    expect(rows.length).toBeGreaterThan(0)
  })

  it('User A cannot read Org B history', async () => {
    const rows = await withAuthUser(client, userAId, async (c) => {
      const { rows } = await c.query<{ organisation_id: string }>(
        `SELECT organisation_id FROM public.compliance_record_history
         WHERE organisation_id = $1`,
        [orgBId]
      )
      return rows
    })
    expect(rows).toHaveLength(0)
  })

  it('User A cannot insert a history row for Org B', async () => {
    await expect(
      withAuthUser(client, userAId, async (c) => {
        await c.query(
          `INSERT INTO public.compliance_record_history
             (organisation_id, klo_item_id, status, priority, changed_by)
           VALUES ($1, $2, 'not_started', 3, $3)`,
          [orgBId, kloItemId, userAId]
        )
      })
    ).rejects.toThrow()
  })
})

// ── users ────────────────────────────────────────────────────────────────────

describe('users RLS', () => {
  it('User A can read members of their own org', async () => {
    const rows = await withAuthUser(client, userAId, async (c) => {
      const { rows } = await c.query<{ organisation_id: string }>(
        `SELECT organisation_id FROM public.users WHERE organisation_id = $1`,
        [orgAId]
      )
      return rows
    })
    expect(rows.length).toBeGreaterThan(0)
    rows.forEach((r) => expect(r.organisation_id).toBe(orgAId))
  })

  it('User A cannot read Org B members', async () => {
    const rows = await withAuthUser(client, userAId, async (c) => {
      const { rows } = await c.query<{ organisation_id: string }>(
        `SELECT organisation_id FROM public.users WHERE organisation_id = $1`,
        [orgBId]
      )
      return rows
    })
    expect(rows).toHaveLength(0)
  })

  it('User A cannot update another user\'s profile', async () => {
    await expect(
      withAuthUser(client, userAId, async (c) => {
        await c.query(
          `UPDATE public.users SET full_name = 'Hacked' WHERE id = $1`,
          [userBId]
        )
      })
    ).resolves.toBeUndefined() // UPDATE silently affects 0 rows (RLS filters, no error)
    // Verify the name wasn't actually changed
    const { rows } = await client.query<{ full_name: string }>(
      `SELECT full_name FROM public.users WHERE id = $1`, [userBId]
    )
    expect(rows[0].full_name).not.toBe('Hacked')
  })
})
