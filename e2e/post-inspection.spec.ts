/**
 * Post-Inspection: log a real CQC inspection outcome, track the Factual
 * Accuracy Challenge (FAC) deadline, manage FAC items through to
 * resolution, and record a staff briefing.
 *
 * Found and fixed one real, substantive bug while building this spec:
 * app/dashboard/post-inspection/{PostInspectionListClient,[id]/PostInspectionDetailClient}.tsx
 * both independently computed the FAC deadline as "draft received date +
 * 14 calendar days", commented as "10 working days ≈ 14 calendar days".
 * That approximation is mathematically exact for a draft received on any
 * weekday (verified directly for all seven start days) -- but silently
 * wrong, always in the provider's favour, whenever the logged received
 * date falls on a Saturday or Sunday: 1 day too late for a Saturday, 2
 * days too late for a Sunday. A real, reachable case (an admin logging
 * the calendar date a report literally arrived, e.g. by email, not
 * restricted to weekdays by the date picker), and a real consequence on
 * a genuine CQC regulatory deadline, not a cosmetic display bug. Fixed
 * with an actual working-days calculation, consolidated into
 * rating-utils.ts's facDaysRemaining() instead of two independently
 * drifting copies. This spec deliberately logs a Saturday-received draft
 * and asserts the exact (not approximate) days-remaining text, which
 * directly proves the fix -- the old code would have shown one day more.
 *
 * Uses the shared fixture admin account. post_inspection_reviews and
 * fac_items aren't KLOE-scoped, so unlike specs that rate real KLOEs,
 * this can't collide with any other spec's state.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'

/** Mirrors rating-utils.ts's addWorkingDays -- an independent reference
 * implementation so this test verifies the app's real output against its
 * own understanding of "10 working days", not just against itself. */
function addWorkingDays(start: Date, n: number): Date {
  const d = new Date(start)
  let added = 0
  while (added < n) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return d
}

function mostRecentSaturday(): Date {
  const d = new Date()
  const diff = (d.getDay() + 1) % 7 // days since the most recent Saturday
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateInput(d: Date): string {
  return d.toISOString().split('T')[0]
}

test('Post-Inspection: log an inspection, correct FAC deadline math, FAC item lifecycle, staff briefing', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()

  const draftReceived = mostRecentSaturday()
  const draftReceivedInput = toDateInput(draftReceived)

  // Independently-computed expected deadline, matching the app's fixed logic.
  const expectedDeadline = addWorkingDays(draftReceived, 10)
  const expectedDaysLeft = Math.ceil((expectedDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  await login(page, account)
  await page.waitForURL('**/dashboard')

  // ── Log a new inspection ──────────────────────────────────────────────────
  // GettingStartedWizard now defaults to collapsed here -- its fixed
  // bottom-right panel used to auto-open full size on every dashboard
  // page's first visit, genuinely blocking this page's own "+ Log
  // inspection" button (confirmed directly: Playwright's own actionability
  // check reported the panel's subtree intercepting pointer events on it).
  // Fixed in components/GettingStartedWizard.tsx to only auto-open on
  // /dashboard itself; see that file's own comment. Asserted directly
  // (collapsed, not just "happens not to block the click this time") --
  // this is the actual regression proof for that fix.
  await page.goto('/dashboard/post-inspection')
  await expect(page.getByRole('button', { name: 'Expand getting started guide' })).toBeVisible()
  await page.getByRole('button', { name: '+ Log inspection' }).click()

  await page.locator('input[name="inspection_date"]').fill(draftReceivedInput)
  await page.locator('input[name="draft_received_date"]').fill(draftReceivedInput)
  await page.locator('input[name="inspector_name"]').fill('E2E Inspector')
  await page.locator('select[name="overall_rating"]').selectOption('requires_improvement')
  await page.locator('select[name="safe_rating"]').selectOption('requires_improvement')
  await page.locator('textarea[name="key_findings"]').fill('E2E: medication administration records incomplete for two residents.')
  await page.getByRole('button', { name: 'Save and open' }).click()

  // Server action redirects straight to the detail page on success.
  await page.waitForURL(/\/dashboard\/post-inspection\/[a-f0-9-]+$/)

  // ── FAC deadline: exact, not approximate ─────────────────────────────────
  // This is the regression check -- the old "+14 calendar days" code would
  // show a value exactly one day higher than this for a Saturday start.
  await expect(page.getByText(
    `⏱ Factual Accuracy Challenge deadline: ${expectedDaysLeft} day${expectedDaysLeft !== 1 ? 's' : ''} remaining (10 working days from draft received).`
  )).toBeVisible()

  await expect(page.getByText('Requires Improvement', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('E2E Inspector')).toBeVisible()

  // ── Add a FAC item ────────────────────────────────────────────────────────
  await page.getByRole('button', { name: '+ Add FAC item' }).click()
  await page.locator('select[name="key_question"]').selectOption('Safe')
  await page.locator('select[name="dispute_type"]').selectOption('factual_error')
  await page.locator('textarea[name="inspector_finding"]').fill('E2E: report states MAR charts were unsigned for resident A on 3 occasions.')
  await page.locator('textarea[name="our_position"]').fill('E2E: MAR charts were signed; inspector reviewed an outdated copy.')
  await page.locator('input[name="evidence_reference"]').fill('E2E: MAR chart originals, June 2026')
  await page.getByRole('button', { name: 'Save FAC item' }).click()

  await expect(page.getByText('1 pending')).toBeVisible()

  // The whole card header (key question, dispute label, status badge, and
  // finding preview) is one <button> -- its accessible name is a superset
  // of all that text, so a substring match on the finding text alone is
  // enough to find and expand it, without the ambiguity risk of a generic
  // div + hasText filter (already hit once this session, on a different
  // spec) potentially resolving to the wrong ancestor.
  const facToggle = page.getByRole('button', { name: /MAR charts were unsigned/ })
  await expect(facToggle).toBeVisible()
  await facToggle.click()

  // Expand and confirm the full content, not just the truncated preview line.
  await expect(page.getByText('MAR charts were signed; inspector reviewed an outdated copy.')).toBeVisible()
  await expect(page.getByText('E2E: MAR chart originals, June 2026')).toBeVisible()

  // The card's own Edit/Delete buttons are siblings of the toggle button,
  // both children of the same outer card div -- one xpath level up reaches
  // exactly that card, not the whole FAC section.
  const facCard = facToggle.locator('xpath=..')

  // ── Resolve the FAC item: mark it upheld ─────────────────────────────────
  await facCard.getByRole('button', { name: 'Edit' }).click()
  await page.locator('select[name="status"]').selectOption('upheld')
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(page.getByText('1 upheld')).toBeVisible()

  // ── Edit the review: add a staff briefing ────────────────────────────────
  await page.getByRole('button', { name: 'Edit' }).first().click()
  await page.locator('textarea[name="staff_briefing"]').fill('E2E: reminder to countersign MAR charts immediately after administration, not retrospectively.')
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(page.getByText('reminder to countersign MAR charts immediately')).toBeVisible()

  // ── Confirm it's listed correctly back on the index ──────────────────────
  await page.goto('/dashboard/post-inspection')
  await expect(page.getByText('1 FAC item')).toBeVisible()
  await expect(page.getByText('Inspector: E2E Inspector')).toBeVisible()
})
