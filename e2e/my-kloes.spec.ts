/**
 * My KLOEs (app/dashboard/my-kloes/) — the personal, assigned-only view for
 * `user`-role team members.
 *
 * kloe-assignment.spec.ts already drives the real assign/unassign UI and
 * confirms a KLOE appears and disappears here, plus the empty state and
 * cross-KLOE isolation (an unassigned control KLOE never leaks in) — this
 * spec deliberately doesn't repeat that. What it covers instead, all
 * previously untested:
 *
 *   - Admin and Viewer roles are redirected away entirely (this page is
 *     `user`-role only; page.tsx's own role !== 'user' check).
 *   - RAG-based sort order (red first) across multiple assigned KLOEs, and
 *     the red-only "This KLOE is overdue" warning banner.
 *
 * Compliance-record state (date_reviewed/next_review_due, the two fields
 * calculateRAG actually reads) is set directly via the admin client rather
 * than through the real rating form — that form itself is already covered
 * end-to-end by kloe-rating.spec.ts; this spec is about My KLOEs' own
 * rendering logic, not re-proving the rating flow. Every org gets a
 * compliance_records row per klo_item the moment its dashboard first
 * renders (lib/seed-compliance.ts, self-healing) — see kloe-rating.spec.ts's
 * own doc comment — so these are updates, not inserts.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

test('Admin and Viewer are redirected away from My KLOEs', async ({ page, browser }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // ── Admin ─────────────────────────────────────────────────────────────
  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/my-kloes')
  await page.waitForURL('**/dashboard')
  await expect(page.getByRole('heading', { name: 'My KLOEs' })).toHaveCount(0)

  // ── Viewer ────────────────────────────────────────────────────────────
  await page.goto('/dashboard/account?tab=team')
  const visitorEmail = `e2e-my-kloes-viewer-${Date.now()}@alwaysready.invalid`
  await page.locator('#visitor_full_name').fill('E2E My KLOEs Viewer')
  await page.locator('#visitor_email').fill(visitorEmail)
  await page.locator('#duration_days').fill('1')
  await page.getByRole('button', { name: 'Create visitor login' }).click()
  await expect(page.getByText('Temporary password — share this now')).toBeVisible()
  const visitorPassword = (await page.locator('p.font-mono').innerText()).trim()

  const viewerContext = await browser.newContext()
  const viewerPage = await viewerContext.newPage()
  await login(viewerPage, { email: visitorEmail, password: visitorPassword })
  await viewerPage.waitForURL('**/dashboard')
  await viewerPage.goto('/dashboard/my-kloes')
  await viewerPage.waitForURL('**/dashboard')
  await expect(viewerPage.getByRole('heading', { name: 'My KLOEs' })).toHaveCount(0)
  await viewerContext.close()

  // Cleanup: remove the temporary viewer login.
  const { data: visitorRow } = await admin.from('users').select('id').eq('email', visitorEmail).single()
  if (visitorRow) await admin.auth.admin.deleteUser(visitorRow.id)
})

test('My KLOEs sorts red-before-green and shows the overdue warning only on the red one', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // Two fresh KLOEs, untouched by any other spec's own .range() picks
  // (see e.g. reports.spec.ts's 17-20, daily-report.spec.ts's 12-16).
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title, key_questions(name)')
    .order('display_order')
    .range(21, 22)
  expect(kloErr).toBeNull()
  expect(kloItems?.length).toBe(2)
  const [overdueKlo, upToDateKlo] = kloItems! as unknown as { id: string; title: string; key_questions: { name: string } }[]

  // Reset the teammate's password (a shared fixture other specs also mutate).
  const { error: pwErr } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwErr).toBeNull()

  // Defensive: also clear any MFA factor left over from a previous run of
  // this same spec failing before its own cleanup ran (confirmed happens —
  // login() below assumes a fresh, factor-less teammate exactly like
  // completeMandatoryMfaSetup expects).
  const { data: staleFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of staleFactors?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }

  // Red: reviewed 100 days ago on a 30-day cycle -> next_review_due ~70 days in the past.
  const { error: overdueErr } = await admin
    .from('compliance_records')
    .update({
      assigned_to: account.teammate.userId,
      status: 'in_progress',
      date_reviewed: daysAgo(100),
      review_frequency_days: 30,
      next_review_due: daysAgo(70),
    })
    .eq('organisation_id', account.orgId)
    .eq('klo_item_id', overdueKlo.id)
  expect(overdueErr).toBeNull()

  // Green: reviewed today on a 90-day cycle -> next_review_due ~90 days out.
  const { error: greenErr } = await admin
    .from('compliance_records')
    .update({
      assigned_to: account.teammate.userId,
      status: 'completed',
      date_reviewed: daysAgo(0),
      review_frequency_days: 90,
      next_review_due: daysFromNow(90),
    })
    .eq('organisation_id', account.orgId)
    .eq('klo_item_id', upToDateKlo.id)
  expect(greenErr).toBeNull()

  await login(page, { email: account.teammate.email, password: account.teammate.password })
  await completeMandatoryMfaSetup(page)
  await page.goto('/dashboard/my-kloes')

  await expect(page.getByRole('heading', { name: 'My KLOEs' })).toBeVisible()

  const cards = page.locator('div.bg-card.rounded-xl.border.border-line.p-4')
  await expect(cards).toHaveCount(2)

  // Red-first sort: the overdue KLOE's card must precede the up-to-date one.
  const overdueCard = cards.filter({ has: page.getByRole('link', { name: overdueKlo.title, exact: true }) })
  const upToDateCard = cards.filter({ has: page.getByRole('link', { name: upToDateKlo.title, exact: true }) })
  await expect(overdueCard).toBeVisible()
  await expect(upToDateCard).toBeVisible()
  const overdueBox = await overdueCard.boundingBox()
  const upToDateBox = await upToDateCard.boundingBox()
  expect(overdueBox!.y).toBeLessThan(upToDateBox!.y)

  // The key question label is shown on each card. exact: true -- the KQ
  // name (e.g. "Safe") is otherwise a substring match of some KLOE titles
  // themselves (e.g. "Safe staffing"), a real strict-mode collision here.
  await expect(overdueCard.getByText(overdueKlo.key_questions.name, { exact: true })).toBeVisible()
  await expect(upToDateCard.getByText(upToDateKlo.key_questions.name, { exact: true })).toBeVisible()

  // Overdue warning: only on the red card.
  await expect(overdueCard.getByText('This KLOE is overdue. Please update it as soon as possible.')).toBeVisible()
  await expect(upToDateCard.getByText('This KLOE is overdue. Please update it as soon as possible.')).toHaveCount(0)

  // Footer link back to the full KLOE list, shown whenever the list isn't empty.
  await expect(page.getByRole('link', { name: 'View all KLOEs →' })).toHaveAttribute('href', '/dashboard/kloes')

  // "Update →" genuinely navigates to the KLOE's own detail page.
  await overdueCard.getByRole('link', { name: 'Update →' }).click()
  await page.waitForURL(`**/dashboard/kloes/${overdueKlo.id}`)

  // Cleanup: unassign both so this org's state doesn't carry into a later
  // run of this same spec (the seed script also resets it, but this spec
  // shouldn't rely on that alone), and remove the MFA factor this test
  // enrolled -- same reasoning as every other spec sharing this account.
  await admin
    .from('compliance_records')
    .update({ assigned_to: null })
    .eq('organisation_id', account.orgId)
    .in('klo_item_id', [overdueKlo.id, upToDateKlo.id])

  const { data: factors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of factors?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }
})
