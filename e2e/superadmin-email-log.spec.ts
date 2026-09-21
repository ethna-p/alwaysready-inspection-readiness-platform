/**
 * Superadmin Email Log (app/superadmin/email-log/) — read-only view of
 * which scheduled trial/onboarding emails have actually been sent to each
 * organisation, sourced from notification_log.
 *
 * Seeds real notification_log rows for a disposable org (this page has no
 * "send" action of its own to drive -- it's a report over rows the cron
 * jobs would have written) and confirms the page correctly: only lists
 * orgs with at least one log entry, labels each sent id (day_03 -> "D03",
 * week_04 -> "W04"), counts sent-vs-total per category, and derives the
 * org's status badge (Trial vs Subscriber) from trial_expires_at /
 * subscribed_at.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { tidy } from './support/db'

test('superadmin email log: shows sent trial/onboarding emails, correctly labelled and counted', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const orgName = `E2E Email Log Org ${Date.now()}`
  const recipientEmail = `e2e-email-log-recipient-${Date.now()}@example.org`

  const { data: svcType, error: svcTypeErr } = await admin
    .from('service_types')
    .select('id')
    .limit(1)
    .single()
  expect(svcTypeErr).toBeNull()

  const { data: org, error: orgErr } = await admin
    .from('organisations')
    .insert({
      name: orgName,
      service_type_id: svcType!.id,
      subscription_tier: 'trial',
      trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()
  expect(orgErr).toBeNull()
  const orgId = org!.id

  const { error: logErr } = await admin.from('notification_log').insert([
    { organisation_id: orgId, notification_type: 'trial_day', entity_type: 'trial', entity_id: 'day_03', due_date: new Date().toISOString(), recipient_email: recipientEmail, sent_at: new Date().toISOString() },
    { organisation_id: orgId, notification_type: 'onboarding_week', entity_type: 'onboarding', entity_id: 'week_04', due_date: new Date().toISOString(), recipient_email: recipientEmail, sent_at: new Date().toISOString() },
  ])
  expect(logErr).toBeNull()

  try {
    await login(page, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await page.waitForURL('**/superadmin/provision')
    await page.goto('/superadmin/email-log')

    const card = page.locator('.bg-card').filter({ hasText: orgName })
    await expect(card).toBeVisible()
    await expect(card.getByText('Trial', { exact: true })).toBeVisible()
    await expect(card.getByText(recipientEmail)).toBeVisible()

    await expect(card.getByText('1/8 sent')).toBeVisible()
    await expect(card.getByText('✓ D03', { exact: true })).toBeVisible()
    // A trial email genuinely never sent stays unmarked -- confirms the
    // page distinguishes real log rows from just listing every id as sent.
    await expect(card.getByText('D01', { exact: true })).toBeVisible()
    await expect(card.getByText('✓ D01', { exact: true })).toHaveCount(0)

    await expect(card.getByText('1/18 sent')).toBeVisible()
    await expect(card.getByText('✓ W04', { exact: true })).toBeVisible()
    await expect(card.getByText('W01', { exact: true })).toBeVisible()
    await expect(card.getByText('✓ W01', { exact: true })).toHaveCount(0)
  } finally {
    tidy(await admin.from('notification_log').delete().eq('organisation_id', orgId), 'superadmin-email-log: delete notification_log')
    tidy(await admin.from('organisations').delete().eq('id', orgId), 'superadmin-email-log: delete organisations')
  }
})
