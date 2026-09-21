/**
 * Superadmin organisations: permanently delete an organisation.
 *
 * The single most consequential action in the entire admin panel --
 * "permanently delete an organisation and everything in it" -- and it had
 * never been exercised by a real test before this spec. Two real,
 * significant issues were found and fixed while building it:
 *
 *   1. lib/assert-superadmin.ts checked identity (email match) but never
 *      AAL2 -- unlike every other sensitive action in this app, which gets
 *      AAL2 enforcement via isAAL2Satisfied(). A superadmin session that
 *      was authenticated but hadn't completed MFA this session could still
 *      have called this action directly. Fixed alongside this spec; see
 *      that file's own doc comment. The negative case (an aal1 superadmin
 *      session) isn't tested here: the seeded superadmin fixture only ever
 *      has a fully-verified aal2 session (real MFA, same as every other
 *      spec), and middleware already blocks an aal1 session from ever
 *      reaching a superadmin page in the first place -- so there's no way
 *      to click a button that would exercise assertSuperadmin() pre-MFA
 *      through the real UI. The fix itself is a straight mirror of an
 *      already-relied-on helper.
 *
 *   2. deleteOrganisation's own body wasn't wrapped in try/catch, so a step
 *      that threw instead of returning {error} (supabase.auth.admin.deleteUser()
 *      is a real Promise, unlike the Postgrest builder calls around it)
 *      would crash the whole server action -- and an uncaught throw from a
 *      server action crashes the client's RSC tree with a generic "An
 *      unexpected response was received from the server" error, taking the
 *      org's card down with it even though the org was never actually
 *      deleted. See that function's own comment in actions.ts.
 *
 * This spec used to also cover "View as admin" (impersonation), including
 * two further real bugs found along the way (a broken redirect, and the
 * impersonated session silently overwriting the superadmin's own session
 * cookie -- see the git history around this file, and issues #29/#30 for
 * the full detail). The feature itself was removed deliberately, not
 * because those bugs weren't fixable: every real bug found in this app has
 * been a pure code bug, reproducible on any seeded test org, and AJ
 * concluded the platform doesn't need an unaudited "log in as the
 * customer" capability to support them -- see actions.ts's own doc comment
 * and PROJECT_BRIEF.md's Customer Support Protocol. #29 and #30 are closed
 * as moot now that the feature they described no longer exists.
 *
 * Uses its own disposable organisation + admin user (created directly, not
 * through the real /trial signup flow -- this spec is about the superadmin
 * action, not signup) rather than the shared fixture account, since
 * deletion is the thing under test.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist (for
 * the superadmin account).
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { tidy } from './support/db'

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
      tidy(await admin.from('users').delete().eq('organisation_id', orgId), 'superadmin-organisations: delete users')
      tidy(await admin.from('organisations').delete().eq('id', orgId), 'superadmin-organisations: delete organisations')
    }
  }
})
