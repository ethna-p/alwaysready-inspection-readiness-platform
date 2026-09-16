/**
 * Superadmin "Reset MFA" on /superadmin/organisations — the last-resort
 * recovery path for a SOLE admin locked out with no other admin in their
 * org (resetTeamMemberMfa has no target) and no backup codes left. Built
 * after a real production lockout in this session; productizes what used
 * to be a manual script run against the production service-role client
 * into an audited, one-click action. See organisations/actions.ts's
 * resetOrgAdminMfa for the design rationale.
 *
 * Uses its own disposable organisation + admin user, given a real enrolled
 * TOTP factor via the actual setup flow, rather than the shared fixture --
 * this spec is about the superadmin action reaching across orgs, not the
 * shared account.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('superadmin resets a sole admin\'s MFA from another org, real removal', async ({ page }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const orgName    = `E2E Superadmin MFA Reset Org ${Date.now()}`
  const adminEmail = `e2e-superadmin-mfa-reset-admin-${Date.now()}@example.org`
  const adminName  = 'E2E Sole Admin'
  const adminPassword = `E2E-superadmin-mfa-target-pw-${Date.now()}!`

  const { data: svcType, error: svcTypeError } = await admin
    .from('service_types')
    .select('id')
    .limit(1)
    .single()
  expect(svcTypeError).toBeNull()

  const { data: org, error: orgError } = await admin
    .from('organisations')
    .insert({ name: orgName, service_type_id: svcType!.id, subscription_tier: 'active' })
    .select('id')
    .single()
  expect(orgError).toBeNull()
  const orgId = org!.id

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  })
  expect(authError).toBeNull()
  const targetUserId = authUser!.user.id

  const { error: profileError } = await admin.from('users').insert({
    id: targetUserId,
    organisation_id: orgId,
    email: adminEmail,
    role: 'admin',
    full_name: adminName,
    username: `e2e_superadmin_mfa_reset_${Date.now()}`,
    onboarding_complete: true,
  })
  expect(profileError).toBeNull()

  try {
    // ── Give the sole admin a real, enrolled TOTP factor ──────────────────
    const soleAdminContext = await page.context().browser()!.newContext()
    const soleAdminPage = await soleAdminContext.newPage()
    await login(soleAdminPage, { email: adminEmail, password: adminPassword })
    await completeMandatoryMfaSetup(soleAdminPage)
    await soleAdminContext.close()

    const { data: factorsBefore } = await admin.auth.admin.mfa.listFactors({ userId: targetUserId })
    expect(factorsBefore?.factors.length).toBe(1)

    // ── Superadmin resets it from the organisations list ──────────────────
    await login(page, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await page.waitForURL('**/superadmin/provision')
    await page.goto('/superadmin/organisations')

    const card = page.locator('.bg-card').filter({ hasText: orgName })
    await expect(card).toBeVisible()
    await expect(card.getByText(adminEmail)).toBeVisible()

    await card.getByRole('button', { name: 'Reset MFA' }).click()
    const dialogHeading = page.getByRole('heading', { name: `Reset MFA for ${adminName}?` })
    await expect(dialogHeading).toBeVisible()
    // Scoped to the confirm dialog itself -- other org cards on this shared
    // list can have their own "Reset MFA" trigger button with the same name.
    const dialog = dialogHeading.locator('xpath=..')
    await dialog.getByRole('button', { name: 'Reset MFA' }).click()
    await expect(card.getByText('MFA reset.', { exact: false })).toBeVisible()

    // ── Genuinely gone server-side ──────────────────────────────────────
    const { data: factorsAfter } = await admin.auth.admin.mfa.listFactors({ userId: targetUserId })
    expect(factorsAfter?.factors.length).toBe(0)
  } finally {
    await admin.auth.admin.deleteUser(targetUserId).catch(() => {})
    await admin.from('users').delete().eq('organisation_id', orgId)
    await admin.from('organisations').delete().eq('id', orgId)
  }
})
