/**
 * Incident Log (app/dashboard/incidents/): logging, type/status filters, the
 * admin review -> closed workflow (learning outcome required to close), and
 * a non-admin reporter editing their own still-open incident.
 *
 * That last flow was actually broken until this spec's own accompanying
 * fix: IncidentCard's "Admin actions" row shows an "Edit" button to a
 * non-admin reporter of their own open/under-review incident (`canEdit`),
 * exactly matching what the incidents_update RLS policy and the
 * updateIncident() server action both already supported -- but the button
 * only ever toggled `showClose`, and the form that state was meant to
 * reveal (`{showClose && isAdmin && <CloseIncidentForm .../>}`) is gated to
 * admins only. For a real non-admin reporter, clicking "Edit" did nothing
 * visible: updateIncident() was never called from anywhere in the UI. Added
 * EditIncidentForm (mirrors LogIncidentForm's fields, prefilled, calling
 * the previously-dead updateIncident()) and wired it to
 * `{showClose && !isAdmin && ...}`. This spec's teammate section exercises
 * that exact path for real.
 *
 * Closing an incident hides the entire admin-actions row (gated on
 * `status !== 'closed'`), so a closed incident can't be deleted through the
 * UI either, even by an admin -- read as a deliberate "closed means
 * permanent audit record" design choice, not a bug, and asserted as such
 * below rather than worked around.
 *
 * The teammate account (role 'user', no MFA of its own) is shared with
 * other specs in this suite -- forced-password-change.spec.ts permanently
 * changes its password earlier in file order, so this spec resets it via
 * the admin API first, exactly like kloe-assignment.spec.ts does. No
 * earlier-running spec completes the teammate's MFA enrolment for real, so
 * this is still their first genuine login -- completeMandatoryMfaSetup
 * drives that the same way a real newly-invited teammate's first login
 * would. That enrolment is itself a mutation later specs don't expect
 * (kloe-assignment.spec.ts assumes the teammate's own first login still has
 * no factor), so cleanup at the end removes the factor again via the admin
 * MFA API -- symmetric with resetting the password back on the way in.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect, type Page } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { tidy } from './support/db'

const SAFETY_TITLE       = 'E2E Incident: Wet floor near kitchen entrance'
const SAFEGUARDING_TITLE = 'E2E Incident: Unexplained bruising noted on resident'
const TEAMMATE_TITLE     = 'E2E Incident: Fire door propped open overnight'

async function logIncident(page: Page, opts: { title: string; type: string; description: string }) {
  await page.getByRole('button', { name: '+ Log incident' }).click()
  await page.locator('input[name="title"]').fill(opts.title)
  await page.locator('select[name="incident_type"]').selectOption(opts.type)
  await page.locator('input[name="date_of_incident"]').fill(new Date().toISOString().slice(0, 10))
  await page.locator('textarea[name="description"]').fill(opts.description)
  await page.getByRole('button', { name: 'Log incident' }).click()
  await expect(page.getByRole('button', { name: '+ Log incident' })).toBeVisible()
}

test('Incident Log: create, filter, admin review/close, and a reporter editing their own open incident', async ({ page, browser }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const { error: pwResetErr } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwResetErr).toBeNull()

  // ── Admin: log two incidents of different types ──────────────────────────
  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/incidents')

  await logIncident(page, {
    title: SAFETY_TITLE, type: 'safety',
    description: 'Water spillage near the kitchen entrance, cordoned off and mopped immediately.',
  })
  await logIncident(page, {
    title: SAFEGUARDING_TITLE, type: 'safeguarding',
    description: 'Unexplained bruising noted during morning care, safeguarding lead informed.',
  })

  const safetyHeader       = page.getByRole('button', { name: SAFETY_TITLE })
  const safeguardingHeader = page.getByRole('button', { name: SAFEGUARDING_TITLE })
  await expect(safetyHeader).toBeVisible()
  await expect(safeguardingHeader).toBeVisible()

  // ── Type filter ────────────────────────────────────────────────────────
  const statusFilter = page.locator('select').nth(0)
  const typeFilter    = page.locator('select').nth(1)

  await typeFilter.selectOption('safety')
  await expect(safetyHeader).toBeVisible()
  await expect(safeguardingHeader).not.toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(safeguardingHeader).toBeVisible()

  // ── Admin review workflow: open -> under review (default action on a
  // still-open incident) -> closed (learning outcome required) ─────────────
  await safeguardingHeader.click()
  await page.getByRole('button', { name: 'Review / close' }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(safeguardingHeader).toContainText('Under review')

  // Re-opening now defaults straight to "Close incident" (currentStatus is
  // no longer 'open', so the "under review" radio doesn't even render).
  await page.getByRole('button', { name: 'Review / close' }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('A learning outcome is required before closing.')).toBeVisible()
  await expect(safeguardingHeader).toContainText('Under review') // unchanged -- save was rejected client-side

  await page.getByPlaceholder(/What has the service learned/).fill('Reviewed with the care team; bruising was accidental (documented fall), no further action needed.')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(safeguardingHeader).toContainText('Closed')
  await expect(page.getByText('Reviewed with the care team; bruising was accidental', { exact: false })).toBeVisible()

  // Closed means permanent: the whole admin-actions row (Review/close AND
  // Delete) disappears once status is 'closed', by design.
  await expect(page.getByRole('button', { name: 'Review / close' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).not.toBeVisible()

  // ── Status filter ─────────────────────────────────────────────────────
  await statusFilter.selectOption('closed')
  await expect(safeguardingHeader).toBeVisible()
  await expect(safetyHeader).not.toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()

  // ── Teammate: logs their own incident, then genuinely edits it ───────────
  const teammateContext = await browser.newContext()
  const teammatePage = await teammateContext.newPage()

  await login(teammatePage, { email: account.teammate.email, password: account.teammate.password })
  await completeMandatoryMfaSetup(teammatePage)

  await teammatePage.goto('/dashboard/incidents')
  await logIncident(teammatePage, {
    title: TEAMMATE_TITLE, type: 'near_miss',
    description: 'Fire door on the east corridor found propped open with a chair overnight.',
  })

  const teammateHeader = teammatePage.getByRole('button', { name: TEAMMATE_TITLE })
  await teammateHeader.click()

  // A non-admin reporter of their own still-open incident sees "Edit", not
  // "Review / close" -- and no Delete button at all.
  await expect(teammatePage.getByRole('button', { name: 'Review / close' })).not.toBeVisible()
  await expect(teammatePage.getByRole('button', { name: 'Delete', exact: true })).not.toBeVisible()

  const editedTitle = `${TEAMMATE_TITLE} (fixed same morning)`
  await teammatePage.getByRole('button', { name: 'Edit', exact: true }).click()
  await teammatePage.locator('input[name="title"]').fill(editedTitle)
  await teammatePage.getByRole('button', { name: 'Save changes' }).click()

  await expect(teammatePage.getByRole('button', { name: editedTitle })).toBeVisible()

  await teammateContext.close()

  // ── Cleanup: only this spec's own rows ────────────────────────────────
  tidy(await admin.from('incidents').delete().eq('organisation_id', account.orgId).in('title', [SAFETY_TITLE, SAFEGUARDING_TITLE, editedTitle]), 'incidents: delete incidents')

  // completeMandatoryMfaSetup() above just enrolled a real MFA factor for
  // the shared teammate account -- other specs later in the same suite run
  // (kloe-assignment.spec.ts, forced-password-change.spec.ts) assume it
  // still has none on ITS first login. Remove it so this spec doesn't leave
  // that assumption broken for whoever runs after it.
  const { data: factorsData } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of factorsData?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }
})
