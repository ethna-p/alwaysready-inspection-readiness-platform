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
 * Two accounts, two scenarios:
 *
 *   1. No MFA factor enrolled — the common case for a genuinely fresh
 *      account. Straight through: link -> set password -> done.
 *
 *   2. MFA enrolled (https://github.com/ethna-p/alwaysready-inspection-readiness-platform/issues/28).
 *      A recovery-link session, like a fresh password login, only ever
 *      proves aal1 (control of the inbox) — Supabase's own updateUser()
 *      correctly refuses a password change until aal2 is satisfied once the
 *      account has a factor enrolled. app/login/new-password previously had
 *      no path to ever reach aal2 mid-recovery at all, so this failed
 *      silently for any account with MFA on — which per this app's own
 *      middleware is eventually every real admin/user account. Fixed by
 *      embedding the same challenge/verify step a normal login uses
 *      (components/MfaVerifyStep.tsx) before the set-password form appears.
 *      This test enrols a real TOTP factor for the teammate first (the same
 *      real enroll -> verify flow completeMandatoryMfaSetup() drives
 *      elsewhere), then drives the recovery link through that new step.
 *
 * Both scenarios explicitly set the teammate's MFA state before running
 * (delete any existing factor; enrol one for real where scenario 2 needs
 * it) and clean it back up afterwards, so either test is deterministic
 * regardless of what ran before or after it on this shared fixture account.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { currentTotpCode } from './support/totp'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('forgot password (no MFA): request link, follow it, set a new password, log in with it', async ({ page, baseURL }) => {
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

test('forgot password (MFA enrolled): request link, verify MFA, set a new password, log in with it', async ({ page, baseURL }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const email = account.teammate.email

  const admin = getAdminClient()

  // Independent of whatever the "no MFA" test above did to this shared
  // fixture account's password -- set a known one before logging in, same
  // reasoning as clearing MFA factors below. Makes this test deterministic
  // regardless of run order.
  const knownPassword = 'E2E-teammate-mfa-fixture-pw-7h2k!'
  const { error: pwErr } = await admin.auth.admin.updateUserById(account.teammate.userId, { password: knownPassword })
  expect(pwErr).toBeNull()

  const { data: factorsData } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of factorsData?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }

  try {
    // ── Enrol a real TOTP factor for this account first -- the same real
    // enroll -> compute code -> verify flow a real user goes through ────────
    await login(page, { email, password: knownPassword })
    const totpSecret = await completeMandatoryMfaSetup(page)

    // ── Request + follow the recovery link, same mechanism as the no-MFA
    // test above -- admin.generateLink mints the same kind of link the real
    // resetPasswordForEmail email would have carried ─────────────────────────
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${baseURL}/auth/callback?next=/login/new-password` },
    })
    expect(error).toBeNull()
    const actionLink = data?.properties?.action_link
    expect(actionLink).toBeTruthy()

    await page.goto(actionLink!)
    await page.waitForURL('**/login/new-password')

    // ── This is the actual fix under test: the MFA step now appears before
    // the set-password form, instead of the form silently failing later ────
    await expect(page.getByRole('heading', { name: "Verify it's you" })).toBeVisible()
    await page.locator('#code').fill(currentTotpCode(totpSecret))
    await page.getByRole('button', { name: 'Verify' }).click()

    await expect(page.getByRole('heading', { name: 'Set new password' })).toBeVisible()

    // ── Set a new password -- this is the exact call that used to fail
    // silently ("Could not set your new password...") for any MFA-enrolled
    // account before the fix ─────────────────────────────────────────────────
    const newPassword = 'E2E-reset-via-link-mfa-pw-9z3q!'
    await page.locator('#new-password').fill(newPassword)
    await page.locator('#confirm-password').fill(newPassword)
    await page.getByRole('button', { name: 'Set new password' }).click()

    await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible()

    // ── The new password, and the same still-enrolled MFA factor, genuinely
    // work for a fresh login ─────────────────────────────────────────────────
    await page.getByRole('link', { name: 'Go to sign in' }).click()
    await page.waitForURL('**/login')

    await login(page, { email, password: newPassword, totpSecret })
    await page.waitForURL(url => !url.pathname.includes('/login'))
    await expect(page).not.toHaveURL(/\/change-password/)
  } finally {
    // Leave the shared fixture account's MFA state clean for whatever runs
    // next, same reasoning as the top-of-test cleanup above.
    const { data: cleanupFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
    for (const factor of cleanupFactors?.factors ?? []) {
      await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
    }
  }
})
