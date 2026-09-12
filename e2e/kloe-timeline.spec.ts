/**
 * KLOE audit trail / timeline reflects the changes made to it.
 *
 * The timeline page (app/dashboard/kloes/[kloId]/timeline/page.tsx) merges
 * three separate history tables into one chronological feed:
 *   - compliance_record_history — every review save (status/date/notes/etc)
 *   - priority_history          — only inserted when priority actually changes
 *   - review_frequency_history  — only inserted when frequency actually changes
 *
 * This drives two real review saves through the same KloeForm item 4 uses,
 * with a deliberately known, non-trivial set of changes between them, then
 * confirms the timeline genuinely reflects it: correct total count, correct
 * per-type counts, correct newest-first ordering, and the "changed" diff
 * pill appearing exactly where a value actually changed between saves (and
 * nowhere else). Also uploads one evidence file to the same KLOE and
 * confirms a real, easy-to-assume-wrong distinction: evidence uploads do
 * NOT appear as timeline entries at all (kloe_evidence isn't one of the
 * three history tables above) — but the main KLOE page's own "Audit trail"
 * summary line does count the file separately from compliance updates.
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

const VALID_PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n' +
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n' +
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
  'xref\n0 4\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n0\n%%EOF'
)

test('KLOE timeline reflects rating changes, excludes evidence uploads, diff pill matches what actually changed', async ({ page }) => {
  const account = loadTestAccount()

  const admin = getAdminClient()
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title')
    .order('display_order')
    .range(2, 2) // a third, still-untouched KLOE — distinct from both kloe-rating.spec.ts (index 0) and kloe-evidence-upload.spec.ts (index 1)
  expect(kloErr).toBeNull()
  expect(kloItems?.length).toBe(1)
  const kloId = kloItems![0].id

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto(`/dashboard/kloes/${kloId}`)

  // ── Save 1: priority 3->1 (real change), frequency 90->60 (real change) ─
  await page.locator('#status').selectOption('completed')
  await page.locator('#priority').selectOption('1')
  await page.locator('#date_reviewed').fill(daysAgo(7))
  await page.locator('#review_frequency_days').selectOption('60')
  await page.getByRole('button', { name: 'Save to audit trail' }).click()
  await expect(page.getByText('KLOE updated and saved to your audit trail.')).toBeVisible()

  // Confirms the fix in kloe-form.tsx: without it, priority/frequency would
  // have already reverted to their original pre-edit values here (React 19
  // resets an uncontrolled form to its mount-time defaultValue after a
  // successful submit) — a second save that doesn't reselect them would
  // then silently resubmit those stale values, overwriting save 1's change.
  await expect(page.locator('#priority')).toHaveValue('1')
  await expect(page.locator('#review_frequency_days')).toHaveValue('60')

  // ── Save 2: only the date changes (priority/frequency left as-is) ───────
  await page.locator('#status').selectOption('completed') // unchanged
  await page.locator('#date_reviewed').fill(daysAgo(0)) // changed vs save 1
  await page.getByRole('button', { name: 'Save to audit trail' }).click()
  await expect(page.getByText('KLOE updated and saved to your audit trail.')).toBeVisible()

  // ── Upload one evidence file — should NOT become a timeline entry ───────
  await page.getByLabel('Upload evidence file').setInputFiles({
    name: 'audit-trail-check.pdf',
    mimeType: 'application/pdf',
    buffer: VALID_PDF_BYTES,
  })
  await expect(page.locator('li', { hasText: 'audit-trail-check.pdf' })).toBeVisible()

  // ── Main page's own summary line: counts reviews and files separately ──
  await expect(page.getByText(/2 compliance updates.*1 file uploaded/)).toBeVisible()

  // Cross-check against the database directly, not just the rendered counts.
  const [{ data: reviewRows }, { data: priorityRows }, { data: freqRows }, { data: evidenceRows }] = await Promise.all([
    admin.from('compliance_record_history').select('id').eq('klo_item_id', kloId),
    admin.from('priority_history').select('id, old_priority, new_priority').eq('klo_item_id', kloId),
    admin.from('review_frequency_history').select('id, old_frequency_days, new_frequency_days').eq('klo_item_id', kloId),
    admin.from('kloe_evidence').select('id').eq('klo_item_id', kloId),
  ])
  expect(reviewRows).toHaveLength(2)
  expect(priorityRows).toHaveLength(1)
  expect(priorityRows![0]).toMatchObject({ old_priority: 3, new_priority: 1 })
  expect(freqRows).toHaveLength(1)
  expect(freqRows![0]).toMatchObject({ old_frequency_days: 90, new_frequency_days: 60 })
  expect(evidenceRows).toHaveLength(1)

  // ── The timeline page itself ─────────────────────────────────────────────
  await page.goto(`/dashboard/kloes/${kloId}/timeline`)

  // The count and "total entries" label render as two separate sibling
  // spans with no literal space between them in markup — match loosely.
  await expect(page.getByText(/4\s*total\s*entries/)).toBeVisible()
  await expect(page.getByText('2 Compliance reviews')).toBeVisible()
  await expect(page.getByText('1 Review frequency changed')).toBeVisible()
  await expect(page.getByText('1 Priority changed')).toBeVisible()

  const entries = page.locator('ol[aria-label="Audit trail timeline"] > li')
  await expect(entries).toHaveCount(4)

  // Newest-first: save 2's review entry is unambiguously the latest — it
  // happened strictly after every entry from save 1 (all inserted within
  // that single earlier form submission).
  const latest = entries.first()
  await expect(latest.getByText('Latest')).toBeVisible()
  await expect(latest.getByText('Compliance review')).toBeVisible()
  // Its date changed vs. save 1 — the diff pill should say so...
  await expect(latest.locator('dt', { hasText: 'Date of review' }).getByText('changed')).toBeVisible()
  // ...but status didn't change between the two saves, so no pill there.
  await expect(latest.locator('dt', { hasText: 'Status' }).getByText('changed')).not.toBeVisible()

  // The priority-change entry reflects the real old -> new values.
  const priorityEntry = entries.filter({ hasText: 'Priority changed' })
  await expect(priorityEntry).toHaveCount(1)
  await expect(priorityEntry.locator('[aria-label="Priority 3"]')).toBeVisible()
  await expect(priorityEntry.locator('[aria-label="Priority 1"]')).toBeVisible()

  // The frequency-change entry reflects the real old -> new values.
  const frequencyEntry = entries.filter({ hasText: 'Review frequency changed' })
  await expect(frequencyEntry).toHaveCount(1)
  await expect(frequencyEntry.getByText('Quarterly (90 days)')).toBeVisible()
  await expect(frequencyEntry.getByText('Every 2 months (60 days)')).toBeVisible()

  // Evidence upload never appears here at all — only on the KLOE's own page.
  await expect(page.getByText('audit-trail-check.pdf')).not.toBeVisible()
})
