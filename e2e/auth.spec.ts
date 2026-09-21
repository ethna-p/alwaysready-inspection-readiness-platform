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
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('admin can log in, verify MFA, and reach the dashboard', async ({ page }) => {
  const account = loadTestAccount()

  await login(page, account)

  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: 'Inspection Readiness' })).toBeVisible()
})

/**
 * Regression: "Sign in with a different account" on /login/mfa used to walk
 * straight into a redirect loop, discovered live in production (AJ got
 * genuinely trapped, confirmed via screenshot). middleware.ts's "redirect an
 * authenticated user away from /login" rule fired for ANY session, including
 * one that was only aal1 (password verified, MFA not yet completed) -- so
 * clicking this link (-> /login) got redirected to /dashboard (a session
 * exists), whose own MFA guard immediately bounced back to /login/mfa (that
 * session isn't aal2 yet). No click, hard refresh, or new tab could ever
 * reach a real sign-in form again -- the only way out was clearing cookies
 * by hand, since Sign Out itself lives inside the dashboard this loop never
 * let you reach.
 *
 * Fixed two ways, both covered here: middleware no longer redirects an aal1
 * session away from /login at all (breaks the loop on its own), and the
 * link itself now explicitly signs out before navigating (so it does what
 * it says immediately, rather than depending on the middleware fix alone).
 */
test('MFA screen: "Sign in with a different account" actually reaches a fresh login form, not a redirect loop', async ({ page }) => {
  const account = loadTestAccount()
  const admin = getAdminClient()

  await page.goto('/login')
  // Confirm the values stuck before submitting (see login() in support/actions.ts: on a freshly loaded
  // page the app can wipe a field just after it is typed, notably in WebKit).
  await expect(async () => {
    await page.locator('#login').fill(account.email)
    await page.locator('#password').fill(account.password)
    await expect(page.locator('#login')).toHaveValue(account.email, { timeout: 1000 })
    await expect(page.locator('#password')).toHaveValue(account.password, { timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Genuinely aal1 here -- password verified, MFA not yet completed.
  await page.waitForURL('**/login/mfa')

  await page.getByRole('button', { name: 'Sign in with a different account' }).click()

  // The actual regression: this used to bounce straight back to
  // /login/mfa via /dashboard. Confirm a real sign-in form instead.
  await page.waitForURL('**/login')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.locator('#login')).toBeVisible()
  await expect(page.locator('#login')).toHaveValue('')

  // Not just cosmetic -- the aal1 session was genuinely cleared (the fix's
  // explicit signOut()), not just hidden behind a client-side redirect.
  // Confirm by completing a full, real login for a DIFFERENT account from
  // this exact point, the whole reason the link exists in the first place.
  const { data: factorsBefore } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of factorsBefore?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }
  const { error: pwResetErr } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwResetErr).toBeNull()

  await page.locator('#login').fill(account.teammate.email)
  await page.locator('#password').fill(account.teammate.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard/account/mfa/setup**')
  await completeMandatoryMfaSetup(page)
  await page.waitForURL(url => url.searchParams.get('mfa') === 'enrolled')

  // Cleanup: leave the teammate's MFA state as later specs expect it
  // (same reasoning as account-settings.spec.ts and others).
  const { data: factorsAfter } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of factorsAfter?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }
})
