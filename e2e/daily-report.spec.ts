/**
 * Daily Review Report.
 *
 * app/dashboard/daily-report/page.tsx has its OWN classification logic,
 * deliberately different from lib/rag.ts's calculateRAG in one specific,
 * easy-to-miss way: its "due soon" window is 30 days, not calculateRAG's
 * 14. A KLOE reviewed such that its next review is, say, 20-30 days out is
 * RAG-green everywhere else (the KLOE list, the KLOE's own page, the
 * dashboard) but still shows up here under "Due within 30 days" — this is
 * the single most valuable thing to verify about this page, since it's
 * exactly the kind of divergence a naive "just reuse calculateRAG" refactor
 * would silently break.
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

test('Daily Review Report: overdue, the 30-day amber window that RAG green misses, never-assessed, and omits long-safe KLOEs', async ({ page }) => {
  const account = loadTestAccount()
  const admin = getAdminClient()

  // Four fifth-through-eighth KLOEs — untouched by every earlier spec in
  // this suite (kloe-rating, kloe-evidence-upload, kloe-timeline, and
  // readiness-dashboard each already claim indices 0-3).
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title')
    .order('display_order')
    .range(4, 7)
  expect(kloErr).toBeNull()
  expect(kloItems?.length).toBe(4)
  const [kloOverdue, kloAmberOnly, kloUntouched, kloSafeGreen] = kloItems!

  await login(page, account)
  await page.waitForURL('**/dashboard')

  // ── Overdue: 40 days ago, monthly -> 10 days overdue ────────────────────
  await rateKloe(page, kloOverdue.id, { status: 'completed', date: daysAgo(40), frequency: '30' })

  // ── The 30-day-vs-14-day divergence: reviewed today, monthly frequency
  // -> next review due in exactly 30 days. calculateRAG would call this
  // green (well past its own 14-day window); the Daily Report's wider
  // 30-day window puts it under "Due within 30 days" regardless. ─────────
  await rateKloe(page, kloAmberOnly.id, { status: 'completed', date: daysAgo(0), frequency: '30' })

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

  // ── Due within 30 days: the KLOE RAG would call green ───────────────────
  const dueSoonSection = page.locator('section', { has: page.getByRole('heading', { name: /Due within 30 days/ }) })
  const dueSoonRow = dueSoonSection.locator('tr', { hasText: kloAmberOnly.title })
  await expect(dueSoonRow).toBeVisible()
  await expect(dueSoonRow.getByText('Due in 30 days').first()).toBeVisible()

  // Confirm the divergence directly: this same KLOE's own page shows RAG
  // green, not amber, even though it's sitting in the report's amber list.
  await page.goto(`/dashboard/kloes/${kloAmberOnly.id}`)
  await expect(page.locator('[aria-label="RAG status: Up to Date"]')).toBeVisible()
  await expect(page.locator('[aria-label="RAG status: Due Soon"]')).not.toBeVisible()

  // ── Never assessed ────────────────────────────────────────────────────────
  await page.goto('/dashboard/daily-report')
  const unassessedSection = page.locator('section', { has: page.getByRole('heading', { name: /Never assessed/ }) })
  await expect(unassessedSection.locator('tr', { hasText: kloUntouched.title })).toBeVisible()

  // ── Omitted entirely: a genuinely safe, completed KLOE has no place here
  await expect(page.locator('tr', { hasText: kloSafeGreen.title })).toHaveCount(0)
})
