/**
 * Reset a teammate's MFA (app/dashboard/account/team-actions.ts's
 * resetTeamMemberMfa) — the recovery path for a teammate who's lost their
 * authenticator device.
 *
 * Before this action existed, the only way to remove an MFA factor was
 * self-service (MfaSection.tsx's "Remove"), which requires already being
 * logged in with a working factor -- circular for someone actually locked
 * out, and admins had no way to help a teammate in that position at all.
 * Same shape and org-scoping check as the other team actions.
 *
 * Covers: a real enrolled factor is genuinely removed server-side (not
 * just hidden in the UI) and the teammate is correctly sent through
 * mandatory MFA setup again on their next login; the "nothing to reset"
 * case for a teammate with no factor; and that an admin can't use this to
 * reset their own MFA (self-service Remove exists for that).
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('admin resets a locked-out teammate\'s MFA: real removal, they re-enrol on next login', async ({ page }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // Known state regardless of what an earlier spec left behind.
  const { error: pwErr } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwErr).toBeNull()
  const { data: staleFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of staleFactors?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }

  try {
    // ── Simulate "lost their authenticator": teammate has a real, enrolled
    // factor from a genuine setup flow ─────────────────────────────────────
    const teammateContext = await page.context().browser()!.newContext()
    const teammatePage = await teammateContext.newPage()
    await login(teammatePage, { email: account.teammate.email, password: account.teammate.password })
    await completeMandatoryMfaSetup(teammatePage)
    await teammateContext.close()

    const { data: factorsBefore } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    expect(factorsBefore?.factors.length).toBe(1)

    // ── Admin resets it via the real Team page UI ────────────────────────
    await login(page, account)
    await page.waitForURL('**/dashboard')
    await page.goto('/dashboard/account?tab=team')

    const teammateRow = page.locator('tr', { hasText: account.teammate.email })
    await teammateRow.getByRole('button', { name: 'Reset MFA' }).click()
    await expect(teammateRow.getByText(`MFA reset for ${account.teammate.fullName}.`, { exact: false })).toBeVisible()

    // Genuinely gone server-side, not just a UI message.
    const { data: factorsAfter } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    expect(factorsAfter?.factors.length).toBe(0)

    // ── The teammate genuinely has to set up MFA again on next login ─────
    const newTeammateContext = await page.context().browser()!.newContext()
    const newTeammatePage = await newTeammateContext.newPage()
    await login(newTeammatePage, { email: account.teammate.email, password: account.teammate.password })
    await newTeammatePage.waitForURL('**/dashboard/account/mfa/setup**')
    // "Action required." is a <strong>, not a heading -- and "Step 1 — Scan
    // the QR code" (a real h2) confirms the actual setup flow is showing,
    // not just the mandatory-setup banner.
    await expect(newTeammatePage.getByText('Action required.')).toBeVisible()
    await expect(newTeammatePage.getByRole('heading', { name: 'Step 1 — Scan the QR code' })).toBeVisible()
    await newTeammateContext.close()
  } finally {
    const { data: cleanupFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    for (const factor of cleanupFactors?.factors ?? []) {
      await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
    }
  }
})

test('reset MFA on a teammate with nothing enrolled reports "nothing to reset", not an error', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const { data: staleFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of staleFactors?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/account?tab=team')

  const teammateRow = page.locator('tr', { hasText: account.teammate.email })
  await teammateRow.getByRole('button', { name: 'Reset MFA' }).click()
  await expect(teammateRow.getByText('has no MFA factor enrolled', { exact: false })).toBeVisible()
})

test('an admin cannot reset their own MFA from the Team page', async ({ page }) => {
  const account = loadTestAccount()

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/account?tab=team')

  // isSelf renders "—" instead of the form entirely — same treatment as
  // the other team actions get for your own row.
  const ownRow = page.locator('tr', { hasText: account.email })
  await expect(ownRow.getByRole('button', { name: 'Reset MFA' })).toHaveCount(0)
})

test('the Team page offers no admin password reset: teammates reset their own from the login page', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/account?tab=team')

  const teammateRow = page.locator('tr', { hasText: account.teammate.email })
  await expect(teammateRow).toBeVisible()
  // The MFA reset is still there (a lost authenticator cannot be self-served)...
  await expect(teammateRow.getByRole('button', { name: 'Reset MFA' })).toBeVisible()
  // ...but there is no password reset button and no Password column.
  await expect(page.getByRole('button', { name: 'Reset password' })).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: 'Password' })).toHaveCount(0)

  // The self-service route is what replaces it.
  await page.context().clearCookies()
  await page.goto('/login')
  await expect(page.getByText('Forgot your password?')).toBeVisible()
})
