/**
 * Visitor (inspector) time-limited login: create -> works read-only -> expires
 * -> revoke.
 *
 * createVisitorLogin (app/dashboard/account/team-actions.ts) invites the visitor
 * by email exactly like inviteTeamMember: the visitor sets their OWN password from
 * the emailed link and the admin never sees a credential. (It used to create the
 * account with a generated password shown to the admin to pass on.)
 *
 * Covers:
 *   - admin invites a visitor via the real UI (a real invite email is sent) and is
 *     shown NO password; the visitor row is created as a viewer with an expiry
 *   - the visitor's "click the email" step is stood in for by an admin-minted magic
 *     link (same reasoning as user-invite.spec.ts), they set their own password on
 *     /account/setup, and log in (no MFA — middleware exempts viewers by
 *     design) and get genuinely read-only access: the "view-only" notice is
 *     shown, and the edit form is not rendered at all
 *   - expiry is enforced for real: viewer_expires_at is backdated directly via
 *     the admin client (equivalent to waiting for real time to pass) and the
 *     expired visitor is then genuinely locked out of every /dashboard route
 *     — this exercises the H3 RLS fix (get_user_org_id()/get_user_role()
 *     return NULL for an expired viewer), not just an app-layer check
 *   - admin revokes a still-active visitor login, and the revoked visitor's
 *     credentials no longer work at all (account deleted, not just expired)
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login, setPasswordFromInvite } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('visitor login: invite, set own password, read-only access, expiry, and revoke', async ({ page, browser, baseURL }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // A KLOE untouched by any other spec (see e2e/*.spec.ts's own .range() picks).
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id, title')
    .order('display_order')
    .range(11, 11)
  expect(kloErr).toBeNull()
  const [targetKlo] = kloItems! as unknown as { id: string; title: string }[]

  await login(page, account)
  await page.waitForURL('**/dashboard')

  // ── Admin creates a visitor login via the real UI ───────────────────────
  await page.goto('/dashboard/account?tab=team')

  const visitorEmail = `e2e-visitor-${Date.now()}@example.org`
  const visitorPassword = 'E2E-visitor-own-pw-4h7k!'
  await page.locator('#visitor_full_name').fill('E2E Test Inspector')
  await page.locator('#visitor_email').fill(visitorEmail)
  await page.locator('#duration_days').fill('7')
  await page.getByRole('button', { name: 'Send visitor invite' }).click()

  await expect(page.getByText('Invitation sent', { exact: true })).toBeVisible()
  await expect(page.getByText(`Invitation sent to ${visitorEmail}.`, { exact: false })).toBeVisible()
  // The admin is never shown a credential.
  await expect(page.getByText('Temporary password')).toHaveCount(0)
  await expect(page.locator('p.font-mono')).toHaveCount(0)

  const { data: createdRow, error: createdErr } = await admin
    .from('users')
    .select('id, organisation_id, role, onboarding_complete, viewer_expires_at')
    .eq('email', visitorEmail)
    .single()
  expect(createdErr).toBeNull()
  expect(createdRow!.organisation_id).toBe(account.orgId)
  expect(createdRow!.role).toBe('viewer')
  expect(createdRow!.onboarding_complete).toBe(true)
  const daysUntilExpiry = (new Date(createdRow!.viewer_expires_at!).getTime() - Date.now()) / 86_400_000
  expect(daysUntilExpiry).toBeGreaterThan(6.9)
  expect(daysUntilExpiry).toBeLessThan(7.1)

  // Confirm the row now shows up with a real, non-expired expiry (revalidatePath
  // now correctly targets this page — see team-actions.ts fix).
  await page.reload()
  const visitorRow = page.locator('tr', { has: page.getByText('E2E Test Inspector', { exact: true }) })
  await expect(visitorRow).toBeVisible()
  // 7 days out doesn't trigger the "(Nd left)" countdown suffix (that only
  // shows inside 2 days — see formatExpiry in visitor-row.tsx) — just confirm
  // it's a real date, not flagged as expired.
  await expect(visitorRow.getByText('(expired)')).toHaveCount(0)

  // ── The visitor opens the emailed link and sets their own password ─────
  await setPasswordFromInvite(browser, admin, baseURL!, visitorEmail, visitorPassword)

  // ── Visitor logs in and gets genuinely read-only access ─────────────────
  const visitorContext = await browser.newContext()
  const visitorPage = await visitorContext.newPage()
  await login(visitorPage, { email: visitorEmail, password: visitorPassword })
  await visitorPage.waitForURL('**/dashboard')

  await visitorPage.goto(`/dashboard/kloes/${targetKlo.id}`)
  await expect(visitorPage.getByText('You have view-only access. Contact your admin to make changes.')).toBeVisible()
  await expect(visitorPage.getByRole('heading', { name: 'Log first review' })).toHaveCount(0)
  await expect(visitorPage.getByRole('heading', { name: 'Update this KLOE' })).toHaveCount(0)

  await visitorContext.close()

  // ── Expiry is enforced for real (H3 RLS fix), not just in the UI ────────
  // Stand-in for "wait 7 real days": backdate viewer_expires_at directly,
  // same technique this suite already uses to force other kinds of state
  // (e.g. kloe-assignment.spec.ts resetting the teammate's password).
  const { data: visitorRowData, error: visitorLookupError } = await admin
    .from('users')
    .select('id')
    .eq('email', visitorEmail)
    .single()
  expect(visitorLookupError).toBeNull()

  const { error: backdateError } = await admin
    .from('users')
    .update({ viewer_expires_at: new Date(Date.now() - 60_000).toISOString() })
    .eq('id', visitorRowData!.id)
  expect(backdateError).toBeNull()

  const expiredVisitorContext = await browser.newContext()
  const expiredVisitorPage = await expiredVisitorContext.newPage()
  await login(expiredVisitorPage, { email: visitorEmail, password: visitorPassword })
  // A real login still succeeds (Supabase Auth itself doesn't know about
  // viewer_expires_at) — it's RLS that then blocks every org-scoped query,
  // which the dashboard layout treats as "no org" and bounces to /login.
  await expiredVisitorPage.waitForURL('**/login')

  // The expired visitor is still holding a signed-in session, so try the data endpoints directly with
  // it: none may hand over anything. (Inspectors must not get in once their expiry date has passed.)
  for (const path of ['/api/wizard-status', '/api/report-views', '/api/export-data', '/api/export-evidence']) {
    const res = await expiredVisitorContext.request.get(path)
    expect(res.status(), `${path} must refuse an expired visitor`).toBeGreaterThanOrEqual(400)
    expect(res.headers()['content-type'] ?? '').not.toContain('zip')
    expect(res.headers()['content-type'] ?? '').not.toContain('csv')
  }
  await expiredVisitorContext.close()

  // Restore a live expiry so the revoke step below exercises "revoke an
  // active visitor", not "revoke one that's already locked out" — a
  // materially different, already-covered case.
  const { error: restoreError } = await admin
    .from('users')
    .update({ viewer_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
    .eq('id', visitorRowData!.id)
  expect(restoreError).toBeNull()

  // ── Admin revokes the still-active visitor via the real UI ──────────────
  // Not asserting on the row's own transient "Revoked" text here: now that
  // revalidatePath targets the real page (see the team-actions.ts fix above),
  // the server-fetched visitor list refreshes to empty essentially as soon as
  // the action resolves — same click, just no longer racing a stale cache —
  // so the row can vanish before a local "Revoked" state ever gets observed.
  // The meaningful, non-racy assertion is the end state: gone for good.
  await page.reload()
  const activeVisitorRow = page.locator('tr', { has: page.getByText('E2E Test Inspector', { exact: true }) })
  await activeVisitorRow.getByRole('button', { name: 'Revoke' }).click()

  await expect(page.getByText('E2E Test Inspector', { exact: true })).toHaveCount(0)

  // Revoked means gone, not just expired — the account no longer exists at all.
  const revokedVisitorContext = await browser.newContext()
  const revokedVisitorPage = await revokedVisitorContext.newPage()
  await revokedVisitorPage.goto('/login')
  await revokedVisitorPage.locator('#login').fill(visitorEmail)
  await revokedVisitorPage.locator('#password').fill(visitorPassword)
  await revokedVisitorPage.getByRole('button', { name: 'Sign in' }).click()
  await expect(revokedVisitorPage.getByText('Incorrect email or password. Please try again.')).toBeVisible()
  await revokedVisitorContext.close()
})
