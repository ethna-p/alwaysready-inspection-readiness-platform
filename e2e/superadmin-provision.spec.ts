/**
 * Superadmin provision (app/superadmin/provision/) — manually create a new
 * organisation + admin user outside the self-serve /trial flow. Used for
 * demos, beta invites, and onboarding a provider who signed up some other
 * way (phone, email).
 *
 * Drives the real form end-to-end: organisation + service type + trial
 * length + the tester/beta/charity flags, and the admin user's own name,
 * email, and temporary password. Confirms everything provisionOrganisation
 * (actions.ts) actually persists -- the org row (including the three
 * boolean flags, which only ever get exercised by this one form), the auth
 * user, the public.users profile (role: admin, onboarding_complete: false
 * so the real Welcome flow triggers on first login), and the 24
 * compliance_records rows seeded one per KLOE -- then proves the account
 * genuinely works by logging in with the exact credentials the form
 * displayed, all the way through mandatory MFA enrolment.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('superadmin provisions a new organisation, and the admin account it creates genuinely works', async ({ page, browser }) => {
  test.setTimeout(120_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const orgName       = `E2E Provisioned Org ${Date.now()}`
  const adminName     = 'E2E Provisioned Admin'
  const adminEmail    = `e2e-provisioned-admin-${Date.now()}@example.org`
  const adminPassword = `E2E-provisioned-pw-${Date.now()}!`

  let orgId: string | null = null
  let userId: string | null = null

  try {
    await login(page, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await page.waitForURL('**/superadmin/provision')

    await page.locator('#org_name').fill(orgName)
    await page.locator('#service_type').selectOption('Residential Care Home')
    await page.locator('#is_tester').check()   // keeps this disposable org out of real billing views
    await page.locator('#is_beta').check()
    await page.locator('#is_charity').check()
    await page.locator('#trial_days').fill('21')
    await page.locator('#admin_name').fill(adminName)
    await page.locator('#admin_email').fill(adminEmail)
    await page.locator('#admin_password').fill(adminPassword)
    await page.getByRole('button', { name: 'Provision organisation' }).click()

    await expect(page.getByText('✓ Organisation provisioned')).toBeVisible()
    // Each id is a <dd> immediately following its own <dt> label -- located
    // by that label rather than position, since both dd's share a class.
    orgId  = (await page.getByText('Org ID', { exact: true }).locator('xpath=following-sibling::dd[1]').innerText()).trim()
    userId = (await page.getByText('User ID', { exact: true }).locator('xpath=following-sibling::dd[1]').innerText()).trim()
    expect(userId.length).toBeGreaterThan(0)
    expect(orgId.length).toBeGreaterThan(0)

    // ── Organisation row: name, tier, trial length, all three flags ────────
    const { data: org, error: orgErr } = await admin
      .from('organisations')
      .select('name, subscription_tier, trial_expires_at, is_beta, is_tester, is_charity, service_type_id')
      .eq('id', orgId)
      .single()
    expect(orgErr).toBeNull()
    expect(org!.name).toBe(orgName)
    expect(org!.subscription_tier).toBe('trial')
    expect(org!.is_beta).toBe(true)
    expect(org!.is_tester).toBe(true)
    const daysUntilExpiry = (new Date(org!.trial_expires_at).getTime() - Date.now()) / 86_400_000
    expect(daysUntilExpiry).toBeGreaterThan(20)
    expect(daysUntilExpiry).toBeLessThan(22)

    // ── Admin user profile: role, org link, onboarding not yet complete ────
    const { data: profile, error: profileErr } = await admin
      .from('users')
      .select('email, full_name, role, organisation_id, onboarding_complete')
      .eq('id', userId)
      .single()
    expect(profileErr).toBeNull()
    expect(profile!.email).toBe(adminEmail)
    expect(profile!.full_name).toBe(adminName)
    expect(profile!.role).toBe('admin')
    expect(profile!.organisation_id).toBe(orgId)
    expect(profile!.onboarding_complete).toBe(false)

    // ── 24 compliance_records, one per KLOE ─────────────────────────────────
    const { count: recordCount, error: crErr } = await admin
      .from('compliance_records')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', orgId)
    expect(crErr).toBeNull()
    expect(recordCount).toBe(24)

    // ── The account genuinely works: real login with the exact credentials
    // the form displayed, through mandatory MFA enrolment and onboarding. ──
    const newAdminContext = await browser.newContext()
    const newAdminPage = await newAdminContext.newPage()
    await login(newAdminPage, { email: adminEmail, password: adminPassword })
    await completeMandatoryMfaSetup(newAdminPage)
    // A fresh admin (onboarding_complete: false) lands on Welcome next, same
    // as any other first login -- see welcome.spec.ts for that page's own
    // coverage; here it's just confirming the provisioned account reaches it.
    await newAdminPage.waitForURL(url => url.pathname === '/dashboard/welcome')
    await expect(newAdminPage.getByRole('heading', { name: `Welcome, ${adminName.split(' ')[0]}!` })).toBeVisible()
    await newAdminContext.close()
  } finally {
    if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {})
    if (orgId) {
      await admin.from('users').delete().eq('organisation_id', orgId)
      await admin.from('organisations').delete().eq('id', orgId)
    }
  }
})
