/**
 * Support tickets: full round trip — customer submits a ticket, AlwaysReady
 * staff (superadmin) replies, the customer sees the reply, the customer
 * replies back by email (the only way a platform customer can reply at
 * all — the in-app thread view has no reply form, by design), and staff
 * marks the ticket resolved.
 *
 * Covers, genuinely, end to end through the real UI and real server actions:
 *   - submitTicket (app/dashboard/support/new/actions.ts) — real DB row,
 *     external_email correctly set to the submitter's own address (needed
 *     for the inbound-email sender-match check below)
 *   - staffReply / updateTicketStatus (app/superadmin/tickets/[ticketId]/
 *     actions.ts) — real superadmin session (a real, separately-seeded
 *     auth account with real MFA enrolled — superadmin has no organisation
 *     or public.users row at all, purely an email match against
 *     SUPERADMIN_EMAIL, per lib/assert-superadmin.ts)
 *   - /api/inbound-email — the real webhook the Cloudflare Email Worker
 *     posts to when a customer replies by email, hit directly with the
 *     same payload shape and secret header a genuine inbound email would
 *     carry (there's no real inbox to receive an email reply from in CI,
 *     same reasoning as this suite's other "mint the real artifact
 *     directly" tests) — confirms it threads onto the right ticket by
 *     reference and records it as a non-staff reply
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist,
 * including the superadmin fixture (added alongside this spec).
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { loadEnvLocal } from './support/env'

test('support tickets: customer submits, staff replies, customer replies by email, staff resolves', async ({ page, browser, baseURL }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()
  const env = loadEnvLocal() // process.env isn't populated from .env.local in this runner

  const subject = `E2E ticket ${Date.now()}`

  // ── Customer submits a new ticket via the real UI ────────────────────────
  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/support/new')

  await page.locator('#subject').fill(subject)
  await page.locator('#message').fill('I uploaded a certificate for Manual Handling training but it is not showing up on the staff record page.')
  await page.getByRole('button', { name: 'Submit ticket' }).click()

  await page.waitForURL(/\/dashboard\/support\/[0-9a-f-]+$/)
  await expect(page.getByRole('heading', { name: subject })).toBeVisible()
  await expect(page.getByText('Open', { exact: true })).toBeVisible()

  const { data: ticket, error: ticketErr } = await admin
    .from('support_tickets')
    .select('id, reference, external_email, submitted_by, organisation_id')
    .eq('subject', subject)
    .single()
  expect(ticketErr).toBeNull()
  expect(ticket!.external_email).toBe(account.email)
  expect(ticket!.submitted_by).toBe(account.userId)
  expect(ticket!.organisation_id).toBe(account.orgId)

  // Also visible in the customer's own ticket list
  await page.goto('/dashboard/support')
  await expect(page.getByText(subject)).toBeVisible()
  await expect(page.getByText(ticket!.reference)).toBeVisible()

  // ── Superadmin sees it and replies ────────────────────────────────────────
  const superadminContext = await browser.newContext()
  const superadminPage = await superadminContext.newPage()
  await login(superadminPage, {
    email: account.superadmin.email,
    password: account.superadmin.password,
    totpSecret: account.superadmin.totpSecret,
  })
  await superadminPage.waitForURL('**/superadmin/provision') // /superadmin itself redirects here

  await superadminPage.goto('/superadmin/tickets')
  await superadminPage.getByRole('link', { name: subject }).click()
  await superadminPage.waitForURL(`**/superadmin/tickets/${ticket!.id}`)

  await expect(superadminPage.getByRole('heading', { name: subject })).toBeVisible()
  // Scoped to the header's own "Submitted by" field -- the submitter's name
  // now also appears as the original message's author label in the
  // newest-first conversation thread further down the page, which a bare
  // page-wide getByText would match twice.
  await expect(superadminPage.getByRole('definition').filter({ hasText: 'E2E Test Admin' })).toBeVisible()

  const staffReplyText = 'Thanks for flagging this — certificates can take a moment to appear. Could you try refreshing the training record section?'
  await superadminPage.getByPlaceholder('Type your reply here…').fill(staffReplyText)
  await superadminPage.getByRole('button', { name: 'Send reply' }).click()

  await superadminPage.waitForURL(`**/superadmin/tickets/${ticket!.id}`)
  await expect(superadminPage.getByText(staffReplyText)).toBeVisible()
  await expect(superadminPage.getByText('You (AlwaysReady)')).toBeVisible()

  const { data: staffReplyRow, error: staffReplyErr } = await admin
    .from('support_ticket_replies')
    .select('is_staff_reply, sent_by, message')
    .eq('ticket_id', ticket!.id)
    .eq('is_staff_reply', true)
    .single()
  expect(staffReplyErr).toBeNull()
  expect(staffReplyRow!.message).toBe(staffReplyText)
  expect(staffReplyRow!.sent_by).toBeNull()

  // ── Customer sees the staff reply ────────────────────────────────────────
  // page is still on /dashboard/support (the list) from the check above —
  // back to the ticket detail page, not just a reload of the list.
  await page.goto(`/dashboard/support/${ticket!.id}`)
  await expect(page.getByText(staffReplyText)).toBeVisible()
  await expect(page.getByText('AlwaysReady Support')).toBeVisible()

  // ── Customer replies by email (the only reply path a real customer has) ──
  const inboundResponse = await page.request.post(`${baseURL}/api/inbound-email`, {
    headers: { 'X-Inbound-Secret': env.INBOUND_EMAIL_SECRET ?? '' },
    data: {
      from:     account.email,
      fromName: 'E2E Test Admin',
      subject:  `Re: ${subject} [${ticket!.reference}]`,
      text:     'Thanks — I refreshed the page and the certificate is showing now. One more question: does the scan status ever change after upload?',
    },
  })
  expect(inboundResponse.ok()).toBe(true)
  const inboundJson = await inboundResponse.json()
  expect(inboundJson).toEqual({ action: 'threaded', ticketId: ticket!.id })

  const { data: customerReplyRow, error: customerReplyErr } = await admin
    .from('support_ticket_replies')
    .select('is_staff_reply, message')
    .eq('ticket_id', ticket!.id)
    .eq('is_staff_reply', false)
    .single()
  expect(customerReplyErr).toBeNull()
  expect(customerReplyRow!.message).toContain('does the scan status ever change')

  // Visible on both sides
  await page.reload()
  await expect(page.getByText('does the scan status ever change', { exact: false })).toBeVisible()
  await superadminPage.reload()
  await expect(superadminPage.getByText('does the scan status ever change', { exact: false })).toBeVisible()
  await expect(superadminPage.getByText('Customer', { exact: true })).toBeVisible()

  // ── Staff marks the ticket resolved ──────────────────────────────────────
  // Not waitForURL here — updateTicketStatus redirects back to this exact
  // same URL, so the page never actually navigates anywhere new and
  // waitForURL resolves immediately against the URL we're already on,
  // racing ahead of the real round-trip. Wait for the observable result
  // instead: the "Resolved" button disables itself once it's truly the
  // current status (disabled={opt.value === currentStatus} in
  // StaffReplyForm.tsx).
  await superadminPage.getByRole('button', { name: 'Resolved' }).click()
  await expect(superadminPage.getByRole('button', { name: 'Resolved' })).toBeDisabled()

  const { data: resolvedTicket, error: resolvedErr } = await admin
    .from('support_tickets')
    .select('status')
    .eq('id', ticket!.id)
    .single()
  expect(resolvedErr).toBeNull()
  expect(resolvedTicket!.status).toBe('resolved')

  await page.reload()
  await expect(page.getByText('This ticket has been resolved.')).toBeVisible()

  await superadminContext.close()
})
