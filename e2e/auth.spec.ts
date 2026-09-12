/**
 * Core auth journey: password login -> mandatory TOTP verification -> dashboard.
 *
 * Every other journey in this app sits behind this one (nothing is reachable
 * without getting past MFA first), which is why it's the first E2E test —
 * everything else can build on the login helper this establishes.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'

test('admin can log in, verify MFA, and reach the dashboard', async ({ page }) => {
  const account = loadTestAccount()

  await login(page, account)

  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: 'Inspection Readiness' })).toBeVisible()
})
