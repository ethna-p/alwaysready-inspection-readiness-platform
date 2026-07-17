'use server'

import { createClient } from '@/lib/supabase/server'

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

  return { success: true }
}
