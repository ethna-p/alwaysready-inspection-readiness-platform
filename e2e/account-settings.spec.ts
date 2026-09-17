/**
 * Account settings (app/dashboard/account/): self-service password change
 * (including a genuine, previously-undetected bug found while writing this
 * spec: changing your own password silently logged you out before you
 * could ever see the confirmation), confirmation that the deprecated
 * personal-contact feature is genuinely gone, and a direct regression
 * check for a real bug in changeTeamMemberRole() that took two attempts
 * to actually fix.
 *
 * The logout bug: changePassword() re-authenticates with the CURRENT
 * password (to verify it), then changes the password via the admin
 * client -- but that admin-client password change revokes the session
 * the re-authentication step just established a few lines earlier
 * (confirmed directly: a diagnostic run logging every response and the
 * browser's cookie jar showed a real request/response cycle ending with
 * zero cookies left and a silent redirect to /login, immediately after
 * the "successful" POST). ChangePasswordForm.tsx has no idea any of this
 * happened -- it just sets local React state expecting to keep showing
 * "Password changed successfully." on the same page, so a real user would
 * see themselves abruptly logged out with no explanation, even though the
 * password change itself had actually worked. Fixed by re-authenticating
 * again with the NEW password immediately after the admin-client update,
 * re-establishing a genuinely valid session before returning success.
 * Asserted below by confirming the user stays on the security tab (no
 * redirect) after submitting, not just that a success message briefly
 * appears somewhere.
 *
 * The bug: the only UPDATE policy on public.users was "Users can update
 * their own profile" (id = auth.uid()) -- correctly added by
 * 20260901000002_protect_auth_columns.sql ("H2") to stop a user
 * self-escalating their own role, but its USING clause also silently
 * blocked the one thing an admin is supposed to do: change ANOTHER team
 * member's role from the Team page. Confirmed directly against the
 * database (a real admin session update, checked before and after, not
 * just read from the code) that this always updated zero rows while the
 * UI still showed "Role updated." First fix attempt
 * (20260915100601_allow_admin_change_team_member_role.sql) added a new
 * policy but wrote its conditions as raw inline subqueries against
 * public.users -- a known Postgres RLS footgun when a policy
 * self-references the table it protects -- and still silently no-op'd,
 * confirmed the same way. The actual fix
 * (20260915102623_fix_admin_role_change_policy_self_reference.sql) uses
 * this codebase's established get_user_role()/get_user_org_id()
 * SECURITY DEFINER helpers instead, matching every other working policy
 * in this app. Those helpers also enforce AAL2 (H2's MFA requirement),
 * so this spec completes a genuine MFA challenge for the admin session
 * before attempting the role change -- an AAL1 session would correctly
 * still be blocked.
 *
 * Also fixed alongside: PersonalContactForm.tsx, updatePersonalContact(),
 * and the personal_email notification-routing fallbacks in
 * changePassword/KLOE-assignment/support-ticket actions were removed
 * entirely (the "Notifications" tab they powered was already commented
 * out, pending features that were never built, and AJ confirmed the
 * underlying "staff with no real work email" scenario they existed for
 * was removed from onboarding a long time ago). The personal_email and
 * mobile_number columns themselves were dropped from public.users.
 *
 * Uses the teammate account (not the primary seeded admin) for the
 * self-service password-change portion -- changing the primary admin's
 * own login password here would break every other spec in this suite
 * that logs in with the original seeded password. The teammate account
 * is already this suite's established "safe to mutate" shared fixture:
 * password reset before use, MFA factor cleaned up after (same reasoning
 * as incidents.spec.ts, governance.spec.ts, feedback.spec.ts).
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('Account: self-service password change, Notifications tab is gone, and admin role-change actually works', async ({ page, browser }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const { error: pwResetErr } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwResetErr).toBeNull()

  // ── Teammate: self-service password change ──────────────────────────────
  const teammateContext = await browser.newContext()
  const teammatePage = await teammateContext.newPage()
  await login(teammatePage, { email: account.teammate.email, password: account.teammate.password })
  const totpSecret = await completeMandatoryMfaSetup(teammatePage)

  await teammatePage.goto('/dashboard/account?tab=security')

  const newPassword = 'E2E-account-spec-new-pw-4f8k!'
  await teammatePage.locator('#current-password').fill(account.teammate.password)
  await teammatePage.locator('#new-password').fill(newPassword)
  await teammatePage.locator('#confirm-password').fill(newPassword)
  await teammatePage.getByRole('button', { name: 'Change password' }).click()
  await expect(teammatePage.getByText('Password changed successfully.')).toBeVisible()

  // The actual bug this spec was written to catch: submitting used to
  // silently invalidate the session and redirect to /login right after,
  // before the message above could ever really be seen as more than a
  // flash. Confirm the user is still genuinely on this same page, still
  // signed in -- not just that the message briefly rendered.
  await expect(teammatePage).toHaveURL(/\/dashboard\/account/)
  const cookiesAfterChange = await teammateContext.cookies()
  expect(cookiesAfterChange.some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))).toBe(true)

  // Not just a client-side success message -- a genuinely fresh login
  // (new cookies, real MFA again) with the new password actually works.
  await teammatePage.context().clearCookies()
  await login(teammatePage, { email: account.teammate.email, password: newPassword, totpSecret })
  await teammatePage.waitForURL('**/dashboard')
  // waitForURL (and even waitForLoadState('load')) resolve before the
  // dashboard's own client-side work is fully settled -- an immediate
  // further .goto() intermittently races an in-flight navigation
  // (net::ERR_ABORTED). Wait for real, known dashboard content instead of
  // a generic load-state signal.
  await expect(teammatePage.getByRole('link', { name: 'Dashboard' })).toBeVisible()

  // ── The OLD Notifications tab (PersonalContactForm) is gone ─────────────
  // A tab of the same name now legitimately exists for a different purpose
  // (Issue #31: opt-in system notification preferences, in
  // NotificationsSection.tsx, available to every role) -- so this only
  // checks that the specific old content is gone, not that a "Notifications"
  // link is absent altogether.
  await teammatePage.goto('/dashboard/account?tab=notifications')
  await expect(teammatePage.getByText('Notification contact details')).not.toBeVisible()

  await teammateContext.close()

  // Reset the teammate's password back to the fixture's known value --
  // other specs that use this shared account assume it.
  const { error: pwResetErr2 } = await admin.auth.admin.updateUserById(
    account.teammate.userId,
    { password: account.teammate.password },
  )
  expect(pwResetErr2).toBeNull()

  // ── Admin: change the teammate's role -- the fix under test ─────────────
  await login(page, account)
  await page.waitForURL('**/dashboard')
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()

  // login() completes MFA for this seeded admin the same way every other
  // spec's login does (a real TOTP factor already enrolled by
  // test:e2e:seed) -- the session is genuinely AAL2 by the time it's on
  // /dashboard, which the fix under test depends on.
  await page.goto('/dashboard/account?tab=team')

  const teammateRow = page.locator('tr', { hasText: account.teammate.email })
  await expect(teammateRow).toBeVisible()
  await teammateRow.locator('select[name="role"]').selectOption('admin')
  await teammateRow.getByRole('button', { name: 'Save' }).click()
  await expect(teammateRow.getByText('Role updated.')).toBeVisible()

  // Not just the UI's own message -- the row genuinely changed in the
  // database. This is exactly the assertion that would have caught both
  // previous silent no-ops.
  const { data: afterRoleChange } = await admin.from('users').select('role').eq('id', account.teammate.userId).single()
  expect(afterRoleChange!.role).toBe('admin')

  // A reload confirms it's real server state, not optimistic local state.
  await page.reload()
  const teammateRowAfterReload = page.locator('tr', { hasText: account.teammate.email })
  await expect(teammateRowAfterReload.locator('select[name="role"]')).toHaveValue('admin')

  // Change it back -- leave the fixture as seed.ts created it.
  await teammateRowAfterReload.locator('select[name="role"]').selectOption('user')
  await teammateRowAfterReload.getByRole('button', { name: 'Save' }).click()
  await expect(teammateRowAfterReload.getByText('Role updated.')).toBeVisible()
  const { data: afterRevert } = await admin.from('users').select('role').eq('id', account.teammate.userId).single()
  expect(afterRevert!.role).toBe('user')

  // completeMandatoryMfaSetup() above enrolled a real MFA factor for the
  // shared teammate account -- specs later in the same suite run assume
  // it still has none on ITS first login. Remove it, same reasoning and
  // technique as incidents.spec.ts, governance.spec.ts, feedback.spec.ts.
  const { data: factorsData } = await admin.auth.admin.mfa.listFactors({ userId: account.teammate.userId })
  for (const factor of factorsData?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: account.teammate.userId })
  }
})
