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
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { currentTotpCode } from './support/totp'

interface TestAccount {
  email: string
  password: string
  totpSecret: string
}

function loadTestAccount(): TestAccount {
  const path = join(__dirname, '.fixtures', 'test-account.json')
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    throw new Error(
      `Could not read ${path} — run "npm run test:e2e:seed" first to create the test account.`
    )
  }
}

test('admin can log in, verify MFA, and reach the dashboard', async ({ page }) => {
  const account = loadTestAccount()

  await page.goto('/login')

  await page.locator('#login').fill(account.email)
  await page.locator('#password').fill(account.password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Middleware routes any factor-enrolled-but-unverified session here.
  await page.waitForURL('**/login/mfa')

  await page.locator('#code').fill(currentTotpCode(account.totpSecret))
  await page.getByRole('button', { name: 'Verify' }).click()

  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: 'Inspection Readiness' })).toBeVisible()
})
