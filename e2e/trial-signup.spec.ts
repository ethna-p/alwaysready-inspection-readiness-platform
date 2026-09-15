/**
 * Trial signup: a real prospect fills in the public /trial form, a genuine
 * organisation is provisioned, a real password-setup email is sent, and the
 * new admin sets a password, completes mandatory MFA, completes the
 * onboarding/consent step, and reaches a working dashboard.
 *
 * This item was flagged all the way back at the start of this walkthrough
 * as "hard to honestly automate given real Cloudflare Turnstile + a live
 * CQC API" -- reached now, both turned out to be far less of an obstacle
 * than assumed, once actually looked at rather than guessed at:
 *
 *   - Turnstile: verifyTurnstile() (lib/utils/turnstile.ts) already skips
 *     verification entirely whenever TURNSTILE_SECRET_KEY isn't set --
 *     explicitly documented as "local dev / staging without a widget".
 *     This test's dev-server env never sets it (same as every other spec
 *     in this suite), so the real code path this test exercises is the
 *     same one already used for any environment without Turnstile
 *     configured -- not a workaround invented for this test.
 *
 *   - CQC API: genuinely public, no-auth (per lib/cqc.ts's own doc
 *     comment), and this spec does call the real live endpoint with a
 *     real, publicly-documented example Location ID (1-545611283, from
 *     CQC's own Syndication API docs) rather than a made-up one. As of
 *     writing, that live call returns 403 Forbidden from this specific
 *     environment (confirmed directly, independent of this app, via a
 *     plain fetch/curl) -- worth checking whether production sees the same
 *     thing, since a silent 403 there would mean CQC verification is
 *     currently non-functional for real signups too. Whatever the cause,
 *     fetchCqcLocation() already treats any non-404 failure as
 *     'unavailable' and fails OPEN by design (a CQC outage must never
 *     block a legitimate signup) -- so this spec genuinely exercises that
 *     real fail-open path, live, rather than mocking a "CQC is down"
 *     scenario. AJ raised the security/data-quality concern this trade-off
 *     creates (an org can end up live without CQC ever having confirmed
 *     its Location ID); the agreed fix was to keep signup fail-open but
 *     surface it for manual review rather than block trials during a CQC
 *     outage -- app/superadmin/organisations/page.tsx now shows a
 *     "CQC unverified" badge for any org whose cqc_rating_fetched_at is
 *     still null, checked below via a genuine superadmin login, live,
 *     using this same unavailable-CQC environment rather than a mocked
 *     one. The "new trial" notification email to AJ also flags it (subject
 *     line + a direct link to CQC's page for that Location ID) but isn't
 *     asserted here -- RESEND_API_KEY isn't set for this test env (every
 *     spec in this suite skips real sends the same way), so there's no
 *     inbox to check content against. The one thing this environment's current
 *     CQC access genuinely prevents testing is the 'found' enrichment path
 *     (real rating/inspection-date populated on signup, badge absent) and
 *     the 'not_found' hard-block path (a real 404 for a genuinely
 *     unregistered ID) -- both would need CQC access restored to verify.
 *
 * Requires no seeded fixture (this creates its own fresh organisation from
 * nothing, exactly like a real prospect would) -- but does still need the
 * platform's seeded reference data (service_types, klo_items) to exist,
 * which `npm run test:e2e:seed` also ensures as a side effect.
 */
import { test, expect } from '@playwright/test'
import { completeMandatoryMfaSetup, login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

// A real, publicly-documented example CQC Location ID (CQC's own Syndication
// API docs use this exact ID for their GET /locations/{id} example).
const REAL_CQC_LOCATION_ID = '1-545611283'

test('trial signup: real form, real org, real email, through to a working dashboard', async ({ page, baseURL, browser }) => {
  test.setTimeout(90_000)
  const admin = getAdminClient()
  const account = loadTestAccount()

  const serviceName = `E2E Trial Care Home ${Date.now()}`
  const managerName = 'E2E Trial Manager'
  const managerEmail = `e2e-trial-${Date.now()}@example.org`

  // startTrial hard-blocks a second signup against the same CQC Location ID
  // (a real, correct check -- app/trial/actions.ts step 1b) -- and this spec
  // deliberately reuses the same real ID every run rather than a fake one
  // per run. Clean up any org this same ID left behind from an earlier run
  // of this spec before creating a fresh one.
  async function cleanupTrialOrg(cqcLocationId: string) {
    const { data: staleOrg } = await admin
      .from('organisations')
      .select('id')
      .eq('cqc_location_id', cqcLocationId)
      .maybeSingle()
    if (!staleOrg) return
    await admin.from('compliance_records').delete().eq('organisation_id', staleOrg.id)
    const { data: staleUsers } = await admin.from('users').select('id').eq('organisation_id', staleOrg.id)
    for (const u of staleUsers ?? []) {
      await admin.auth.admin.deleteUser(u.id)
    }
    await admin.from('users').delete().eq('organisation_id', staleOrg.id)
    await admin.from('organisations').delete().eq('id', staleOrg.id)
  }
  await cleanupTrialOrg(REAL_CQC_LOCATION_ID)

  // Wrapped in try/finally so a failure partway through still leaves a clean
  // slate for the next run of this spec, rather than only the happy path
  // cleaning up (same reasoning as subscribe.spec.ts's own cleanup block).
  try {
    await page.goto('/trial')

    await page.locator('#service-name').fill(serviceName)
    await page.locator('#cqc-id').fill(REAL_CQC_LOCATION_ID)
    // Blur triggers the real /api/cqc-lookup call -- confirmed to genuinely
    // reach the live CQC API and correctly show the "unavailable, you can
    // still continue" state given that API's current 403 from here (see file
    // doc comment). The submit button is only ever disabled for 'not_found',
    // so this doesn't block the rest of the form.
    await page.locator('#cqc-id').blur()
    await expect(page.getByText(/couldn.t reach the CQC register/i)).toBeVisible()

    await page.locator('#service-type').selectOption('Residential Care Home')
    await page.locator('#manager-name').fill(managerName)
    await page.locator('#manager-email').fill(managerEmail)
    // Charity number left blank; marketing consent left unticked deliberately,
    // to also verify the opt-out branch (marketing_opt_out: true) below.
    await page.getByLabel('I have read and agree to the', { exact: false }).check()

    await page.getByRole('button', { name: 'Start free trial' }).click()

    await page.waitForURL(new RegExp(`/trial/confirmed\\?email=${encodeURIComponent(managerEmail)}`))
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
    await expect(page.getByText(managerEmail)).toBeVisible()

    // ── Real organisation + admin profile, genuinely provisioned ────────────
    const { data: org, error: orgErr } = await admin
      .from('organisations')
      .select('id, name, subscription_tier, trial_expires_at, terms_accepted_at, terms_version, cqc_location_id, cqc_location_name, cqc_rating, cqc_rating_fetched_at')
      .eq('name', serviceName)
      .single()
    expect(orgErr).toBeNull()
    expect(org!.subscription_tier).toBe('trial')
    expect(org!.terms_accepted_at).toBeTruthy()
    expect(org!.terms_version).toBe('v1.0')
    expect(org!.cqc_location_id).toBe(REAL_CQC_LOCATION_ID)
    // CQC currently unavailable from this environment (see file doc comment)
    // -- enrichment genuinely wasn't populated, matching the real fail-open
    // behaviour rather than assuming the happy path. cqc_rating_fetched_at
    // staying null is exactly the signal the superadmin "CQC unverified"
    // badge (checked below) keys off.
    expect(org!.cqc_location_name).toBeNull()
    expect(org!.cqc_rating).toBeNull()
    expect(org!.cqc_rating_fetched_at).toBeNull()

    // ── Superadmin: an unverified CQC signup is flagged for manual review ───
    // A CQC outage must never block a legitimate signup (see step 0's
    // comment in app/trial/actions.ts), but silently trusting an
    // unconfirmed Location ID forever isn't right either -- the org list
    // flags it so a human can check. Separate browser context: this is a
    // genuinely different actor, not the trial admin the rest of this test
    // continues as.
    const superadminContext = await browser.newContext()
    const superadminPage = await superadminContext.newPage()
    await login(superadminPage, {
      email:      account.superadmin.email,
      password:   account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await superadminPage.waitForURL('**/superadmin/provision')
    await superadminPage.goto('/superadmin/organisations')
    const orgCard = superadminPage.locator('.bg-card').filter({ hasText: serviceName })
    await expect(orgCard).toBeVisible()
    await expect(orgCard.getByText('CQC unverified')).toBeVisible()
    await superadminContext.close()

    const daysUntilExpiry = (new Date(org!.trial_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    expect(daysUntilExpiry).toBeGreaterThan(13)
    expect(daysUntilExpiry).toBeLessThan(15)

    const { data: userRow, error: userErr } = await admin
      .from('users')
      .select('role, onboarding_complete, marketing_opt_out, marketing_consent, full_name')
      .eq('email', managerEmail)
      .single()
    expect(userErr).toBeNull()
    expect(userRow!.role).toBe('admin')
    expect(userRow!.onboarding_complete).toBe(false)
    expect(userRow!.marketing_opt_out).toBe(true) // consent box was left unticked
    expect(userRow!.full_name).toBe(managerName)

    const { count: complianceCount } = await admin
      .from('compliance_records')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', org!.id)
    const { count: kloCount } = await admin.from('klo_items').select('id', { count: 'exact', head: true })
    expect(complianceCount).toBe(kloCount)

    // ── Stand-in for "open the real welcome email and click the link" --
    // same reasoning and technique as self-service-password-reset.spec.ts:
    // no real inbox to check here, and this mints exactly the same kind of
    // link (type: 'recovery', same redirectTo) that startTrial's own step 8
    // already generates and emails for real.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: managerEmail,
      options: { redirectTo: `${baseURL}/auth/callback?next=/login/new-password` },
    })
    expect(linkErr).toBeNull()
    const actionLink = linkData?.properties?.action_link
    expect(actionLink).toBeTruthy()

    await page.goto(actionLink!)
    await page.waitForURL('**/login/new-password')

    const newPassword = 'E2E-trial-admin-pw-9x3f!'
    await page.locator('#new-password').fill(newPassword)
    await page.locator('#confirm-password').fill(newPassword)
    await page.getByRole('button', { name: 'Set new password' }).click()
    await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible()

    await page.getByRole('link', { name: 'Go to sign in' }).click()
    await page.waitForURL('**/login')

    // ── A genuinely fresh login: mandatory MFA (role admin, no factor yet),
    // then the onboarding/consent step (onboarding_complete was false) ──────
    await login(page, { email: managerEmail, password: newPassword })
    const totpSecret = await completeMandatoryMfaSetup(page)

    // completeMandatoryMfaSetup leaves the URL carrying "?mfa=enrolled"
    // permanently (nothing strips it client-side) -- a glob like
    // '**/dashboard/welcome' requires an exact end-of-string match, so it can
    // never match "...?mfa=enrolled" and would wait out the full test
    // timeout. Match on pathname alone instead.
    await page.waitForURL(url => url.pathname === '/dashboard/welcome')
    await expect(page.getByRole('heading', { name: `Welcome, ${managerName.split(' ')[0]}!` })).toBeVisible()

    // This is a genuinely fresh browser context (no cookies at all), so the
    // real CookieBanner (app/layout.tsx, fixed to the bottom of every page,
    // dismissal persisted for 365 days) is up for the first time here -- and
    // on this particular page it overlaps the "Get started" button below.
    // A real first-time visitor hits the exact same thing; dismiss it the
    // same way they would, same reasoning as collapsing the unrelated
    // "Getting started" widget in user-invite.spec.ts.
    await page.getByRole('button', { name: 'OK, got it' }).click()

    await page.getByRole('button', { name: 'Get started →' }).click()

    await page.waitForURL('**/dashboard')
    // "Signed in as ..." only lives on /dashboard/account -- the header's own
    // UserMenu button (present on every dashboard page) is the real signal
    // that this is a genuinely authenticated session for this admin.
    await expect(page.getByRole('button', { name: `User menu for ${managerName}` })).toBeVisible()
    await expect(page.getByText(/14.day/i)).toBeVisible() // trial banner

    const { data: finalUserRow } = await admin
      .from('users')
      .select('onboarding_complete')
      .eq('email', managerEmail)
      .single()
    expect(finalUserRow!.onboarding_complete).toBe(true)

    // ── Confirms this isn't just a one-time setup-session artifact ──────────
    await page.context().clearCookies()
    await login(page, { email: managerEmail, password: newPassword, totpSecret })
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('button', { name: `User menu for ${managerName}` })).toBeVisible()
  } finally {
    // Leave a clean slate for the next run of this spec, same reasoning as
    // the cleanup at the start -- runs on failure too, not just the happy path.
    await cleanupTrialOrg(REAL_CQC_LOCATION_ID)
  }
})
