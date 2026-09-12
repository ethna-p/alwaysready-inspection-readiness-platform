/**
 * Self-service password reset: forgot password -> email link -> new password.
 *
 * Covers:
 *   - /login "Forgot your password?" -> request a reset -> "Check your
 *     inbox" confirmation (requestPasswordReset always reports success,
 *     even for an unrecognised address — anti-enumeration by design, so
 *     this alone doesn't prove an email actually went out)
 *   - the actual reset-link journey: since there's no real inbox to check
 *     in CI, admin.generateLink mints the same kind of recovery link
 *     Supabase's own email would have carried, with the exact redirectTo
 *     the app itself uses (see app/login/actions.ts) — clicking it is
 *     then genuinely identical to clicking the emailed link, just without
 *     needing a mail server in the loop
 *   - /auth/callback exchanges it into a recovery session and lands on
 *     /login/new-password
 *   - setting a new password succeeds, signs the recovery session out,
 *     and the new password works for a real subsequent login
 *
 * This specifically covers an account with NO MFA factor enrolled — the
 * teammate fixture, same as every other spec that logs in as them. A real
 * aal1-only recovery session genuinely cannot complete a password change
 * once MFA IS enrolled (confirmed directly: Supabase's own updateUser()
 * rejects it, "AAL2 required" in substance even though the app's own
 * generic catch-all error message doesn't say so) — app/login/new-password
 * has no path to verify MFA mid-recovery at all, so that's a real gap for
 * any account with MFA on, which per this app's own middleware is
 * eventually every admin/user account. Flagged, not fixed here — it's a
 * genuine product decision (redirect through /login/mfa mid-recovery, or
 * an embedded step) rather than a quick patch. The teammate's MFA factor
 * (if kloe-assignment.spec.ts ran first and enrolled one for real) is
 * explicitly removed below so this spec keeps testing the no-MFA case
 * deterministically, regardless of what ran before it.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('forgot password: request link, follow it, set a new password, log in with it', async ({ page, baseURL }) => {
  const account = loadTestAccount()
  const email = account.teammate.email

  const admin = getAdminClient()
  const { data: factorsData } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of factorsData?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }

  // ── UI: request the reset from /login ───────────────────────────────────
  await page.goto('/login')
  await page.getByRole('button', { name: 'Forgot your password?' }).click()
  await page.locator('#reset-login').fill(email)
  await page.getByRole('button', { name: 'Send reset link' }).click()

  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()

  // ── Stand-in for "open the email and click the link" ───────────────────
  // Same mechanism the app's own resetPasswordForEmail call drives
  // (Supabase Auth), same redirectTo the app itself builds — the only
  // difference is minting it directly instead of waiting on a real inbox.
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${baseURL}/auth/callback?next=/login/new-password` },
  })
  expect(error).toBeNull()
  const actionLink = data?.properties?.action_link
  expect(actionLink).toBeTruthy()

  // ── Follow the link, exactly as a click from the email would ───────────
  await page.goto(actionLink!)
  await page.waitForURL('**/login/new-password')
  await expect(page.getByRole('heading', { name: 'Set new password' })).toBeVisible()

  // ── Set a new password ──────────────────────────────────────────────────
  const newPassword = 'E2E-reset-via-link-pw-4q8z!'
  await page.locator('#new-password').fill(newPassword)
  await page.locator('#confirm-password').fill(newPassword)
  await page.getByRole('button', { name: 'Set new password' }).click()

  await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible()

  // ── The new password genuinely works for a fresh login ──────────────────
  await page.getByRole('link', { name: 'Go to sign in' }).click()
  await page.waitForURL('**/login')

  await login(page, { email, password: newPassword })
  await page.waitForURL(url => !url.pathname.includes('/login'))
  await expect(page).not.toHaveURL(/\/change-password/)
})
