/**
 * Superadmin Account (app/superadmin/account/) — the superadmin's own MFA
 * settings and session-timeout preference.
 *
 * Deliberately does NOT drive MFA enroll/remove here: the superadmin
 * fixture's TOTP factor is shared by every other spec in this suite that
 * logs in as superadmin (login() passes account.superadmin.totpSecret
 * directly) -- unenrolling or replacing it here would break all of them.
 * Smoke-covers the page loads correctly and the two section headings
 * render, plus genuinely drives the session-timeout control, which is safe
 * (writes only to localStorage, no auth state).
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'

test('superadmin account: page loads, MFA is already enrolled, session timeout preference is saved', async ({ page }) => {
  const account = loadTestAccount()

  await login(page, {
    email: account.superadmin.email,
    password: account.superadmin.password,
    totpSecret: account.superadmin.totpSecret,
  })
  await page.waitForURL('**/superadmin/provision')
  await page.goto('/superadmin/account')

  await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Two-factor authentication' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Session timeout' })).toBeVisible()

  // The seeded superadmin fixture always has a real, enrolled TOTP factor
  // (login() above only succeeded because of it) -- confirm the page
  // correctly reflects "already enrolled" rather than offering to set one
  // up again, without touching that shared factor.
  await expect(page.getByRole('button', { name: 'Set up two-factor authentication' })).toHaveCount(0)

  // Session timeout: a real, safe (localStorage-only) preference change.
  await page.getByRole('button', { name: '30 min' }).click()
  await expect(page.getByText('Saved. Takes effect on your next login or page refresh.')).toBeVisible()
  await expect(page.getByRole('button', { name: '30 min' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '15 min' })).toHaveAttribute('aria-pressed', 'false')

  // Persists across a reload (it's a real localStorage write, not just
  // client-side React state).
  await page.reload()
  await expect(page.getByRole('button', { name: '30 min' })).toHaveAttribute('aria-pressed', 'true')

  // Leave it at the default for whatever runs next.
  await page.getByRole('button', { name: '15 min' }).click()
  await expect(page.getByRole('button', { name: '15 min' })).toHaveAttribute('aria-pressed', 'true')
})
