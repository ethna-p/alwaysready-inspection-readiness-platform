/**
 * Rate a KLOE: status, priority, review frequency -> confirm RAG status
 * updates for real, across the full range calculateRAG (lib/rag.ts) defines:
 *
 *   Grey  (Unassessed) -- never reviewed
 *   Green (Up to Date)  -- reviewed, next review not due soon
 *   Amber (Due Soon)    -- next review within 14 days
 *   Red   (Overdue)     -- next review date has passed
 *
 * RAG is never stored -- it's recalculated on every render from
 * date_reviewed + review_frequency_days (via next_review_due). This drives
 * the real form (KloeForm) through a real server action
 * (updateKloCompliance), which inserts into compliance_record_history; a DB
 * trigger upserts compliance_records from that. Each step re-reads the
 * rendered page rather than assuming the transition worked.
 *
 * Note on the starting state: every org gets a compliance_records row for
 * every klo_item the moment its dashboard first renders
 * (lib/seed-compliance.ts's ensureComplianceRecordsSeeded, self-healing,
 * called from the dashboard layout) -- so `record` itself is never null by
 * the time this test reaches a KLOE page, only its date_reviewed is. The
 * row's DB defaults (supabase/migrations/20260714000006_compliance_tables.sql):
 * status='not_started', priority=3, review_frequency_days=90,
 * date_reviewed=NULL. RAG is grey either way, since calculateRAG only looks
 * at date_reviewed/next_review_due -- but the page's "no review yet" empty
 * state is keyed off `record` being null, which it never is here, so the
 * real starting UI is the normal status card with those defaults, not the
 * empty state.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function ragLocator(page: import('@playwright/test').Page, label: string) {
  return page.locator(`[aria-label="RAG status: ${label}"]`).first()
}

test('rating a KLOE updates status, priority, and frequency, and RAG tracks the review date', async ({ page }) => {
  const account = loadTestAccount()

  // Any klo_item works — this org is freshly seeded (npm run test:e2e:seed
  // always wipes and recreates one from scratch), so every KLOE still has
  // its auto-seeded default record, untouched by a real review yet.
  const admin = getAdminClient()
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title')
    .order('display_order')
    .limit(1)
  expect(kloErr).toBeNull()
  expect(kloItems?.length).toBe(1)
  const kloId = kloItems![0].id

  await login(page, account)
  await page.waitForURL('**/dashboard')

  await page.goto(`/dashboard/kloes/${kloId}`)

  // ── Grey: auto-seeded record, never actually reviewed ───────────────────
  await expect(ragLocator(page, 'Unassessed')).toBeVisible()
  await expect(page.locator('[aria-label="Priority 3"]')).toBeVisible() // DB default
  await expect(page.getByRole('heading', { name: 'Update this KLOE' })).toBeVisible()

  // ── Green: reviewed today, quarterly frequency (next due ~90 days out) ──
  await page.locator('#status').selectOption('completed')
  await page.locator('#priority').selectOption('2')
  await page.locator('#date_reviewed').fill(daysAgo(0))
  await page.locator('#review_frequency_days').selectOption('90')
  await page.getByRole('button', { name: 'Save to audit trail' }).click()

  await expect(page.getByText('KLOE updated and saved to your audit trail.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Update this KLOE' })).toBeVisible()
  await expect(ragLocator(page, 'Up to Date')).toBeVisible()
  await expect(page.locator('[aria-label="Priority 2"]')).toBeVisible()
  await expect(page.getByText('Quarterly', { exact: true })).toBeVisible()

  // ── Amber: reviewed 20 days ago, monthly frequency (next due in 10 days) ─
  await page.locator('#status').selectOption('completed')
  await page.locator('#date_reviewed').fill(daysAgo(20))
  await page.locator('#review_frequency_days').selectOption('30')
  await page.getByRole('button', { name: 'Save to audit trail' }).click()

  await expect(page.getByText('KLOE updated and saved to your audit trail.')).toBeVisible()
  await expect(ragLocator(page, 'Due Soon')).toBeVisible()
  await expect(page.getByText('Monthly', { exact: true })).toBeVisible()

  // ── Red: reviewed 40 days ago, monthly frequency (next due 10 days ago) ──
  await page.locator('#date_reviewed').fill(daysAgo(40))
  await page.locator('#review_frequency_days').selectOption('30')
  await page.getByRole('button', { name: 'Save to audit trail' }).click()

  await expect(page.getByText('KLOE updated and saved to your audit trail.')).toBeVisible()
  await expect(ragLocator(page, 'Overdue')).toBeVisible()

  // Confirm the change is visible somewhere other than just the page we
  // edited from — the same KLOE's row on the list page should show the
  // same RAG badge, scoped to that specific row rather than "a red badge
  // exists somewhere" (every other KLOE in this freshly-seeded org is
  // still untouched and grey, but scoping this properly is what makes the
  // assertion actually mean something).
  await page.goto('/dashboard/kloes')
  const kloRow = page.locator('tr', { hasText: kloItems![0].title })
  // The row renders the RAG badge twice — once inline for small screens
  // (hidden at this viewport width), once in the dedicated RAG column for
  // wider ones — both correct, but only the latter is actually visible here.
  await expect(kloRow.locator('[aria-label="RAG status: Overdue"]:visible')).toBeVisible()
})
