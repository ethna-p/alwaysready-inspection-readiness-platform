/**
 * Readiness Dashboard reflects the rating.
 *
 * The main dashboard (app/dashboard/page.tsx) computes "up to date" from
 * scratch on every render — status === 'completed' AND next_review_due is
 * still in the future (isCompliant()) — never a stored flag. This drives
 * one real KLOE from its auto-seeded default (never reviewed, so not
 * compliant) to genuinely compliant via the real UI form, and confirms
 * both the overall readiness figure and this KLOE's own key-question
 * breakdown card move by exactly the expected delta — computed
 * independently against the database before and after, not assumed.
 *
 * Deliberately doesn't assert an absolute percentage (this org's total
 * KLOE count isn't a number worth hardcoding into a test) — it asserts the
 * genuine before/after DELTA that this one real change should produce,
 * cross-checked against a database-level recomputation of the same
 * isCompliant() logic the page itself uses.
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

test('readiness dashboard reflects a real rating change, overall and per key question', async ({ page }) => {
  const account = loadTestAccount()
  const admin = getAdminClient()

  // A fourth, still-untouched KLOE — distinct from the ones kloe-rating,
  // kloe-evidence-upload, and kloe-timeline specs each already mutate.
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, key_question_id, key_questions(name)')
    .order('display_order')
    .range(3, 3)
  expect(kloErr).toBeNull()
  expect(kloItems?.length).toBe(1)
  const targetKlo = kloItems![0] as unknown as { id: string; key_question_id: string; key_questions: { name: string } }
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

  // ── Before: ground truth from the database, independent of the UI ──────
  const before = await computeCounts()
  const beforeOverallPct = pct(before.overallCompliant, before.overallTotal)
  const beforeKqPct = pct(before.kqCompliant, before.kqTotal)

  await login(page, account)
  await page.waitForURL('**/dashboard')

  // The overall "X of Y" line is unique on the page — its own section only
  // ever renders once — but per-KQ cards can coincidentally share the same
  // count (two key questions both happening to have e.g. "0 of 4"), so
  // that check needs to be scoped to this specific KQ's card. Its
  // progressbar aria-label is unique (by KQ name); its "X of Y" paragraph
  // is the element immediately following it in the same card.
  const kqProgressbar = page.locator(`[role="progressbar"][aria-label="${kqName} readiness"]`)
  const kqUpToDateText = kqProgressbar.locator('xpath=following-sibling::p[1]')

  await expect(page.locator(`[aria-label="${beforeOverallPct} percent overall readiness"]`)).toBeVisible()
  await expect(page.getByText(new RegExp(`^${before.overallCompliant} of ${before.overallTotal} KLOEs up to date$`))).toBeVisible()
  await expect(kqProgressbar).toHaveAttribute('aria-valuenow', String(beforeKqPct))
  await expect(kqUpToDateText).toHaveText(new RegExp(`^${before.kqCompliant} of ${before.kqTotal} KLOEs up to date$`))

  // ── Make the chosen KLOE genuinely compliant via the real UI form ──────
  // status=completed + next_review_due in the future (today + 90 days,
  // the default frequency) is exactly what isCompliant() requires.
  await page.goto(`/dashboard/kloes/${targetKlo.id}`)
  await page.locator('#status').selectOption('completed')
  const todayStr = new Date().toISOString().slice(0, 10)
  await page.locator('#date_reviewed').fill(todayStr)
  await page.getByRole('button', { name: 'Save to audit trail' }).click()
  await expect(page.getByText('KLOE updated and saved to your audit trail.')).toBeVisible()

  // ── After: the database-level truth should have moved by exactly +1 ────
  const after = await computeCounts()
  expect(after.overallTotal).toBe(before.overallTotal) // no KLOEs created/deleted
  expect(after.overallCompliant).toBe(before.overallCompliant + 1)
  expect(after.kqTotal).toBe(before.kqTotal)
  expect(after.kqCompliant).toBe(before.kqCompliant + 1)

  const afterOverallPct = pct(after.overallCompliant, after.overallTotal)
  const afterKqPct = pct(after.kqCompliant, after.kqTotal)

  await page.goto('/dashboard')

  await expect(page.locator(`[aria-label="${afterOverallPct} percent overall readiness"]`)).toBeVisible()
  await expect(page.getByText(new RegExp(`^${after.overallCompliant} of ${after.overallTotal} KLOEs up to date$`))).toBeVisible()
  await expect(kqProgressbar).toHaveAttribute('aria-valuenow', String(afterKqPct))
  await expect(kqUpToDateText).toHaveText(new RegExp(`^${after.kqCompliant} of ${after.kqTotal} KLOEs up to date$`))
})
