/**
 * Superadmin ticket reply box: the data-deletion reply templates stay, and no AI drafting is offered.
 *
 * The page reads a ticket's subject and message to decide what to offer (detectCategory in
 * app/superadmin/tickets/[ticketId]/page.tsx). A ticket that asks for data to be deleted gets a
 * "Load template" picker with the two deletion replies; an ordinary ticket gets a plain reply box.
 * There is no AI draft button or automatic draft on either (removed 2026-09-21; the support desk is
 * moving to OpenCRM).
 *
 * Requires the seeded fixture from `npm run test:e2e:seed`, including the superadmin fixture.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { tidy } from './support/db'

test('ticket reply box: deletion tickets offer the two deletion templates, ordinary tickets a plain box, neither an AI draft', async ({ page, browser }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const stamp = Date.now()
  const deletionSubject = `E2E please delete my data ${stamp}`
  const generalSubject = `E2E ordinary question ${stamp}`

  // Two tickets, submitted the way a real customer does.
  await login(page, account)
  await page.waitForURL('**/dashboard')
  for (const [subject, message] of [
    [deletionSubject, 'Please delete all of my data from your platform under my right to erasure.'],
    [generalSubject, 'How do I change the review date on a KLOE?'],
  ]) {
    await page.goto('/dashboard/support/new')
    await page.locator('#subject').fill(subject)
    await page.locator('#message').fill(message)
    await page.getByRole('button', { name: 'Submit ticket' }).click()
    await page.waitForURL(/\/dashboard\/support\/[0-9a-f-]+$/)
  }

  const { data: tickets, error } = await admin
    .from('support_tickets')
    .select('id, subject')
    .in('subject', [deletionSubject, generalSubject])
  expect(error).toBeNull()
  expect(tickets).toHaveLength(2)
  const deletionId = tickets!.find(t => t.subject === deletionSubject)!.id
  const generalId = tickets!.find(t => t.subject === generalSubject)!.id

  const superadminContext = await browser.newContext()
  try {
    const sp = await superadminContext.newPage()
    await login(sp, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await sp.waitForURL('**/superadmin/provision')

    // ── Deletion ticket: the picker with exactly the two deletion templates ──
    await sp.goto(`/superadmin/tickets/${deletionId}`)
    const picker = sp.getByRole('combobox')
    await expect(picker).toBeVisible()
    await expect(picker.locator('option')).toHaveText([
      'Load template…',
      'Acknowledgement + identity check',
      'Deletion completed — confirmation',
    ])
    await picker.selectOption({ label: 'Deletion completed — confirmation' })
    await expect(sp.getByPlaceholder('Select a template above, then edit…')).not.toHaveValue('')
    await expect(sp.getByText('Template loaded · edit before sending')).toBeVisible()
    await expect(sp.getByText(/AI draft/i)).toHaveCount(0)

    // ── Ordinary ticket: a plain reply box, no picker, no AI ────────────────
    await sp.goto(`/superadmin/tickets/${generalId}`)
    await expect(sp.getByPlaceholder('Type your reply here…')).toBeVisible()
    await expect(sp.getByRole('combobox')).toHaveCount(0)
    await expect(sp.getByText(/AI draft/i)).toHaveCount(0)
    await expect(sp.getByText(/AI suggested/i)).toHaveCount(0)
  } finally {
    await superadminContext.close()
    for (const id of [deletionId, generalId]) {
      tidy(await admin.from('support_ticket_replies').delete().eq('ticket_id', id), 'support-reply-templates: delete replies')
      tidy(await admin.from('support_tickets').delete().eq('id', id), 'support-reply-templates: delete ticket')
    }
  }
})
