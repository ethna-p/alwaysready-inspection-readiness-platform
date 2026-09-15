/**
 * Feedback Log (app/dashboard/feedback/): complaints/compliments/
 * suggestions/concerns, editing, admin-only status changes, type/status
 * filtering, and a direct regression check for a real, just-fixed
 * privilege-escalation bug.
 *
 * This module was entirely missing from docs/FEATURE_MAP.md -- discovered
 * while checking the AI support-draft prompt (lib/ai-draft-faq.ts) and the
 * marketing site's chatbot for stale feature references at AJ's request.
 * Both already described this module accurately (including admin-only
 * status changes), which is what led to actually reading the code and
 * finding two real bugs neither prompt could have caught:
 *
 *   1. SECURITY (migration 20260915091000_fix_feedback_records_state_forgery.sql):
 *      feedback_records' UPDATE policy let staff (role 'user') update their
 *      own open record, but its WITH CHECK only verified organisation_id --
 *      not that the resulting status stayed 'open'. FeedbackForm only
 *      renders the status field for admins ("Status — only admins can
 *      change status"), confirming the intended design already matches
 *      governance_meetings' admin-only sign-off model -- but unlike
 *      governance_meetings (fixed as "M2" in
 *      20260901000006_fix_governance_meeting_state_forgery.sql), this
 *      sibling table never got the equivalent fix. A staff member could
 *      bypass the UI and set status to 'actioned' or 'closed' on their own
 *      record, silently hiding it from open-item oversight. Fixed the same
 *      way as M2; exercised here for real with a genuine non-admin session
 *      (anon key + signInWithPassword), the same technique already
 *      established in kloe-evidence-upload.spec.ts and governance.spec.ts.
 *
 *   2. FeedbackCard's edit form (FeedbackForm wired to updateFeedback)
 *      never closed itself on a successful save -- the exact same bug
 *      found and fixed in GovernanceClient.tsx's own edit form, in the
 *      sibling module right next to this one. Fixed the same way: the
 *      edit path now mirrors the "record new feedback" form's own
 *      `if (!result.error) setEditing(false)` pattern.
 *
 * Unlike Incidents/Governance, Feedback does NOT treat a closed record as
 * permanent -- canEdit for an admin has no status restriction at all
 * (`isAdmin || (created_by === currentUserId && status === 'open')`), and
 * neither does the Delete button's render gate. Confirmed as a genuine,
 * consistent (UI matches RLS) design difference, not a bug -- asserted
 * below rather than assumed.
 *
 * The teammate account (role 'user', no MFA of its own) is shared with
 * other specs in this suite. This spec resets its password defensively
 * before use (same reasoning as incidents.spec.ts and governance.spec.ts,
 * even though "feedback.spec.ts" currently sorts before
 * "forced-password-change.spec.ts" alphabetically -- file order is not
 * something to depend on) and cleans up the real MFA factor
 * completeMandatoryMfaSetup() enrols, so later specs' "teammate's first
 * login has no MFA yet" assumption still holds.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { loadEnvLocal } from './support/env'
import { getAdminClient } from './support/admin'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const ADMIN_FEEDBACK_SUMMARY    = 'E2E Feedback: family raised concern about meal choices'
const TEAMMATE_FEEDBACK_SUMMARY = 'E2E Feedback: resident praised the new activities schedule'

test('Feedback Log: log, edit, admin-only status changes, filter, and a real self-close forgery attempt', async ({ page, browser }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()
  const env = loadEnvLocal()

  const { error: pwResetErr } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwResetErr).toBeNull()

  async function logFeedback(p: typeof page, opts: { type: string; summary: string }) {
    await p.getByRole('button', { name: '+ Log feedback' }).click()
    await p.locator('select[name="feedback_type"]').selectOption(opts.type)
    await p.locator('input[name="received_date"]').fill(daysAgo(1))
    await p.locator('select[name="source"]').selectOption('family_or_carer')
    await p.locator('textarea[name="summary"]').fill(opts.summary)
    await p.getByRole('button', { name: 'Save feedback' }).click()
    await expect(p.getByRole('button', { name: '+ Log feedback' })).toBeVisible()
  }

  // ── Admin: log, edit, change status ──────────────────────────────────────
  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/feedback')

  await logFeedback(page, { type: 'complaint', summary: ADMIN_FEEDBACK_SUMMARY })

  const adminCard = page.locator('div.bg-card', { hasText: ADMIN_FEEDBACK_SUMMARY })
  await expect(adminCard.getByText('Open', { exact: true })).toBeVisible()

  await adminCard.locator('button').first().click() // header row toggles expand
  await adminCard.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.locator('textarea[name="action_taken"]').fill('Discussed alternative menu options with the family and catering team.')
  // Admin sees the status field -- move it to Actioned as part of the same edit.
  await page.locator('select[name="status"]').selectOption('actioned')
  await page.getByRole('button', { name: 'Save changes' }).click()
  // A successful save must return to the read-only view -- not leave the
  // form open (the exact bug this spec was written to catch and confirm fixed).
  await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible()
  await expect(adminCard.getByText('Actioned', { exact: true })).toBeVisible()
  await expect(page.getByText('Discussed alternative menu options')).toBeVisible()

  // ── Filters ────────────────────────────────────────────────────────────
  const typeFilter   = page.locator('select').nth(0)
  const statusFilter = page.locator('select').nth(1)

  await typeFilter.selectOption('compliment')
  await expect(adminCard).not.toBeVisible()
  await typeFilter.selectOption('')

  await statusFilter.selectOption('open')
  await expect(adminCard).not.toBeVisible()
  await statusFilter.selectOption('')
  await expect(adminCard).toBeVisible()

  // The filter round-trip unmounted and remounted this card (React drops
  // local state for a keyed element that briefly leaves the tree), so it's
  // freshly collapsed -- expand it again before checking its actions.
  await adminCard.locator('button').first().click()

  // Unlike Incidents/Governance, an admin can still edit/delete a
  // non-"open" Feedback record -- a genuine design difference (RLS agrees:
  // admins have no status restriction), not a bug.
  await expect(adminCard.getByRole('button', { name: 'Edit', exact: true })).toBeVisible()
  await expect(adminCard.getByRole('button', { name: 'Delete', exact: true })).toBeVisible()

  // ── Teammate: logs their own, edits it, cannot change status ─────────────
  const teammateContext = await browser.newContext()
  const teammatePage = await teammateContext.newPage()
  await login(teammatePage, { email: account.teammate.email, password: account.teammate.password })
  await completeMandatoryMfaSetup(teammatePage)

  await teammatePage.goto('/dashboard/feedback')
  await logFeedback(teammatePage, { type: 'compliment', summary: TEAMMATE_FEEDBACK_SUMMARY })

  const teammateCard = teammatePage.locator('div.bg-card', { hasText: TEAMMATE_FEEDBACK_SUMMARY })
  await expect(teammateCard.getByText('Open', { exact: true })).toBeVisible()
  await teammateCard.locator('button').first().click() // header row toggles expand
  await teammateCard.getByRole('button', { name: 'Edit', exact: true }).click()

  // A non-admin never sees the status field at all.
  await expect(teammatePage.locator('select[name="status"]')).not.toBeVisible()

  await teammatePage.locator('textarea[name="outcome"]').fill('Passed on to the activities coordinator.')
  await teammatePage.getByRole('button', { name: 'Save changes' }).click()
  await expect(teammatePage.getByRole('button', { name: 'Save changes' })).not.toBeVisible()
  await expect(teammatePage.getByText('Passed on to the activities coordinator')).toBeVisible()

  const { data: teammateRecordRow, error: teammateRecordErr } = await admin
    .from('feedback_records')
    .select('id')
    .eq('organisation_id', account.orgId)
    .eq('summary', TEAMMATE_FEEDBACK_SUMMARY)
    .single()
  expect(teammateRecordErr).toBeNull()
  const teammateRecordId = teammateRecordRow!.id

  // ── The exact bug the migration above fixed: a staff member forging
  // status: 'closed' into their own open record's UPDATE payload to
  // self-close it. Direct, real session -- anon key + signInWithPassword,
  // not the service-role client. ──────────────────────────────────────────
  const anon = createClient(env.SUPABASE_PREVIEW_URL, env.SUPABASE_PREVIEW_ANON_KEY)
  const { error: signInError } = await anon.auth.signInWithPassword({
    email: account.teammate.email,
    password: account.teammate.password,
  })
  expect(signInError).toBeNull()

  const { data: forgedRows, error: forgeError } = await anon
    .from('feedback_records')
    .update({ status: 'closed' })
    .eq('id', teammateRecordId)
    .select()

  // WITH CHECK rejects the write outright -- Postgrest returns an empty
  // result with no error (same confirmed behaviour as the governance_meetings
  // equivalent check in governance.spec.ts), not a thrown error.
  expect(forgeError).toBeNull()
  expect(forgedRows ?? []).toEqual([])

  const { data: stillOpen, error: stillOpenErr } = await admin
    .from('feedback_records')
    .select('status')
    .eq('id', teammateRecordId)
    .single()
  expect(stillOpenErr).toBeNull()
  expect(stillOpen!.status).toBe('open')

  await teammatePage.reload()
  await expect(teammatePage.locator('div.bg-card', { hasText: TEAMMATE_FEEDBACK_SUMMARY }).getByText('Open', { exact: true })).toBeVisible()

  await teammateContext.close()

  // ── Cleanup: only this spec's own rows ────────────────────────────────
  await admin.from('feedback_records').delete().eq('organisation_id', account.orgId).in('summary', [ADMIN_FEEDBACK_SUMMARY, TEAMMATE_FEEDBACK_SUMMARY])

  // completeMandatoryMfaSetup() above enrolled a real MFA factor for the
  // shared teammate account -- specs later in the same suite run assume it
  // still has none on ITS first login. Remove it, same reasoning and
  // technique as incidents.spec.ts and governance.spec.ts.
  const { data: factorsData } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of factorsData?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }
})
