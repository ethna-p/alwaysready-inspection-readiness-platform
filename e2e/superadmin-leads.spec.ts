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

/**
 * The failure paths. These leads actions used to ignore the database's answer,
 * so a rejected write looked exactly like a successful one. Each case here forces
 * a genuine rejection and checks the page says so.
 */
test('superadmin leads: a rejected booking or time change shows an error instead of failing silently', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const badDateEmail = `e2e-leads-baddate-${Date.now()}@example.org`
  const staleEmail = `e2e-leads-stale-${Date.now()}@example.org`

  // A booking the page will list, which we later delete behind the page's back.
  const { error: seedErr } = await admin.from('zeeg_bookings').insert({
    event_uuid: crypto.randomUUID(),
    invitee_uuid: crypto.randomUUID(),
    invitee_email: staleEmail,
    invitee_name: 'E2E Stale Booker',
    demo_type: '30min',
    booked_at: new Date().toISOString(),
    scheduled_at: '2030-03-01T12:00:00Z',
  })
  expect(seedErr).toBeNull()

  try {
    await login(page, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await page.waitForURL('**/superadmin/provision')
    await page.goto('/superadmin/leads')

    // ── addZeegBooking: the database rejects an unparseable date ─────────
    // The browser's own date picker never lets a bad value through (and its
    // validation blocks the submit outright), so fill in a valid date and swap it
    // for a bad one in the request itself. The real action and the real database
    // still do the rejecting.
    const goodDate = '2030-04-01T12:00'
    await page.route('**/superadmin/leads', async route => {
      const request = route.request()
      const body = request.postData()
      if (request.method() === 'POST' && body?.includes(goodDate)) {
        await route.continue({ postData: body.replace(goodDate, 'not-a-date') })
      } else {
        await route.continue()
      }
    })
    await page.locator('#zb-name').fill('E2E Bad Date')
    await page.locator('#zb-email').fill(badDateEmail)
    await page.locator('#zb-type').selectOption('30min')
    await page.locator('#zb-scheduled').fill(goodDate)
    await page.getByRole('button', { name: 'Add booking' }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Could not add the booking' }),
    ).toBeVisible()
    await expect(page.locator('tr', { hasText: badDateEmail })).toHaveCount(0)
    const { data: created } = await admin.from('zeeg_bookings').select('id').eq('invitee_email', badDateEmail)
    expect(created ?? []).toHaveLength(0)
    await page.unroute('**/superadmin/leads')

    // ── updateScheduledAt: the booking vanished after the page loaded ────
    const staleRow = page.locator('tr', { hasText: staleEmail })
    await expect(staleRow).toBeVisible()
    await staleRow.getByTitle('Edit scheduled time').click()
    await admin.from('zeeg_bookings').delete().eq('invitee_email', staleEmail)
    await staleRow.locator('input[type="datetime-local"]').fill('2030-03-02T12:00')
    await staleRow.getByRole('button', { name: 'Save' }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'That booking no longer exists' }),
    ).toBeVisible()
    // The editor stays open so nothing the admin typed is lost.
    await expect(staleRow.getByRole('button', { name: 'Cancel' })).toBeVisible()
  } finally {
    await admin.from('zeeg_bookings').delete().eq('invitee_email', badDateEmail)
    await admin.from('zeeg_bookings').delete().eq('invitee_email', staleEmail)
  }
})
