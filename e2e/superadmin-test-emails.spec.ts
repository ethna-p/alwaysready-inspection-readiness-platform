/**
 * Superadmin Send test emails (app/superadmin/test-emails/) — sends any of
 * 11 hardcoded content groups to the superadmin's own inbox for content
 * review, each subject prefixed [TEST].
 *
 * Drives the real "Account emails" group (the smallest, count: 1) end to
 * end and confirms the result honestly reflects this environment's lack of
 * RESEND_API_KEY -- 0/1 sent, 1 failed -- via makeSender's own `sent: r.sent`
 * (already correct here, unlike leads/actions.ts's sendBulkLaunchEmail
 * before its fix; see e2e/superadmin-leads.spec.ts). Also confirms every
 * group card renders (a static list, not DB-driven) and the Reset button
 * genuinely returns a completed card to its initial "Send" state.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'

test('superadmin test emails: every group card renders, and sending one reports an honest result', async ({ page }) => {
  const account = loadTestAccount()

  await login(page, {
    email: account.superadmin.email,
    password: account.superadmin.password,
    totpSecret: account.superadmin.totpSecret,
  })
  await page.waitForURL('**/superadmin/provision')
  await page.goto('/superadmin/test-emails')

  await expect(page.getByRole('heading', { name: 'Send test emails' })).toBeVisible()
  for (const label of [
    'Website auto-responders', '14-day trial sequence', '12-week onboarding',
    'Support tickets', 'KLOE reminders', 'HR reminders', 'Account emails',
    'Waitlist nurture (1–8)', 'Waitlist launch (9–10)', 'Data deletion',
    'Subject access request',
  ]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Send all groups' })).toBeVisible()

  // The smallest group (1 email) -- fast, and enough to prove the
  // send/result/reset cycle without waiting on the larger sequences.
  const accountCard = page.locator('.bg-card').filter({ hasText: 'Account emails' })
  await accountCard.getByRole('button', { name: 'Send' }).click()

  // No RESEND_API_KEY in this environment -- an honest 0/1, not a false success.
  await expect(accountCard.getByText('0/1 sent')).toBeVisible()
  await expect(accountCard.getByText('(1 failed)')).toBeVisible()

  await accountCard.getByRole('button', { name: 'Reset' }).click()
  await expect(accountCard.getByRole('button', { name: 'Send' })).toBeVisible()
  await expect(accountCard.getByText('0/1 sent')).toHaveCount(0)
})
