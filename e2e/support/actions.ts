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
