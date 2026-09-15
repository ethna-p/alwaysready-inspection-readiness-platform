/**
 * Admin creates a user account (real email invite) -> the invited user sets a
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

test('admin invites a team member by real email; they set up and log in', async ({ page, browser, baseURL }) => {
  test.setTimeout(90_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const inviteeEmail = `e2e-invited-user-${Date.now()}@example.org`
  const inviteeName = 'E2E Invited User'
  const inviteePassword = 'E2E-invited-user-pw-6q1z!'

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/dashboard/account?tab=team')

  await page.locator('#full_name').fill(inviteeName)
  await page.locator('#email').fill(inviteeEmail)
  // Role left at its default ("User") -- matches most real team invites.
  await page.getByRole('button', { name: 'Send invite' }).click()

  await expect(page.getByText('Invitation sent', { exact: true })).toBeVisible()
  await expect(page.getByText(`Invitation sent to ${inviteeEmail}.`, { exact: false })).toBeVisible()

  const { data: inviteeRow, error: inviteeRowErr } = await admin
    .from('users')
    .select('id, organisation_id, role, onboarding_complete, full_name')
    .eq('email', inviteeEmail)
    .single()
  expect(inviteeRowErr).toBeNull()
  expect(inviteeRow!.organisation_id).toBe(account.orgId)
  expect(inviteeRow!.role).toBe('user')
  expect(inviteeRow!.onboarding_complete).toBe(true)
  expect(inviteeRow!.full_name).toBe(inviteeName)

  // ── Stand-in for "the invited team member opens the real email and
  // clicks the link" -- see the file doc comment for why this, not the
  // real email's own link, is used here.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: inviteeEmail,
    options: { redirectTo: `${baseURL}/auth/callback?next=/account/setup` },
  })
  expect(linkErr).toBeNull()
  const actionLink = linkData?.properties?.action_link
  expect(actionLink).toBeTruthy()

  const inviteeContext = await browser.newContext()
  const inviteePage = await inviteeContext.newPage()

  await inviteePage.goto(actionLink!)
  await inviteePage.waitForURL('**/account/setup')
  await expect(inviteePage.getByRole('heading', { name: 'Welcome to AlwaysReady' })).toBeVisible()

  await inviteePage.locator('#password').fill(inviteePassword)
  await inviteePage.locator('#confirm').fill(inviteePassword)
  await inviteePage.getByRole('button', { name: 'Set password and continue' }).click()

  await expect(inviteePage.getByText('Password set')).toBeVisible()

  // ── Mandatory MFA enrolment (role 'user', no factor yet) ─────────────────
  const inviteeTotpSecret = await completeMandatoryMfaSetup(inviteePage)
  await inviteePage.goto('/dashboard')
  await expect(inviteePage.getByRole('button', { name: `User menu for ${inviteeName}` })).toBeVisible()

  // ── Sign out, then log back in as a genuinely separate session ──────────
  // The floating "Getting started" widget (GettingStartedWizard, rendered by
  // the dashboard layout for any account that hasn't finished onboarding)
  // overlaps the avatar button in its top-right corner -- collapse it first
  // (force-clicking the avatar underneath isn't reliable here: unlike the
  // Stripe checkout's own overlay elsewhere in this suite, this is a
  // genuinely unrelated widget, so a forced click at those coordinates can
  // land on IT instead of the button we actually want).
  await inviteePage.getByRole('button', { name: 'Collapse getting started guide' }).click()

  // This is a plain open/closed toggle (onClick={() => setOpen(v => !v)}) --
  // retrying the click itself on failure would just flip it shut again, so
  // click once and wait patiently rather than re-clicking.
  // The "Sign out" element is a <button>, but explicitly role="menuitem" in
  // the JSX (UserMenu.tsx) -- that overrides its implicit button role, so
  // getByRole('button', ...) never matches it.
  const userMenuButton = inviteePage.getByRole('button', { name: `User menu for ${inviteeName}` })
  const signOutButton = inviteePage.getByRole('menuitem', { name: 'Sign out' })
  await userMenuButton.click()
  await expect(signOutButton).toBeVisible({ timeout: 10_000 })
  await signOutButton.click()
  await inviteePage.waitForURL('**/login')

  await login(inviteePage, { email: inviteeEmail, password: inviteePassword, totpSecret: inviteeTotpSecret })
  await inviteePage.waitForURL(url => !url.pathname.includes('/login'))
  await expect(inviteePage.getByRole('button', { name: `User menu for ${inviteeName}` })).toBeVisible()

  await inviteeContext.close()
})
