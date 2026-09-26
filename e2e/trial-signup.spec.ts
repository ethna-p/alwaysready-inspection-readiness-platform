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
 *   - CQC API: calls the real live Syndication API (api.service.cqc.org.uk)
 *     using the CQC_API_KEY subscription key from .env.local, the same way
 *     production does. The main test signs up with a real, currently
 *     registered adult social care location (Highlands Borders Care Home,
 *     1-1000587219), so it exercises the 'found' enrichment path: real
 *     location name and rating stored, and no "CQC unverified" badge for
 *     superadmin. A second test uses a real GP practice (Morden Hall Medical
 *     Centre, 1-545611283, CQC's own documentation example), which is on the
 *     register but outside adult social care, and confirms sign-up is
 *     refused. If CQC_API_KEY is missing or rejected, every lookup fails open
 *     as 'unavailable' and both tests fail loudly, which is the intended
 *     signal that CQC verification is not working.
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
import { tidy } from './support/db'

// A real, currently registered adult social care location (a care home).
const REAL_CQC_LOCATION_ID = '1-1000587219'
const REAL_CQC_LOCATION_NAME = 'Highlands Borders Care Home'
// A real location that is on the CQC register but is NOT adult social care
// (a GP practice, CQC's own documentation example), so must be refused.
const NON_ASC_CQC_LOCATION_ID = '1-545611283'

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
    tidy(await admin.from('compliance_records').delete().eq('organisation_id', staleOrg.id), 'trial-signup: delete compliance_records')
    const { data: staleUsers } = await admin.from('users').select('id').eq('organisation_id', staleOrg.id)
    for (const u of staleUsers ?? []) {
      await admin.auth.admin.deleteUser(u.id)
    }
    tidy(await admin.from('users').delete().eq('organisation_id', staleOrg.id), 'trial-signup: delete users')
    tidy(await admin.from('organisations').delete().eq('id', staleOrg.id), 'trial-signup: delete organisations')
  }
  await cleanupTrialOrg(REAL_CQC_LOCATION_ID)

  // Wrapped in try/finally so a failure partway through still leaves a clean
  // slate for the next run of this spec, rather than only the happy path
  // cleaning up (same reasoning as subscribe.spec.ts's own cleanup block).
  try {
    await page.goto('/trial')

    await page.locator('#service-name').fill(serviceName)
    await page.locator('#cqc-id').fill(REAL_CQC_LOCATION_ID)
    // Blur triggers the real /api/cqc-lookup call against the live CQC API,
    // which confirms this eligible adult social care location by name.
    await page.locator('#cqc-id').blur()
    await expect(page.getByText(`Found: ${REAL_CQC_LOCATION_NAME}`)).toBeVisible()

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
    // CQC confirmed the location, so the org is enriched with real CQC data.
    // A non-null cqc_rating_fetched_at is what keeps the superadmin
    // "CQC unverified" badge (checked below) away.
    expect(org!.cqc_location_name).toBe(REAL_CQC_LOCATION_NAME)
    expect(org!.cqc_rating_fetched_at).toBeTruthy()

    // ── Superadmin: a CQC-verified signup is NOT flagged for review ─────────
    // The "CQC unverified" badge only appears when CQC could not be reached
    // at signup (fail-open). This org was verified, so the badge must be
    // absent. Separate browser context: a genuinely different actor, not the
    // trial admin the rest of this test continues as.
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
    await expect(orgCard.getByText('CQC unverified')).toHaveCount(0)
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

test('trial signup: a CQC location outside adult social care is refused', async ({ page }) => {
  const admin = getAdminClient()
  const serviceName = `E2E Non-ASC ${Date.now()}`

  await page.goto('/trial')
  await page.locator('#service-name').fill(serviceName)
  await page.locator('#cqc-id').fill(NON_ASC_CQC_LOCATION_ID)
  await page.locator('#cqc-id').blur()

  // The live lookup finds the GP practice but marks it ineligible, and the
  // form refuses to go any further.
  await expect(page.getByText(/isn.t a currently registered adult social care service/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start free trial' })).toBeDisabled()

  // Nothing was provisioned for it.
  const { data: org } = await admin
    .from('organisations')
    .select('id')
    .eq('name', serviceName)
    .maybeSingle()
  expect(org).toBeNull()
})
