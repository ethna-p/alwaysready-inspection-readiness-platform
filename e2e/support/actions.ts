/**
 * Reusable Playwright actions shared across spec files.
 *
 * `login()` drives the same journey every spec needs first: password entry,
 * then MFA verification if (and only if) the account has a factor enrolled.
 * Centralised here so a change to the login/MFA UI only needs updating once.
 */
import { Page } from '@playwright/test'
import { currentTotpCode } from './totp'

export interface LoginCredentials {
  email: string
  password: string
  /** Omit for an account with no TOTP factor enrolled (e.g. a fresh teammate). */
  totpSecret?: string
}

/**
 * Logs in via /login. If `totpSecret` is provided, also completes the
 * mandatory /login/mfa verification step. Leaves the page wherever the app's
 * own post-login redirect lands (dashboard, my-kloes, change-password, mfa
 * setup, etc.) — callers should assert their own expected destination rather
 * than this helper guessing it for them.
 */
export async function login(page: Page, account: LoginCredentials): Promise<void> {
  await page.goto('/login')

  await page.locator('#login').fill(account.email)
  await page.locator('#password').fill(account.password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  if (account.totpSecret) {
    await page.waitForURL('**/login/mfa')
    await page.locator('#code').fill(currentTotpCode(account.totpSecret))
    await page.getByRole('button', { name: 'Verify' }).click()
  }
}

/**
 * Completes the mandatory TOTP enrolment flow at
 * /dashboard/account/mfa/setup (middleware sends any admin/user-role
 * account with no MFA factor here on their first dashboard visit) — the
 * same real enroll -> compute code -> challengeAndVerify() flow a real
 * user goes through, just automated. Returns the enrolled secret so the
 * caller can log in with it again later in the same test.
 *
 * Assumes the page is already ON the setup page (middleware redirected
 * there, or the caller navigated directly) when this is called.
 */
export async function completeMandatoryMfaSetup(page: Page): Promise<string> {
  await page.waitForURL('**/dashboard/account/mfa/setup**')
  await page.getByRole('button', { name: "Can't scan? Enter code manually" }).click()
  const secret = (await page.getByText('Manual entry key:').locator('xpath=following-sibling::p[1]').innerText()).trim()

  await page.locator('#totp-code').fill(currentTotpCode(secret))
  await page.getByRole('button', { name: 'Activate two-factor authentication' }).click()

  // The page's own completion logic always targets /dashboard/account?mfa=
  // enrolled, but middleware then immediately re-redirects on top of that
  // for an account with onboarding_complete still false (a fresh trial
  // signup, unlike every other account this helper has been used for so
  // far, which all had it true already) -- landing on
  // /dashboard/welcome?mfa=enrolled instead. Wait for the query param
  // itself, regardless of which path it ends up attached to, and leave the
  // specific destination to the caller's own assertion (same philosophy as
  // login() above).
  await page.waitForURL(url => url.searchParams.get('mfa') === 'enrolled')

  return secret
}
