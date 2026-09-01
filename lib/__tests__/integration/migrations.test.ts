/**
 * Migration smoke tests
 *
 * Verifies that all 101 migrations applied cleanly by checking that the key
 * tables exist and have the expected columns. A missing table means a migration
 * failed silently; a missing column means a later ALTER TABLE migration didn't run.
 *
 * These tests run against the local Supabase instance started by `supabase start`,
 * which applies every migration in supabase/migrations/ on a blank database.
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

/** Returns true if the table exists in the public schema. */
async function tableExists(name: string): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [name]
  )
  return rows[0].exists
}

/** Returns the column names for a table in the public schema. */
async function columnNames(table: string): Promise<string[]> {
  const { rows } = await client.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  )
  return rows.map((r) => r.column_name)
}

// ── Core tables ──────────────────────────────────────────────────────────────

describe('core tables exist', () => {
  const coreTable = (name: string) =>
    it(`${name} exists`, async () => {
      expect(await tableExists(name)).toBe(true)
    })

  coreTable('organisations')
  coreTable('users')
  coreTable('klo_items')
  coreTable('key_questions')
  coreTable('compliance_records')
  coreTable('compliance_record_history')
  coreTable('review_frequency_history')
  coreTable('priority_history')
})

// ── Feature tables ───────────────────────────────────────────────────────────

describe('feature tables exist', () => {
  const featureTable = (name: string) =>
    it(`${name} exists`, async () => {
      expect(await tableExists(name)).toBe(true)
    })

  featureTable('hr_staff_profiles')
  featureTable('hr_absence_records')
  featureTable('hr_absence_categories')
  featureTable('action_items')
  featureTable('mock_inspections')
  featureTable('mock_inspection_findings')
  featureTable('i_statements')
  featureTable('i_statement_actions')
  featureTable('i_statement_evidence_files')
  featureTable('support_tickets')
  featureTable('notification_log')
  featureTable('waitlist_leads')
  featureTable('report_snapshots')
  featureTable('saved_report_views')
  featureTable('marketing_campaigns')
  featureTable('campaign_contacts')
  featureTable('marketing_suppressions')
})

// ── Key column presence ───────────────────────────────────────────────────────

describe('organisations columns', () => {
  it('has subscription_tier, stripe_customer_id, is_beta, is_tester, subscribed_at', async () => {
    const cols = await columnNames('organisations')
    for (const col of ['subscription_tier', 'stripe_customer_id', 'is_beta', 'is_tester', 'subscribed_at']) {
      expect(cols, `Missing column: ${col}`).toContain(col)
    }
  })
})

describe('users columns', () => {
  it('has role, organisation_id, viewer_expires_at', async () => {
    const cols = await columnNames('users')
    for (const col of ['role', 'organisation_id', 'viewer_expires_at']) {
      expect(cols, `Missing column: ${col}`).toContain(col)
    }
  })
})

describe('compliance_records columns', () => {
  it('has date_reviewed, next_review_due, assigned_to, notes', async () => {
    const cols = await columnNames('compliance_records')
    for (const col of ['date_reviewed', 'next_review_due', 'assigned_to', 'notes']) {
      expect(cols, `Missing column: ${col}`).toContain(col)
    }
  })
})

// ── Reference data seeded ─────────────────────────────────────────────────────

describe('reference data', () => {
  it('klo_items has 24 rows', async () => {
    const { rows } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM public.klo_items`
    )
    expect(parseInt(rows[0].count)).toBe(24)
  })

  it('key_questions has 5 rows', async () => {
    const { rows } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM public.key_questions`
    )
    expect(parseInt(rows[0].count)).toBe(5)
  })

  it('RLS helper functions exist', async () => {
    const { rows } = await client.query<{ proname: string }>(
      `SELECT proname FROM pg_proc
       WHERE proname IN ('get_user_org_id', 'get_user_role')
       AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`
    )
    const names = rows.map((r) => r.proname)
    expect(names).toContain('get_user_org_id')
    expect(names).toContain('get_user_role')
  })
})
