/**
 * Inspection Pack export.
 *
 * app/dashboard/inspection-pack/page.tsx is a print-optimised page — no PDF
 * library, just @media print CSS and the browser's own print-to-PDF via
 * window.print() (print-button.tsx). Genuinely exercising that means two
 * separate things, both covered here:
 *
 *   1. The report's DATA is correct — overall readiness, the per-key-
 *      question summary table, and the specific KLOE's own row in the full
 *      detail section all reflect a real rating change, cross-checked
 *      against a database-level recomputation (same methodology as
 *      readiness-dashboard.spec.ts), not assumed.
 *
 *   2. The EXPORT mechanism itself works: under print media emulation, the
 *      screen-only chrome (breadcrumb, the print button, the on-screen
 *      disclaimer) genuinely disappears and the print-only footer
 *      disclaimer genuinely appears — this is the whole point of the page
 *      ("when printed: just the report"), and it's real CSS behavior, not
 *      just markup that's present regardless. Clicking "Print / Save as
 *      PDF" is confirmed to actually invoke window.print() (stubbed —
 *      there's no way to drive the OS-level print dialog itself, or to
 *      inspect a PDF it would produce, from here).
 *
 * There used to be a second, completely separate PDF export
 * (app/api/evidence-pack/route.ts, real @react-pdf/renderer generation,
 * grouped by CQC evidence category) that had been deliberately unwired
 * from the UI in July (git history: "Remove CQC Evidence Pack button
 * from Inspection Pack page", 39 minutes after it was moved there) but
 * never actually deleted — found while building this spec, removed
 * (along with components/EvidencePackButton.tsx and
 * lib/evidence-categories.ts) on the user's confirmation, since nothing
 * in the product linked to it any more.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

interface ComplianceRow {
  klo_item_id: string
  status: string
  next_review_due: string | null
}

function isCompliant(record: ComplianceRow | undefined, now: Date): boolean {
  if (!record) return false
  return (
    record.status === 'completed' &&
    record.next_review_due !== null &&
    new Date(record.next_review_due) >= now
  )
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

test('Inspection Pack: data reflects a real rating change, and the print export actually behaves like one', async ({ page }) => {
  const account = loadTestAccount()
  const admin = getAdminClient()

  // A ninth, still-untouched KLOE.
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title, display_order, key_question_id, key_questions(name)')
    .order('display_order')
    .range(8, 8)
  expect(kloErr).toBeNull()
  expect(kloItems?.length).toBe(1)
  const targetKlo = kloItems![0] as unknown as {
    id: string; title: string; display_order: number
    key_question_id: string; key_questions: { name: string }
  }
  const kqName = targetKlo.key_questions.name

  async function computeCounts() {
    const now = new Date()
    const [{ data: allKlos }, { data: records }] = await Promise.all([
      admin.from('klo_items').select('id, key_question_id'),
      admin.from('compliance_records').select('klo_item_id, status, next_review_due'),
    ])
    const recordByKloId = new Map((records ?? []).map(r => [r.klo_item_id, r as ComplianceRow]))
    const overallTotal = (allKlos ?? []).length
    const overallCompliant = (allKlos ?? []).filter(k => isCompliant(recordByKloId.get(k.id), now)).length
    const kqKlos = (allKlos ?? []).filter(k => k.key_question_id === targetKlo.key_question_id)
    const kqTotal = kqKlos.length
    const kqCompliant = kqKlos.filter(k => isCompliant(recordByKloId.get(k.id), now)).length
    return { overallTotal, overallCompliant, kqTotal, kqCompliant }
  }

  const before = await computeCounts()

  await login(page, account)
  await page.waitForURL('**/dashboard')

  // Make the chosen KLOE genuinely compliant via the real UI form.
  await page.goto(`/dashboard/kloes/${targetKlo.id}`)
  await page.locator('#status').selectOption('completed')
  const todayStr = new Date().toISOString().slice(0, 10)
  await page.locator('#date_reviewed').fill(todayStr)
  await page.locator('#review_frequency_days').selectOption('90')
  await page.getByRole('button', { name: 'Save to audit trail' }).click()
  await expect(page.getByText('KLOE updated and saved to your audit trail.')).toBeVisible()

  const after = await computeCounts()
  expect(after.overallCompliant).toBe(before.overallCompliant + 1)
  expect(after.kqCompliant).toBe(before.kqCompliant + 1)
  const afterOverallPct = pct(after.overallCompliant, after.overallTotal)
  const afterKqPct = pct(after.kqCompliant, after.kqTotal)

  // ── The pack's data ──────────────────────────────────────────────────────
  await page.goto('/dashboard/inspection-pack')

  await expect(page.locator(`[aria-label="Overall readiness ${afterOverallPct} percent"]`)).toBeVisible()
  await expect(page.locator(`[role="progressbar"][aria-label="${afterOverallPct}% of KLOEs are up to date"]`)).toBeVisible()
  await expect(page.getByText(new RegExp(`^${after.overallCompliant} of ${after.overallTotal} KLOEs currently up to date$`))).toBeVisible()

  // Positional (td index), not free-text search within the row — kqCompliant
  // and kqTotal could coincidentally be equal (a fully "ready" KQ), which
  // would make an exact-text search inside the row genuinely ambiguous.
  const summarySection = page.locator('section[aria-labelledby="summary-heading"]')
  const kqSummaryRow = summarySection.locator('tr', { hasText: kqName })
  await expect(kqSummaryRow).toBeVisible()
  const kqCells = kqSummaryRow.locator('td')
  await expect(kqCells.nth(1)).toHaveText(String(after.kqCompliant)) // Ready
  await expect(kqCells.nth(2)).toHaveText(String(after.kqTotal))     // Total
  await expect(kqCells.nth(3)).toHaveText(`${afterKqPct}%`)          // %

  const kloRow = page.locator('tr', { hasText: targetKlo.title })
  await expect(kloRow).toBeVisible()
  const kloCells = kloRow.locator('td')
  await expect(kloCells.nth(2)).toHaveText('Completed')     // Status
  await expect(kloCells.nth(3)).toContainText('Up to Date') // RAG
  await expect(kloCells.nth(4)).toHaveText('3')             // Priority — default, untouched

  // ── The export mechanism: print media genuinely changes what's shown ────
  await expect(page.getByRole('button', { name: 'Print or save this pack as a PDF' })).toBeVisible()
  await expect(page.getByText('Important notice')).not.toBeVisible() // print-only footer, not shown on screen

  await page.emulateMedia({ media: 'print' })

  await expect(page.getByRole('button', { name: 'Print or save this pack as a PDF' })).not.toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).not.toBeVisible()
  await expect(page.getByText('Important notice')).toBeVisible()
  // The report itself is what printing is FOR — still there under print media.
  await expect(page.locator(`[aria-label="Overall readiness ${afterOverallPct} percent"]`)).toBeVisible()
  await expect(kloRow).toBeVisible()

  await page.emulateMedia({ media: 'screen' })

  // ── Clicking the button genuinely triggers the browser's print flow ─────
  await page.evaluate(() => {
    ;(window as unknown as { __printCalled: boolean }).__printCalled = false
    window.print = () => {
      ;(window as unknown as { __printCalled: boolean }).__printCalled = true
    }
  })
  await page.getByRole('button', { name: 'Print or save this pack as a PDF' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __printCalled: boolean }).__printCalled)).toBe(true)
})
