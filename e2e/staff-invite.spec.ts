/**
 * Admin creates a staff account (real email invite) -> staff sets a
 * password, completes mandatory MFA enrolment, and logs in.
 *
 * This is item 10 of the platform walkthrough -- paused for most of this
 * session on an exhausted Supabase auth email rate limit, then blocked
 * again by a series of genuine custom-SMTP misconfigurations (wrong
 * username, then a sender domain typo: no-reply@alwaysready.co.uk instead
 * of the actually-verified no-reply@alwaysready.uk) before finally working.
 * With real email sending now genuinely functional, this drives the
 * complete real flow rather than a stand-in for it:
 *
 *   - admin invites a teammate via the real UI, which calls the real
 *     inviteTeamMember server action -> real inviteUserByEmail() ->
 *     genuinely sends a real email via Resend (SMTP). Success here is
 *     itself proof the whole real send pipeline the rest of this session
 *     fought to unblock actually works, not just that a DB row got written.
 *   - the invited user's own "click the email" step is stood in for via
 *     admin.generateLink({type:'magiclink'}) -- same reasoning as
 *     self-service-password-reset.spec.ts: there's no real inbox to check
 *     in CI, and an admin-API-minted link is genuinely the same kind of
 *     link (implicit/fragment-based, handled by /auth/callback/complete)
 *     that inviteUserByEmail's own real email would have carried, per that
 *     page's own doc comment. inviteUserByEmail's own link isn't reused
 *     directly only because there's no inbox here to read it from.
 *   - the invited user sets a password on /account/setup (real page, real
 *     updateUser() call), completes mandatory TOTP enrolment (a 'user'
 *     role account with no factor enrolled -- exactly what middleware
 *     forces), and lands on a working dashboard
 *   - signs out and back in with the password and MFA code they just set,
 *     confirming this isn't just a one-time setup-session artifact
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login, completeMandatoryMfaSetup } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'

test('admin invites a staff member by real email; they set up and log in', async ({ page, browser, baseURL }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const staffEmail = `e2e-invited-staff-${Date.now()}@example.org`
  const staffName = 'E2E Invited Staff'
  const staffPassword = 'E2E-invited-staff-pw-6q1z!'

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/account?tab=team')

  await page.locator('#full_name').fill(staffName)
  await page.locator('#email').fill(staffEmail)
  // Role left at its default ("User") -- matches most real staff invites.
  await page.getByRole('button', { name: 'Send invite' }).click()

  await expect(page.getByText('Invitation sent', { exact: true })).toBeVisible()
  await expect(page.getByText(`Invitation sent to ${staffEmail}.`, { exact: false })).toBeVisible()

  const { data: staffRow, error: staffRowErr } = await admin
    .from('users')
    .select('id, organisation_id, role, onboarding_complete, full_name')
    .eq('email', staffEmail)
    .single()
  expect(staffRowErr).toBeNull()
  expect(staffRow!.organisation_id).toBe(account.orgId)
  expect(staffRow!.role).toBe('user')
  expect(staffRow!.onboarding_complete).toBe(true)
  expect(staffRow!.full_name).toBe(staffName)

  // ── Stand-in for "the invited staff member opens the real email and
  // clicks the link" -- see the file doc comment for why this, not the
  // real email's own link, is used here.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: staffEmail,
    options: { redirectTo: `${baseURL}/auth/callback?next=/account/setup` },
  })
  expect(linkErr).toBeNull()
  const actionLink = linkData?.properties?.action_link
  expect(actionLink).toBeTruthy()

  const staffContext = await browser.newContext()
  const staffPage = await staffContext.newPage()

  await staffPage.goto(actionLink!)
  await staffPage.waitForURL('**/account/setup')
  await expect(staffPage.getByRole('heading', { name: 'Welcome to AlwaysReady' })).toBeVisible()

  await staffPage.locator('#password').fill(staffPassword)
  await staffPage.locator('#confirm').fill(staffPassword)
  await staffPage.getByRole('button', { name: 'Set password and continue' }).click()

  await expect(staffPage.getByText('Password set')).toBeVisible()

  // ── Mandatory MFA enrolment (role 'user', no factor yet) ─────────────────
  const staffTotpSecret = await completeMandatoryMfaSetup(staffPage)
  await staffPage.goto('/dashboard')
  await expect(staffPage.getByRole('button', { name: `User menu for ${staffName}` })).toBeVisible()

  // ── Sign out, then log back in as a genuinely separate session ──────────
  // The floating "Getting started" widget (GettingStartedWizard, rendered by
  // the dashboard layout for any account that hasn't finished onboarding)
  // overlaps the avatar button in its top-right corner -- collapse it first
  // (force-clicking the avatar underneath isn't reliable here: unlike the
  // Stripe checkout's own overlay elsewhere in this suite, this is a
  // genuinely unrelated widget, so a forced click at those coordinates can
  // land on IT instead of the button we actually want).
  await staffPage.getByRole('button', { name: 'Collapse getting started guide' }).click()

  // This is a plain open/closed toggle (onClick={() => setOpen(v => !v)}) --
  // retrying the click itself on failure would just flip it shut again, so
  // click once and wait patiently rather than re-clicking.
  // The "Sign out" element is a <button>, but explicitly role="menuitem" in
  // the JSX (UserMenu.tsx) -- that overrides its implicit button role, so
  // getByRole('button', ...) never matches it.
  const userMenuButton = staffPage.getByRole('button', { name: `User menu for ${staffName}` })
  const signOutButton = staffPage.getByRole('menuitem', { name: 'Sign out' })
  await userMenuButton.click()
  await expect(signOutButton).toBeVisible({ timeout: 10_000 })
  await signOutButton.click()
  await staffPage.waitForURL('**/login')

  await login(staffPage, { email: staffEmail, password: staffPassword, totpSecret: staffTotpSecret })
  await staffPage.waitForURL(url => !url.pathname.includes('/login'))
  await expect(staffPage.getByRole('button', { name: `User menu for ${staffName}` })).toBeVisible()

  await staffContext.close()
})
