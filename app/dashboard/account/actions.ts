'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { renderTemplate } from '@/lib/email-templates'
import { createRateLimiter } from '@/lib/rate-limit'

// changePassword re-authenticates with a client-supplied "current password":
// unlike /login (rate-limited per IP in middleware.ts), this had no limit at
// all. It requires an already-valid session (not an unauthenticated attack
// surface), but a stolen/shared session cookie without the actual password
// could otherwise be used to brute-force it. Keyed by user id rather than IP
// since the caller is already authenticated.
const changePasswordLimiter = createRateLimiter({ name: 'change-password', windowMs: 15 * 60_000, max: 5 })

// ── Sub-services ──────────────────────────────────────────────────────────────

export async function toggleSubService(
  subService: string,
  enable: boolean
): Promise<void> {
  const profile = await requireAdmin()
  if (!profile) return

  const supabase = await createClient()

  if (enable) {
    const { error } = await supabase
      .from('organisation_sub_services')
      .insert({ organisation_id: profile.organisation_id, sub_service: subService })
      .select()
    // Neither branch's error was checked before -- a failed write (a
    // transient Supabase error, a dropped connection) proceeded straight to
    // revalidatePath() as if it had succeeded, silently leaving the org's
    // real state out of sync with whatever the UI ends up showing next.
    if (error) throw new Error(`Failed to enable sub-service "${subService}": ${error.message}`)
  } else {
    const { error } = await supabase
      .from('organisation_sub_services')
      .delete()
      .eq('organisation_id', profile.organisation_id)
      .eq('sub_service', subService)
    if (error) throw new Error(`Failed to disable sub-service "${subService}": ${error.message}`)
  }

  revalidatePath('/dashboard/account')
  revalidatePath('/dashboard/kloes')
}

export type ChangePasswordResult =
  | { success: true }
  | { success: false; error: string }

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ChangePasswordResult> {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: 'All fields are required.' }
  }

  if (newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters.' }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'New passwords do not match.' }
  }

  if (currentPassword === newPassword) {
    return { success: false, error: 'New password must be different from your current password.' }
  }

  const supabase = await createClient()

  // Get the current user's email to re-authenticate
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.email) {
    return { success: false, error: 'Unable to verify your session. Please sign in again.' }
  }

  if (!(await changePasswordLimiter.check(user.id))) {
    return { success: false, error: 'Too many attempts. Please wait 15 minutes and try again.' }
  }

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    return { success: false, error: 'Current password is incorrect.' }
  }

  // Update to new password via admin client: avoids session cookie timing
  // issues that can cause supabase.auth.updateUser to fail after a
  // signInWithPassword re-authentication in a server action context.
  const adminSupabase = createAdminClient()
  const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  )

  if (updateError) {
    console.error('[changePassword] updateUserById error:', updateError.message)
    return { success: false, error: 'Unable to update password. Please try again.' }
  }

  // Changing the password via the admin client invalidates the session
  // that was just re-authenticated a few lines up (Supabase revokes
  // outstanding sessions on a password change) -- without this, the next
  // request finds no valid session, middleware clears the cookies, and the
  // user is redirected straight to /login before ever seeing the success
  // message below, even though the password change itself worked.
  // Re-authenticating with the NEW password re-establishes a genuinely
  // valid session (and writes fresh cookies via this same server client,
  // see lib/supabase/server.ts) so the user stays seamlessly signed in.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: newPassword,
  })
  if (reauthError) {
    // The password itself was changed successfully -- only the follow-up
    // session refresh failed. Don't report this as a failed password
    // change; the user will simply need to sign in again with their new
    // password, which they now know.
    console.error('[changePassword] post-change re-authentication failed:', reauthError.message)
  }

  // Send notification email (non-fatal, don't fail the password change if email fails).
  // Every team member has a real work email (email-based invite is the only
  // onboarding path, see team-actions.ts's own doc comment), so it's always
  // the right address to notify.
  try {
    const now = new Date().toLocaleString('en-GB', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Europe/London',
    })

    const defaultPasswordChangedHtml = `
        <p>Your AlwaysReady password was successfully changed on <strong>${now}</strong>.</p>
        <p style="color:#555;font-size:14px">If you made this change, there is nothing further for you to do. If it wasn't you, change your password immediately or contact your local admin manager.</p>
      `

    await sendEmail({
      to: user.email,
      subject: 'Your AlwaysReady password has been changed',
      bodyHtml: await renderTemplate('password_changed', { when: now }, defaultPasswordChangedHtml),
      type: 'transactional',
    })
  } catch (emailError) {
    // Log but don't surface to the user: password was changed successfully
    console.error('[changePassword] email notification failed:', emailError)
  }

  return { success: true }
}
