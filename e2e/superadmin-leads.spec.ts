/**
 * Superadmin Leads (app/superadmin/leads/) — warm waitlist leads and blog
 * subscribers, plus the two event-triggered bulk emails (framework
 * published / launch) sent to every nurture-opted-in lead.
 *
 * The bug: sendBulkLaunchEmail's per-recipient try/catch only counted a
 * send as failed if sendEmail() THREW -- but sendEmail() never throws for
 * a send that didn't go out (missing API key, an opted-out recipient, a
 * Resend API error all return `{ sent: false, ... }` normally, per its own
 * source). Confirmed live in this environment (no RESEND_API_KEY
 * configured, same as every other email-touching spec here): clicking
 * "Yes, send" for one real nurture lead reported "Sent to 1 subscriber" --
 * a delivery that never happened. Contrast with sendBroadcast
 * (app/superadmin/broadcast/actions.ts), which already correctly checks
 * `result.sent`. Fixed to match that same pattern; this spec's own
 * assertion is against the corrected, honest count ("0 subscribers (1
 * failed)"), not the number a real send would report -- this environment
 * genuinely can't send, so a passing "1 sent" here would itself be a
 * regression back to the bug.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { tidy } from './support/db'

test('superadmin leads: lead deletion, and bulk-send reports an honest count', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const leadEmail = `e2e-leads-bulk-send-${Date.now()}@example.org`

  const { error: leadErr } = await admin
    .from('waitlist_leads')
    .insert({ first_name: 'E2E Bulk Send', email: leadEmail, nurture_opt_in: true })
  expect(leadErr).toBeNull()

  try {
    await login(page, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await page.waitForURL('**/superadmin/provision')
    await page.goto('/superadmin/leads')

    const leadRow = page.locator('tr', { hasText: leadEmail })
    await expect(leadRow).toBeVisible()
    // Nurture column shows "Yes" for an opted-in lead.
    await expect(leadRow.getByText('Yes', { exact: true })).toBeVisible()

    // ── Bulk-send: confirm step, then an honest (not inflated) count ────
    await expect(page.getByText(/Send these when the event happens/)).toBeVisible()
    const sendButton = page.getByRole('button', { name: 'Send framework email (Email 9)' })
    await expect(sendButton).toBeEnabled() // >=1 nurture subscriber exists (this one)
    await sendButton.click()

    await expect(page.getByText(/Send to \d+ subscribers?\?/)).toBeVisible()
    await page.getByRole('button', { name: 'Yes, send' }).click()

    // No RESEND_API_KEY in this environment -- a genuinely honest result
    // reports 0 delivered, not the pre-fix bug's inflated success count.
    await expect(page.getByText(/✓ Sent to \d+ subscriber/)).toBeVisible()
    const resultText = await page.getByText(/✓ Sent to \d+ subscriber/).innerText()
    expect(resultText).toContain('Sent to 0 subscriber')
    expect(resultText).toContain('failed')

    // ── Delete the lead via the real confirm() dialog ────────────────────
    page.once('dialog', dialog => dialog.accept())
    await leadRow.getByRole('button', { name: 'Delete' }).click()
    await expect(page.locator('tr', { hasText: leadEmail })).toHaveCount(0)
  } finally {
    tidy(await admin.from('waitlist_leads').delete().eq('email', leadEmail), 'superadmin-leads: delete waitlist_leads')
  }
})
