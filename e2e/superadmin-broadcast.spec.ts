/**
 * Superadmin broadcast (app/superadmin/broadcast/) — send a one-off email
 * to every active blog subscriber, e.g. announcing a new blog post.
 *
 * Drives the real compose -> confirm -> send flow end-to-end. Confirms
 * getRecipientCount() and sendBroadcast() (actions.ts) both correctly
 * exclude an already-unsubscribed subscriber from the count and from the
 * send loop, not just the confirmation UI. This environment has no
 * RESEND_API_KEY configured (same as every other email-touching spec in
 * this suite, e.g. trial-signup.spec.ts), so sendEmail() always returns
 * `{sent: false, skipped: 'no_api_key'}` here -- the real send path itself
 * isn't exercised, but the audience-selection logic (who gets counted,
 * who gets skipped) is, which is the actual thing this page could get
 * wrong.
 *
 * The recipient count is read fresh from the DB immediately before
 * creating this spec's own test subscriber, rather than asserting a fixed
 * number -- this table isn't touched by any other spec, but it's also not
 * reset by the seed script (it's a standing marketing list, not part of
 * the per-run org), so a real baseline may already exist here.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { tidy } from './support/db'

test('superadmin broadcast: counts only active subscribers, sends, and reports the real total', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const activeEmail       = `e2e-broadcast-active-${Date.now()}@example.org`
  const unsubscribedEmail = `e2e-broadcast-unsubscribed-${Date.now()}@example.org`

  const { count: baselineCount, error: baselineErr } = await admin
    .from('blog_subscribers')
    .select('id', { count: 'exact', head: true })
    .is('unsubscribed_at', null)
  expect(baselineErr).toBeNull()
  const expectedRecipients = (baselineCount ?? 0) + 1

  const { error: activeErr } = await admin.from('blog_subscribers').insert({
    email: activeEmail,
    full_name: 'E2E Active Subscriber',
    source: 'e2e-test',
  })
  expect(activeErr).toBeNull()

  const { error: unsubErr } = await admin.from('blog_subscribers').insert({
    email: unsubscribedEmail,
    full_name: 'E2E Unsubscribed Subscriber',
    source: 'e2e-test',
    unsubscribed_at: new Date().toISOString(),
  })
  expect(unsubErr).toBeNull()

  try {
    await login(page, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await page.waitForURL('**/superadmin/provision')
    await page.goto('/superadmin/broadcast')

    // The unsubscribed test subscriber must never be counted.
    await expect(page.getByText(`${expectedRecipients} recipient`, { exact: false })).toBeVisible()

    await page.locator('#broadcast-subject').fill('E2E test broadcast — please ignore')
    await page.locator('#broadcast-intro').fill('This is an automated end-to-end test of the broadcast feature.')
    await page.locator('#broadcast-post-url').fill('https://alwaysready.uk/blog/e2e-test-post')
    await page.getByRole('button', { name: 'Review and send' }).click()

    await expect(page.getByText(`Ready to send to ${expectedRecipients} customer`, { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Confirm send' }).click()

    await expect(page.getByRole('heading', { name: 'Broadcast sent' })).toBeVisible()
    // No RESEND_API_KEY in this environment -- every send is correctly
    // skipped (not silently dropped or errored), never marked delivered.
    await expect(page.getByText(String(expectedRecipients))).toBeVisible()
    await expect(page.getByText(`${expectedRecipients} skipped`, { exact: false })).toBeVisible()
  } finally {
    tidy(await admin.from('blog_subscribers').delete().eq('email', activeEmail), 'superadmin-broadcast: delete blog_subscribers')
    tidy(await admin.from('blog_subscribers').delete().eq('email', unsubscribedEmail), 'superadmin-broadcast: delete blog_subscribers')
  }
})
