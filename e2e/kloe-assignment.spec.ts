/**
 * KLOE assignment -> assignee sees it on "My KLOEs".
 *
 * Drives the real AssignForm (app/dashboard/kloes/[kloId]/assign-form.tsx)
 * as the admin, then genuinely logs in as the teammate to confirm they see
 * exactly the assigned KLOE (and nothing else) on their own
 * /dashboard/my-kloes view — and that it disappears again once unassigned.
 *
 * The teammate fixture has no MFA factor enrolled, so a first login
 * genuinely hits middleware's mandatory-enrolment gate before reaching
 * anywhere in /dashboard at all — completed for real via
 * completeMandatoryMfaSetup (the same enroll -> compute code ->
 * challengeAndVerify() flow a real user goes through), not skipped past,
 * since that's exactly what a real newly-assigned teammate's first login
 * would look like.
 *
 * The teammate account is shared with other specs in this suite, and
 * other specs can change its password (a real password-reset spec has), so
 * this spec can't assume the fixture's original password still works. It
 * forces the password back to a known value via the admin API first,
 * rather than
 * assuming what state an unrelated spec happened to leave it in.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('assigning a KLOE to a teammate makes it appear on their My KLOEs, unassigning removes it', async ({ page, browser }) => {
  test.setTimeout(120_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // Two fresh KLOEs: one gets assigned, one stays untouched as a control
  // confirming My KLOEs only ever shows what's actually assigned.
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title, key_questions(name)')
    .order('display_order')
    .range(9, 10)
  expect(kloErr).toBeNull()
  expect(kloItems?.length).toBe(2)
  const [assignedKlo, controlKlo] = kloItems! as unknown as { id: string; title: string; key_questions: { name: string } }[]

  // Ensure a known password regardless of what other specs did to this
  // shared account first.
  const { error: passwordResetError } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password }
  )
  expect(passwordResetError).toBeNull()

  // ── Admin: assign the KLOE to the teammate ──────────────────────────────
  await login(page, account)
  await page.waitForURL('**/dashboard')

  await page.goto(`/dashboard/kloes/${assignedKlo.id}`)
  await page.locator('#assigned_to').selectOption({ label: 'E2E Test Teammate' })
  await page.getByRole('button', { name: 'Save assignment' }).click()
  await expect(page.getByText('KLOE assigned successfully.')).toBeVisible()

  // Reflected on the KLOE's own "Current status" card too, not just the
  // assign form's own state — scoped there specifically, since the closed
  // "Assigned to" <select> below also carries this exact text in its own
  // selected <option>.
  await page.reload()
  const currentStatusSection = page.locator('section[aria-labelledby="current-status-heading"]')
  await expect(currentStatusSection.getByText('E2E Test Teammate', { exact: true })).toBeVisible()

  // ── Teammate: fresh session, completes MFA enrolment, then checks My KLOEs
  const teammateContext = await browser.newContext()
  const teammatePage = await teammateContext.newPage()

  await login(teammatePage, { email: account.teammate.email, password: account.teammate.password })
  await completeMandatoryMfaSetup(teammatePage)

  await teammatePage.goto('/dashboard/my-kloes')

  const assignedCard = teammatePage.locator('div.bg-card.rounded-xl.border.border-line.p-4', {
    has: teammatePage.getByRole('link', { name: assignedKlo.title, exact: true }),
  })
  await expect(assignedCard).toBeVisible()
  await expect(assignedCard.getByText(assignedKlo.key_questions.name)).toBeVisible()

  // The control KLOE was never assigned — must not appear anywhere here.
  await expect(teammatePage.getByRole('link', { name: controlKlo.title, exact: true })).toHaveCount(0)

  // ── Admin: unassign it ───────────────────────────────────────────────────
  await page.goto(`/dashboard/kloes/${assignedKlo.id}`)
  await page.locator('#assigned_to').selectOption('') // the "— Unassigned —" option's value
  await page.getByRole('button', { name: 'Save assignment' }).click()
  await expect(page.getByText('KLOE unassigned.')).toBeVisible()

  // ── Teammate: it's gone from My KLOEs now ────────────────────────────────
  await teammatePage.goto('/dashboard/my-kloes')
  await expect(teammatePage.getByRole('link', { name: assignedKlo.title, exact: true })).toHaveCount(0)
  await expect(teammatePage.getByText('Nothing assigned to you yet')).toBeVisible()

  await teammateContext.close()
})
