/**
 * Daily Review Report.
 *
 * app/dashboard/daily-report/page.tsx used to have its OWN "due soon"
 * window, hardcoded to 30 days — a real, live divergence from lib/rag.ts's
 * calculateRAG (14 days) found by an earlier version of this spec. A KLOE
 * reviewed such that its next review was 15-30 days out was RAG-green
 * everywhere else (the KLOE list, the KLOE's own page, the dashboard) but
 * still showed up here under "Due within 30 days". Confirmed 14 days is the
 * correct "due soon" window; the Daily Report now imports
 * lib/rag.ts's DUE_SOON_DAYS instead of hardcoding its own, so this spec now
 * verifies alignment instead of divergence — including a direct regression
 * check that a KLOE just past the (now shared) window is genuinely omitted
 * from the report, the exact case that used to wrongly appear.
 *
 * Also verifies the report's other real classification rules: overdue
 * items appear under "Overdue" with the right "N days overdue" context;
 * never-reviewed KLOEs appear under "Never assessed"; and a KLOE that's
 * both completed AND genuinely not due for a long time is omitted from the
 * report entirely (its whole stated purpose is triage, not a full list).
 *
 * Assertions are scoped to specific KLOEs by title within each section
 * (not exact section totals or list order) — a freshly-seeded org still
 * has plenty of other untouched KLOEs that legitimately belong in "Never
 * assessed" too, so asserting a hardcoded total would be testing this
 * org's overall KLOE count, not the report's own logic.
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

async function rateKloe(
  page: import('@playwright/test').Page,
  kloId: string,
  { status, date, frequency }: { status: string; date: string; frequency: string }
) {
  await page.goto(`/dashboard/kloes/${kloId}`)
  await page.locator('#status').selectOption(status)
  await page.locator('#date_reviewed').fill(date)
  await page.locator('#review_frequency_days').selectOption(frequency)
  await page.getByRole('button', { name: 'Save to audit trail' }).click()
  await expect(page.getByText('KLOE updated and saved to your audit trail.')).toBeVisible()
}

test('Daily Review Report: overdue, the 14-day amber window agreeing with RAG, never-assessed, and omits safe KLOEs', async ({ page }) => {
  const account = loadTestAccount()
  const admin = getAdminClient()

  // Five KLOEs at indices 12-16 -- untouched by every other spec in this
  // suite (see each spec's own .range()/.limit() picks: 0 kloe-rating &
  // peoples-voice, 1 kloe-evidence-upload, 2 kloe-timeline, 3
  // readiness-dashboard, 8 inspection-pack, 9-10 kloe-assignment, 11
  // visitor-login).
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title')
    .order('display_order')
    .range(12, 16)
  expect(kloErr).toBeNull()
  expect(kloItems?.length).toBe(5)
  const [kloOverdue, kloDueSoon, kloJustOutside, kloUntouched, kloSafeGreen] = kloItems!

  await login(page, account)
  await page.waitForURL('**/dashboard')

  // ── Overdue: 40 days ago, monthly -> 10 days overdue ────────────────────
  await rateKloe(page, kloOverdue.id, { status: 'completed', date: daysAgo(40), frequency: '30' })

  // ── Due soon, agreeing everywhere: reviewed 20 days ago, monthly ->
  // next review due in 10 days, inside both the report's and calculateRAG's
  // (now shared) 14-day window. Should be amber both in the report and on
  // its own page. ──────────────────────────────────────────────────────────
  await rateKloe(page, kloDueSoon.id, { status: 'completed', date: daysAgo(20), frequency: '30' })

  // ── Just outside the window, agreeing everywhere: reviewed today,
  // monthly -> next review due in exactly 30 days. Under the report's old,
  // divergent 30-day window this wrongly showed up here despite being RAG
  // green everywhere else -- the exact bug that was fixed. Now it should be
  // green on its own page AND correctly absent from the report entirely. ──
  await rateKloe(page, kloJustOutside.id, { status: 'completed', date: daysAgo(0), frequency: '30' })

  // ── Genuinely safe: reviewed today, quarterly -> due in 90 days. Green
  // by any measure, and should be OMITTED from the report entirely. ──────
  await rateKloe(page, kloSafeGreen.id, { status: 'completed', date: daysAgo(0), frequency: '90' })

  // kloUntouched is deliberately left alone — auto-seeded default
  // (not_started, never reviewed) is exactly what "Never assessed" means.

  await page.goto('/dashboard/daily-report')

  // ── Overdue section ──────────────────────────────────────────────────────
  const overdueSection = page.locator('section', { has: page.getByRole('heading', { name: /Overdue/ }) })
  const overdueRow = overdueSection.locator('tr', { hasText: kloOverdue.title })
  await expect(overdueRow).toBeVisible()
  // The due-context text renders twice in the row — once inline next to
  // the title (always shown), once in the dedicated RAG column (shown from
  // md breakpoint up, which includes the default test viewport) — both
  // correct, so either one confirms the text is genuinely there.
  await expect(overdueRow.getByText('10 days overdue').first()).toBeVisible()

  // ── Due within 14 days: agrees with RAG, not a wider report-only window ──
  const dueSoonSection = page.locator('section', { has: page.getByRole('heading', { name: /Due within 14 days/ }) })
  const dueSoonRow = dueSoonSection.locator('tr', { hasText: kloDueSoon.title })
  await expect(dueSoonRow).toBeVisible()
  await expect(dueSoonRow.getByText('Due in 10 days').first()).toBeVisible()

  // Confirm agreement directly: this KLOE's own page also shows RAG amber,
  // the same status the report gave it.
  await page.goto(`/dashboard/kloes/${kloDueSoon.id}`)
  await expect(page.locator('[aria-label="RAG status: Due Soon"]')).toBeVisible()

  // ── Regression: a KLOE due in exactly 30 days used to wrongly appear in
  // the report's old, wider window despite being RAG green. Confirm it's
  // green on its own page AND correctly absent from the report now. ───────
  await page.goto(`/dashboard/kloes/${kloJustOutside.id}`)
  await expect(page.locator('[aria-label="RAG status: Up to Date"]')).toBeVisible()
  await page.goto('/dashboard/daily-report')
  await expect(page.locator('tr', { hasText: kloJustOutside.title })).toHaveCount(0)

  // ── Never assessed ────────────────────────────────────────────────────────
  const unassessedSection = page.locator('section', { has: page.getByRole('heading', { name: /Never assessed/ }) })
  await expect(unassessedSection.locator('tr', { hasText: kloUntouched.title })).toBeVisible()

  // ── Omitted entirely: a genuinely safe, completed KLOE has no place here
  await expect(page.locator('tr', { hasText: kloSafeGreen.title })).toHaveCount(0)
})
