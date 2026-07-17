'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export type ChangePasswordResult =
  | { success: true }
  | { success: false; error: string }

export type UpdateContactResult =
  | { success: true }
  | { success: false; error: string }

export async function updatePersonalContact(
  _prev: UpdateContactResult | null,
  formData: FormData
): Promise<UpdateContactResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated.' }

  const personalEmail = (formData.get('personal_email') as string | null)?.trim() || null
  const mobileNumber  = (formData.get('mobile_number') as string | null)?.trim() || null

  const { error } = await supabase
    .from('users')
    .update({ personal_email: personalEmail, mobile_number: mobileNumber })
    .eq('id', user.id)

  if (error) {
    console.error('[updatePersonalContact]', error)
    return { success: false, error: 'Failed to save. Please try again.' }
  }

  revalidatePath('/dashboard/account')
  return { success: true }
}

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

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    return { success: false, error: 'Current password is incorrect.' }
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    return { success: false, error: 'Unable to update password. Please try again.' }
  }

  // Send notification email (non-fatal — don't fail the password change if email fails)
  if (process.env.RESEND_API_KEY) {
    try {
      // Determine who to notify:
      // 1. personal_email if set (works for staff who have no real work inbox)
      // 2. work email if it's a real address (not a generated @staff.alwaysready.uk one)
      // 3. Otherwise skip
      const { data: userRow } = await (await createClient())
        .from('users')
        .select('personal_email')
        .eq('id', user.id)
        .single()

      const isStaffEmail = user.email?.endsWith('@staff.alwaysready.uk')
      const notifyEmail  = userRow?.personal_email || (!isStaffEmail ? user.email : null)

      if (!notifyEmail) return { success: true }

      const resend = new Resend(process.env.RESEND_API_KEY)
      const now = new Date().toLocaleString('en-GB', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Europe/London',
      })

      await resend.emails.send({
        from: 'AlwaysReady <onboarding@resend.dev>',
        to: notifyEmail,
        subject: 'Your AlwaysReady password has been changed',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
            <div style="background:#014D4E;padding:24px 32px">
              <span style="color:#fff;font-size:20px;font-weight:bold">AlwaysReady</span>
            </div>
            <div style="padding:32px">
              <p style="font-size:16px;margin:0 0 16px">Your password was successfully changed on <strong>${now}</strong>.</p>
              <p style="font-size:14px;color:#555;margin:0">If you made this change, there is nothing further for you to do. If it wasn't you, change your password immediately or contact your local admin manager.</p>
            </div>
            <div style="border-top:1px solid #eee;padding:16px 32px">
              <p style="font-size:12px;color:#999;margin:0">AlwaysReady Inspection Readiness Platform</p>
            </div>
          </div>
        `,
      })
    } catch (emailError) {
      // Log but don't surface to the user — password was changed successfully
      console.error('[changePassword] email notification failed:', emailError)
    }
  }

  return { success: true }
}
