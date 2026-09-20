/**
 * Superadmin Leads (app/superadmin/leads/) — warm waitlist leads, Zeeg
 * bookings, demo bookings, and blog subscribers, plus the two event-
 * triggered bulk emails (framework published / launch) sent to every
 * nurture-opted-in lead.
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

test('superadmin leads: Zeeg booking form, lead deletion, and bulk-send reports an honest count', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const leadEmail = `e2e-leads-bulk-send-${Date.now()}@example.org`
  const zeegEmail = `e2e-leads-zeeg-${Date.now()}@example.org`

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

    // ── Add a Zeeg booking via the real form ─────────────────────────────
    await page.locator('#zb-name').fill('E2E Zeeg Booker')
    await page.locator('#zb-email').fill(zeegEmail)
    await page.locator('#zb-type').selectOption('30min')
    // "Scheduled for" is required (unified Demo Pipeline, 2026-09-19). Noon keeps the
    // rendered date stable whatever timezone the server formats it in.
    await page.locator('#zb-scheduled').fill('2030-01-15T12:00')
    await page.getByRole('button', { name: 'Add booking' }).click()
    const bookingRow = page.locator('tr', { hasText: zeegEmail })
    await expect(bookingRow).toBeVisible()
    await expect(bookingRow.getByText('30 min', { exact: true })).toBeVisible()
    await expect(bookingRow.getByText(/15 Jan 2030/)).toBeVisible()

    // ── Edit the scheduled time inline (updateScheduledAt) ───────────────
    await bookingRow.getByTitle('Edit scheduled time').click()
    await bookingRow.locator('input[type="datetime-local"]').fill('2030-02-16T12:00')
    await bookingRow.getByRole('button', { name: 'Save' }).click()
    await expect(bookingRow.getByText(/16 Feb 2030/)).toBeVisible()
    await expect(bookingRow.getByText(/15 Jan 2030/)).toHaveCount(0)

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

    // ── Delete the booking's Demo Pipeline row (deletePipelineRow) ───────
    page.once('dialog', dialog => dialog.accept())
    await bookingRow.getByRole('button', { name: 'Delete' }).click()
    await expect(page.locator('tr', { hasText: zeegEmail })).toHaveCount(0)
  } finally {
    await admin.from('waitlist_leads').delete().eq('email', leadEmail)
    await admin.from('zeeg_bookings').delete().eq('invitee_email', zeegEmail)
  }
})
