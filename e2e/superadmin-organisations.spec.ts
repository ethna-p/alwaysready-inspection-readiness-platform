/**
 * Superadmin organisations: impersonate a customer's admin, and permanently
 * delete an organisation.
 *
 * These are the two most consequential actions in the entire admin panel --
 * "log in as any customer without their password" and "permanently delete
 * an organisation and everything in it" -- and neither had ever been
 * exercised by a real test before this spec. Three real, significant issues
 * were found and fixed (or, for the third, deliberately deferred) while
 * building it:
 *
 *   1. lib/assert-superadmin.ts checked identity (email match) but never
 *      AAL2 -- unlike every other sensitive action in this app, which gets
 *      AAL2 enforcement via isAAL2Satisfied(). A superadmin session that
 *      was authenticated but hadn't completed MFA this session could still
 *      have called either action directly. Fixed alongside this spec; see
 *      that file's own doc comment. The negative case (an aal1 superadmin
 *      session) isn't tested here: the seeded superadmin fixture only ever
 *      has a fully-verified aal2 session (real MFA, same as every other
 *      spec), and middleware already blocks an aal1 session from ever
 *      reaching a superadmin page in the first place -- so there's no way
 *      to click a button that would exercise assertSuperadmin() pre-MFA
 *      through the real UI. The fix itself is a straight mirror of an
 *      already-relied-on helper.
 *
 *   2. generateImpersonationLink's magic link pointed redirectTo straight
 *      at /dashboard instead of through /auth/callback. A magic link is the
 *      implicit flow (no code_verifier exists for a link minted on someone
 *      else's behalf), so Supabase delivers the session as a URL fragment
 *      -- which only /auth/callback (via /auth/callback/complete) knows how
 *      to parse and exchange into a real session. Pointed straight at
 *      /dashboard, "View as admin" opened a new tab that silently kept
 *      whatever session the browser already had (the superadmin's own,
 *      since window.open shares the same cookie jar) instead of ever
 *      becoming the target admin -- confirmed directly: the button visibly
 *      "worked" (a tab opened) but never actually impersonated anyone.
 *      Same category of bug as the staff-invite fix in commit 9596ee7.
 *      Fixed here too.
 *
 * With (2) fixed, a THIRD, deeper issue came into view -- actually two of
 * them, both tracked rather than fixed here:
 *
 *   - https://github.com/ethna-p/alwaysready-inspection-readiness-platform/issues/29:
 *     the session exchange now genuinely happens, but it can only ever
 *     produce an aal1 session (a magic link proves email/link possession,
 *     not MFA) -- so for any admin who has already enrolled MFA (which, per
 *     this app's own middleware, is eventually every real admin), the new
 *     tab lands on /login/mfa asking for a code the superadmin doesn't
 *     have. This spec's impersonation test covers the one scenario that
 *     does work today -- a freshly provisioned admin who hasn't reached
 *     their own first login yet.
 *
 *   - https://github.com/ethna-p/alwaysready-inspection-readiness-platform/issues/30:
 *     the session exchange genuinely happening also means it genuinely
 *     *overwrites* the superadmin's own session cookie -- cookies aren't
 *     tab-scoped, so the popup's setSession() call for the target admin
 *     silently clobbers the superadmin's own session everywhere in that
 *     browser, contradicting this page's own "your superadmin session
 *     stays open here" copy. Confirmed directly: after impersonating,
 *     reloading the *original* superadmin tab redirects to /dashboard --
 *     it's no longer authenticated as the superadmin at all. This is why
 *     impersonation and deletion are tested as two INDEPENDENT flows below,
 *     each with its own fresh superadmin login, rather than impersonating
 *     and then deleting in the same browser session as a single sequence --
 *     doing that would depend on the very bug #30 describes rather than
 *     exercise the delete flow's own real behaviour.
 *
 * Also fixed alongside this spec: deleteOrganisation's own body wasn't
 * wrapped in try/catch, so a step that threw instead of returning {error}
 * (supabase.auth.admin.deleteUser() is a real Promise, unlike the Postgrest
 * builder calls around it, which don't throw) would crash the whole server
 * action -- and an uncaught throw from a server action crashes the client's
 * RSC tree with a generic "An unexpected response was received from the
 * server" error, taking the org's card down with it even though the org was
 * never actually deleted. See that function's own comment in actions.ts.
 *
 * Each test uses its own disposable organisation + admin user (created
 * directly, not through the real /trial signup flow -- this spec is about
 * the superadmin actions, not signup) rather than the shared fixture
 * account, since deletion is one of the two things under test.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('superadmin: impersonate a customer admin', async ({ page, context }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const orgName    = `E2E Superadmin Impersonate Org ${Date.now()}`
  const adminEmail = `e2e-superadmin-impersonate-admin-${Date.now()}@example.org`
  const adminName  = 'E2E Test Org Admin'

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

  // Deliberately no MFA factor for this admin -- see the file doc comment
  // (issue #29): impersonating an admin who has already enrolled MFA cannot
  // complete today, so this spec covers the scenario that genuinely does
  // work, a freshly provisioned admin before their own first login.
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: `E2E-superadmin-target-pw-${Date.now()}!`,
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
    username: `e2e_superadmin_impersonate_${Date.now()}`,
    onboarding_complete: true,
  })
  expect(profileError).toBeNull()

  try {
    // ── Log in as the real superadmin (real MFA, same fixture as
    // support-tickets.spec.ts's own superadmin flow) ────────────────────────
    await login(page, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await page.waitForURL('**/superadmin/provision') // /superadmin itself redirects here

    await page.goto('/superadmin/organisations')

    // Scope every locator to this org's own card -- the page lists every
    // organisation in the project, and other specs running around this one
    // create their own. Scoped via the card's own class rather than a plain
    // 'div' text filter: the org name and admin email both live inside the
    // card's *left* column (a nested div), which independently matches a
    // text filter chain just as well as the outer card does -- and is
    // deeper in the DOM, so a naive `.last()` resolves to that inner column
    // instead of the real card, silently excluding the *right* column
    // (a sibling div) the actual buttons live in.
    const card = page.locator('.bg-card').filter({ hasText: orgName })
    await expect(card).toBeVisible()

    // ── Impersonation: opens a new tab, genuinely logged in as the org's
    // real admin (not just a tab that happens to open -- see the file doc
    // comment for what was actually broken here) ────────────────────────────
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      card.getByRole('button', { name: 'View as admin →' }).click(),
    ])
    // This admin has no MFA factor enrolled yet, so middleware sends this
    // genuinely-new session to mandatory setup, same as it would for the
    // admin's own real first login -- not straight to /dashboard.
    // completeMandatoryMfaSetup() lands on /dashboard/account, which (unlike
    // the standalone mandatory-setup page) renders inside the full dashboard
    // layout, letting the assertion below confirm this is genuinely the
    // target admin's own identity and not the superadmin's.
    await completeMandatoryMfaSetup(popup)
    await expect(popup.getByRole('button', { name: `User menu for ${adminName}` })).toBeVisible()
    await popup.close()

    // No delete-via-UI here, and no further use of `page` -- issue #30
    // means the popup's session exchange has just overwritten the
    // superadmin's own cookie in this browser context, so `page` is no
    // longer usable as an authenticated superadmin session. Deletion is
    // covered by its own test below with its own fresh login instead.
  } finally {
    await admin.auth.admin.deleteUser(targetUserId).catch(() => {})
    await admin.from('users').delete().eq('organisation_id', orgId)
    await admin.from('organisations').delete().eq('id', orgId)
  }
})

test('superadmin: permanently delete an organisation', async ({ page }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const orgName    = `E2E Superadmin Delete Org ${Date.now()}`
  const adminEmail = `e2e-superadmin-delete-admin-${Date.now()}@example.org`
  const adminName  = 'E2E Test Org Admin'

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
    password: `E2E-superadmin-target-pw-${Date.now()}!`,
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
    username: `e2e_superadmin_delete_${Date.now()}`,
    onboarding_complete: true,
  })
  expect(profileError).toBeNull()

  let orgStillExists = true

  try {
    // Fresh superadmin login for this test -- deliberately never shares a
    // browser context with the impersonation test above (Playwright gives
    // each test its own context by default), so this session's cookies are
    // never touched by anything but this test's own login.
    await login(page, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await page.waitForURL('**/superadmin/provision')

    await page.goto('/superadmin/organisations')

    const card = page.locator('.bg-card').filter({ hasText: orgName })
    await expect(card).toBeVisible()

    // ── Delete: real confirm-dialog flow, then the org is genuinely gone ────
    await card.getByRole('button', { name: 'Delete' }).click()
    const deleteHeading = page.getByRole('heading', { name: 'Delete organisation?' })
    await expect(deleteHeading).toBeVisible()
    // The org's card is still rendered behind the modal, so a plain page-wide
    // text lookup for its name matches twice (card + dialog) -- scope to the
    // dialog itself, which is the heading's own parent container.
    const dialog = deleteHeading.locator('xpath=..')
    await expect(dialog.getByText(orgName, { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Delete permanently' }).click()

    await expect(page.getByRole('heading', { name: 'Delete organisation?' })).not.toBeVisible()
    await expect(card).not.toBeVisible()

    // ── Genuinely gone, not just hidden from the list ───────────────────────
    const { data: orgAfter } = await admin.from('organisations').select('id').eq('id', orgId).maybeSingle()
    expect(orgAfter).toBeNull()

    const { data: userAfter } = await admin.from('users').select('id').eq('id', targetUserId).maybeSingle()
    expect(userAfter).toBeNull()

    const { data: authUserAfter } = await admin.auth.admin.getUserById(targetUserId)
    expect(authUserAfter.user).toBeNull()

    orgStillExists = false
  } finally {
    // Only reached if the test failed before deletion succeeded -- a
    // successful run has nothing left to clean up.
    if (orgStillExists) {
      await admin.auth.admin.deleteUser(targetUserId).catch(() => {})
      await admin.from('users').delete().eq('organisation_id', orgId)
      await admin.from('organisations').delete().eq('id', orgId)
    }
  }
})
