/**
 * /dashboard/welcome — first-login onboarding screen.
 *
 * Shown once, to any account with onboarding_complete = false, after MFA
 * enrolment (middleware deliberately does NOT exempt this page from the
 * MFA gate -- see middleware.ts's own comment: it renders inside the full
 * dashboard layout and captures a real GDPR consent decision, so it must
 * not be reachable before aal2 is satisfied). completeMandatoryMfaSetup
 * itself already documents landing here instead of /dashboard/account/mfa/setup's
 * usual destination when onboarding isn't done yet -- this spec drives
 * that same, well-trodden path for real.
 *
 * Covers what completeOnboarding (app/dashboard/welcome/actions.ts)
 * actually persists: onboarding_complete flips to true either way, but
 * marketing_consent and marketing_consent_at only get set when the
 * checkbox (checked by default) is actually left checked -- unchecking it
 * before submitting is the more interesting path to prove, since a bug
 * here would silently over-consent someone who explicitly opted out.
 * Also confirms the page is genuinely one-time: revisiting it directly
 * once onboarding_complete is true redirects straight to /dashboard.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('Welcome: first login after MFA enrolment shows onboarding, unchecking consent is respected, and it never shows again', async ({ page }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // Reset the shared teammate fixture to a genuine "first login" state:
  // known password, no stray MFA factor from an earlier failed run, and
  // onboarding not yet complete.
  const { error: pwErr } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwErr).toBeNull()

  const { data: staleFactors } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of staleFactors?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }

  const { error: resetErr } = await admin
    .from('users')
    .update({ onboarding_complete: false, marketing_consent: null, marketing_consent_at: null })
    .eq('id', account.teammate.userId)
  expect(resetErr).toBeNull()

  await login(page, { email: account.teammate.email, password: account.teammate.password })
  await completeMandatoryMfaSetup(page)
  await page.waitForURL(url => url.pathname === '/dashboard/welcome')

  await expect(page.getByRole('heading', { name: `Welcome, ${account.teammate.fullName.split(' ')[0]}!` })).toBeVisible()
  await expect(page.getByText('14-day free trial')).toBeVisible()

  // Checked by default (an explicit, unticked opt-in would be the GDPR
  // violation here, not the reverse) -- confirm the default itself before
  // testing the opt-out path.
  const consentCheckbox = page.locator('input[name="marketing_consent"]')
  await expect(consentCheckbox).toBeChecked()

  // The interesting path: explicitly opting OUT, not just accepting the default.
  await consentCheckbox.uncheck()
  await page.getByRole('button', { name: 'Get started →' }).click()
  // completeOnboarding always redirects to /dashboard, but the 'user' role's
  // own real landing page immediately redirects again from there to
  // /dashboard/my-kloes (app/dashboard/page.tsx's own role-based redirect).
  await page.waitForURL('**/dashboard/my-kloes')
  await expect(page.getByRole('heading', { name: 'My KLOEs' })).toBeVisible()

  // Persisted for real, not just a client-side redirect.
  const { data: afterOnboarding } = await admin
    .from('users')
    .select('onboarding_complete, marketing_consent, marketing_consent_at')
    .eq('id', account.teammate.userId)
    .single()
  expect(afterOnboarding!.onboarding_complete).toBe(true)
  expect(afterOnboarding!.marketing_consent).toBe(false)
  expect(afterOnboarding!.marketing_consent_at).toBeNull()

  // One-time: revisiting the welcome page directly now just bounces onward
  // (through /dashboard, then this role's own /dashboard/my-kloes redirect)
  // rather than showing the form again.
  await page.goto('/dashboard/welcome')
  await page.waitForURL('**/dashboard/my-kloes')
  await expect(page.getByRole('heading', { name: /Welcome,/ })).toHaveCount(0)

  // Cleanup: leave the shared fixture as the seed script created it.
  await admin
    .from('users')
    .update({ onboarding_complete: true, marketing_consent: null, marketing_consent_at: null })
    .eq('id', account.teammate.userId)

  const { data: factorsAfter } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of factorsAfter?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }
})
