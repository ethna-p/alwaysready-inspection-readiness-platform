/**
 * Governance meeting log (app/dashboard/governance/): recording, editing,
 * status filtering, the admin sign-off workflow, and a direct regression
 * check for a real, already-fixed privilege-escalation bug.
 *
 * Also fixed a real bug found while writing this spec: MeetingCard's edit
 * form (MeetingForm wired to updateMeeting) never closed itself on a
 * successful save -- unlike the "record new meeting" form elsewhere in the
 * same file, which already correctly does
 * `if (!result.error) setShowForm(false)`. A user who edited a meeting was
 * left staring at the still-open form with no feedback that the save
 * succeeded, and no way to reach Sign off without separately clicking
 * Cancel (which reads as "discard", not "close now that it worked"). Fixed
 * by mirroring the same success-closes-the-form pattern for the edit path.
 *
 * Migration 20260901000006_fix_governance_meeting_state_forgery.sql ("M2")
 * fixed a real vulnerability: governance_meetings' original UPDATE policy
 * let a staff member ('user' role) update their own draft meeting, but its
 * WITH CHECK only verified organisation_id -- not that the resulting row's
 * status stayed 'draft'. A staff member could smuggle status: 'signed_off'
 * into their own UPDATE payload and self-sign-off, bypassing the
 * admin-only sign-off requirement (and the audit-trail guarantee that
 * implies for CQC inspectors) entirely. The fix tightened WITH CHECK so a
 * staff-role update must keep status = 'draft' no matter what the payload
 * asks for.
 *
 * Exercised here for real: a genuine non-admin session (anon key +
 * signInWithPassword, not the service-role admin client) attempts exactly
 * that forged update directly against the database -- the same technique
 * already established in kloe-evidence-upload.spec.ts for confirming an
 * RLS fix actually holds, not just that the UI happens to hide a button.
 * Confirmed directly beforehand (a throwaway script against this same
 * preview project) that a WITH-CHECK rejection on an UPDATE whose USING
 * clause matched comes back as `{ data: [], error: null, status: 200 }`,
 * not a thrown error -- Postgrest silently drops the row rather than
 * raising, the same as an UPDATE ... WHERE that matches nothing.
 *
 * docs/FEATURE_MAP.md described this module as a "Governance alerts
 * panel" -- there is no such thing anywhere in this codebase; the real
 * feature is this meeting log. Corrected alongside this spec.
 *
 * The teammate account (role 'user', no MFA of its own) is shared with
 * other specs in this suite -- another spec may have changed its password,
 * so this spec resets it via the admin API first, same as
 * incidents.spec.ts and kloe-assignment.spec.ts do. Also mirrors
 * incidents.spec.ts's own MFA-factor cleanup at the end: this spec runs
 * BEFORE kloe-assignment.spec.ts and incidents.spec.ts in file order, so
 * leaving a real enrolled factor behind would break their own "teammate's
 * first login has no MFA yet" assumption.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { loadEnvLocal } from './support/env'
import { getAdminClient } from './support/admin'
import { tidy } from './support/db'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const ADMIN_MEETING_TITLE    = 'E2E Governance: Monthly QA Meeting'
const TEAMMATE_MEETING_TITLE = 'E2E Governance: Team Huddle Notes'

test('Governance Log: record, edit, sign off, filter, and a real self-sign-off forgery attempt', async ({ page, browser }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()
  const env = loadEnvLocal()

  const { error: pwResetErr } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwResetErr).toBeNull()

  async function recordMeeting(p: typeof page, opts: { title: string; agenda: string }) {
    await p.getByRole('button', { name: '+ Record meeting' }).click()
    await p.locator('input[name="title"]').fill(opts.title)
    await p.locator('input[name="meeting_date"]').fill(daysAgo(1))
    await p.locator('textarea[name="agenda"]').fill(opts.agenda)
    await p.getByRole('button', { name: 'Save meeting record' }).click()
    await expect(p.getByRole('button', { name: '+ Record meeting' })).toBeVisible()
  }

  // ── Admin: record, edit, sign off ────────────────────────────────────────
  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/governance')

  await recordMeeting(page, {
    title: ADMIN_MEETING_TITLE,
    agenda: 'Review of KLOE compliance status and open actions.',
  })

  const adminHeader = page.getByRole('button', { name: ADMIN_MEETING_TITLE })
  await expect(adminHeader).toContainText('Draft')

  await adminHeader.click()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.locator('textarea[name="key_decisions"]').fill('Agreed to increase evidence upload frequency for Safe KLOEs.')
  await page.getByRole('button', { name: 'Save changes' }).click()
  // A successful save must return to the read-only view -- not leave the
  // form open. A plain "is this text visible" check would pass even stuck
  // mid-edit, since a <textarea>'s own value renders as visible text too;
  // asserting the form itself is gone is what actually proves it returned.
  await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible()
  await expect(page.getByText('Agreed to increase evidence upload frequency')).toBeVisible()

  await page.getByRole('button', { name: 'Sign off', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, sign off' }).click()
  await expect(adminHeader).toContainText('Signed off')
  await expect(page.getByText(/Signed off .* by/)).toBeVisible()

  // Once signed off, even the admin loses Edit/Sign off/Delete through the
  // UI -- a deliberate "permanent record" design (same as Incidents, once
  // closed), not a bug.
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign off', exact: true })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).not.toBeVisible()

  // ── Status filter ─────────────────────────────────────────────────────
  const statusFilter = page.locator('select').first()
  await statusFilter.selectOption('draft')
  await expect(adminHeader).not.toBeVisible()
  await statusFilter.selectOption('signed_off')
  await expect(adminHeader).toBeVisible()
  await statusFilter.selectOption('')

  // ── Teammate: records their own draft, edits it, cannot sign off/delete ──
  const teammateContext = await browser.newContext()
  const teammatePage = await teammateContext.newPage()
  await login(teammatePage, { email: account.teammate.email, password: account.teammate.password })
  await completeMandatoryMfaSetup(teammatePage)

  await teammatePage.goto('/dashboard/governance')
  await recordMeeting(teammatePage, {
    title: TEAMMATE_MEETING_TITLE,
    agenda: 'Weekly team catch-up.',
  })

  const teammateHeader = teammatePage.getByRole('button', { name: TEAMMATE_MEETING_TITLE })
  await expect(teammateHeader).toContainText('Draft')
  await teammateHeader.click()

  // A non-admin sees Edit on their own draft, but never Sign off or Delete.
  await expect(teammatePage.getByRole('button', { name: 'Edit', exact: true })).toBeVisible()
  await expect(teammatePage.getByRole('button', { name: 'Sign off', exact: true })).not.toBeVisible()
  await expect(teammatePage.getByRole('button', { name: 'Delete', exact: true })).not.toBeVisible()

  await teammatePage.getByRole('button', { name: 'Edit', exact: true }).click()
  await teammatePage.locator('textarea[name="actions_arising"]').fill('Follow up with kitchen team on cleaning rota.')
  await teammatePage.getByRole('button', { name: 'Save changes' }).click()
  await expect(teammatePage.getByRole('button', { name: 'Save changes' })).not.toBeVisible()
  await expect(teammatePage.getByText('Follow up with kitchen team')).toBeVisible()

  const { data: teammateMeetingRow, error: teammateMeetingErr } = await admin
    .from('governance_meetings')
    .select('id')
    .eq('organisation_id', account.orgId)
    .eq('title', TEAMMATE_MEETING_TITLE)
    .single()
  expect(teammateMeetingErr).toBeNull()
  const teammateMeetingId = teammateMeetingRow!.id

  // ── The exact real bug M2 was fixed against: a staff member forging
  // status: 'signed_off' into their own draft's UPDATE payload to
  // self-sign-off. Direct, real session -- anon key + signInWithPassword,
  // not the service-role client. ──────────────────────────────────────────
  const anon = createClient(env.SUPABASE_PREVIEW_URL, env.SUPABASE_PREVIEW_ANON_KEY)
  const { error: signInError } = await anon.auth.signInWithPassword({
    email: account.teammate.email,
    password: account.teammate.password,
  })
  expect(signInError).toBeNull()

  const { data: forgedRows, error: forgeError } = await anon
    .from('governance_meetings')
    .update({
      status:        'signed_off',
      signed_off_by: account.teammate.userId,
      signed_off_at: new Date().toISOString(),
    })
    .eq('id', teammateMeetingId)
    .select()

  // WITH CHECK rejects the write outright -- Postgrest returns an empty
  // result with no error (the row exists and USING passes; it's WITH
  // CHECK on the resulting row that fails), so the real signal is
  // "nothing came back", not a thrown error. Confirmed directly beforehand
  // against this same project (see file doc comment).
  expect(forgeError).toBeNull()
  expect(forgedRows ?? []).toEqual([])

  const { data: stillDraft, error: stillDraftErr } = await admin
    .from('governance_meetings')
    .select('status, signed_off_by, signed_off_at')
    .eq('id', teammateMeetingId)
    .single()
  expect(stillDraftErr).toBeNull()
  expect(stillDraft!.status).toBe('draft')
  expect(stillDraft!.signed_off_by).toBeNull()
  expect(stillDraft!.signed_off_at).toBeNull()

  // The UI itself still reflects 'draft' too -- the forged write never
  // landed, so there's nothing for a reload to pick up.
  await teammatePage.reload()
  await expect(teammatePage.getByRole('button', { name: TEAMMATE_MEETING_TITLE })).toContainText('Draft')

  await teammateContext.close()

  // ── Cleanup: only this spec's own rows ────────────────────────────────
  tidy(await admin.from('governance_meetings').delete().eq('organisation_id', account.orgId).in('title', [ADMIN_MEETING_TITLE, TEAMMATE_MEETING_TITLE]), 'governance: delete governance_meetings')

  // completeMandatoryMfaSetup() above enrolled a real MFA factor for the
  // shared teammate account -- specs later in the same suite run
  // (kloe-assignment.spec.ts, incidents.spec.ts) assume it still has none
  // on ITS first login. Remove it, same reasoning and technique as
  // incidents.spec.ts's own cleanup.
  const { data: factorsData } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of factorsData?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }
})
