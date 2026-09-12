/**
 * Forced password change: an admin resets a teammate's password from the
 * team management tab, and the teammate is required to set their own
 * password before they can use the rest of the app.
 *
 * Covers:
 *   - admin: /dashboard/account?tab=team -> "Reset password" on a
 *     teammate's row -> a temporary password is displayed
 *   - teammate: logs in with that temporary password (no MFA of their own)
 *     -> middleware routes them to /dashboard/account/change-password
 *     before anywhere else (gate-ordering: password change beats MFA setup)
 *   - teammate: sets a new password -> lands past the change-password page
 *   - teammate: can log in again afterwards with the NEW password
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'

test('admin resets a teammate password, teammate is forced to change it', async ({ page, browser }) => {
  const account = loadTestAccount()

  // ── Admin: reset the teammate's password ────────────────────────────────
  await login(page, account)
  await page.waitForURL('**/dashboard')

  await page.goto('/dashboard/account?tab=team')

  const teammateRow = page.locator('tr', { hasText: account.teammate.email })
  await expect(teammateRow).toBeVisible()

  await teammateRow.getByRole('button', { name: 'Reset password' }).click()

  const tempPasswordEl = teammateRow.locator('p.font-mono')
  await expect(tempPasswordEl).toBeVisible()
  const tempPassword = (await tempPasswordEl.textContent())?.trim()
  expect(tempPassword).toBeTruthy()
  expect(tempPassword).not.toEqual(account.teammate.password) // freshly generated, not the seed password

  // ── Teammate: log in with the temporary password, in a fresh session ───
  const teammateContext = await browser.newContext()
  const teammatePage = await teammateContext.newPage()

  await login(teammatePage, { email: account.teammate.email, password: tempPassword! })

  // No MFA factor enrolled for this account, so middleware's next stop is
  // the forced password change — never MFA setup (gate-ordering fix).
  await teammatePage.waitForURL('**/dashboard/account/change-password')
  await expect(teammatePage.getByRole('heading', { name: 'Choose a new password' })).toBeVisible()

  const newPassword = 'E2E-teammate-new-pw-9k2m4!'
  await teammatePage.locator('#new-password').fill(newPassword)
  await teammatePage.locator('#confirm-password').fill(newPassword)
  await teammatePage.getByRole('button', { name: 'Set new password' }).click()

  // Don't assume the exact landing URL — the page hard-navigates to
  // /dashboard, which server-side redirects a 'user'-role account onward
  // (to /dashboard/my-kloes) before the browser settles. Observe whichever
  // it actually is, and just confirm we've moved past the gate.
  await teammatePage.waitForURL(url => !url.pathname.includes('/change-password'))
  await expect(teammatePage).not.toHaveURL(/\/login/)

  await teammateContext.close()

  // ── Teammate: the new password now works for a fresh login ─────────────
  const verifyContext = await browser.newContext()
  const verifyPage = await verifyContext.newPage()
  await login(verifyPage, { email: account.teammate.email, password: newPassword })
  await verifyPage.waitForURL(url => !url.pathname.includes('/login'))
  await expect(verifyPage).not.toHaveURL(/\/change-password/)
  await verifyContext.close()
})
