'use server'

/**
 * Server actions for team management.
 * All actions are admin-only — enforced here and at the RLS layer.
 *
 * Staff accounts use a generated email:
 *   {firstname}.{lastname}.{6-char-org-prefix}@staff.alwaysready.uk
 *
 * The username handed to staff is the portion before @staff.alwaysready.uk.
 * The login page appends @staff.alwaysready.uk if no @ is present.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserProfile } from '@/lib/session'

export type TeamActionState =
  | { success: true; message: string; credentials?: { username: string; password: string } }
  | { success: false; error: string }
  | null

// ── Helpers ────────────────────────────────────────────────────────────────

/** Sanitise a name segment for use in a username (lowercase, letters/digits only, dots for spaces) */
function sanitiseName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '')
}

/** Generate a cryptographically random temporary password */
function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, b => chars[b % chars.length]).join('')
}

/** Build staff email from username */
function staffEmail(username: string): string {
  return `${username}@staff.alwaysready.uk`
}


// ── Create team member ──────────────────────────────────────────────────────

export async function createTeamMember(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Only admins can add team members.' }
  }

  const fullName = (formData.get('full_name') as string).trim()
  const role     = formData.get('role') as 'admin' | 'user'

  if (!fullName) return { success: false, error: 'Name is required.' }
  if (!['admin', 'user'].includes(role)) return { success: false, error: 'Invalid role.' }

  // ── Generate username ────────────────────────────────────────────────────
  const orgPrefix = profile.organisation_id.replace(/-/g, '').slice(0, 6)
  const namePart  = sanitiseName(fullName)
  let username    = `${namePart}.${orgPrefix}`

  // Deduplicate — if already taken, append a counter
  const { data: existing } = await supabase
    .from('users')
    .select('username')
    .eq('organisation_id', profile.organisation_id)
    .ilike('username', `${namePart}.${orgPrefix}%`)

  if (existing && existing.length > 0) {
    username = `${namePart}.${orgPrefix}.${existing.length + 1}`
  }

  const email    = staffEmail(username)
  const password = generatePassword()

  // ── Create Supabase auth user ────────────────────────────────────────────
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // skip email verification — RCM sets up the account
  })

  if (authError || !authData.user) {
    console.error('createUser error:', authError)
    if (authError?.message?.includes('already been registered')) {
      return { success: false, error: 'A user with this name already exists. Try a slightly different name.' }
    }
    return { success: false, error: 'Failed to create account. Please try again.' }
  }

  // ── Insert into public.users ─────────────────────────────────────────────
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id:              authData.user.id,
      organisation_id: profile.organisation_id,
      email,
      full_name:       fullName,
      username,
      role,
    })

  if (insertError) {
    // Roll back the auth user to avoid orphaned accounts
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    console.error('users insert error:', insertError)
    return { success: false, error: 'Failed to save team member. Please try again.' }
  }

  revalidatePath('/dashboard/admin/team')

  return {
    success: true,
    message: `${fullName} has been added to your team.`,
    credentials: { username, password },
  }
}


// ── Reset password ──────────────────────────────────────────────────────────

export async function resetTeamMemberPassword(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const adminSupabase = createAdminClient()

  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Only admins can reset passwords.' }
  }

  const userId   = formData.get('user_id') as string
  const fullName = formData.get('full_name') as string

  if (!userId) return { success: false, error: 'Missing user ID.' }

  const password = generatePassword()

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, { password })

  if (error) {
    console.error('resetPassword error:', error)
    return { success: false, error: 'Failed to reset password. Please try again.' }
  }

  return {
    success: true,
    message: `Password reset for ${fullName}.`,
    credentials: { username: '', password },
  }
}


// ── Change role ─────────────────────────────────────────────────────────────

export async function changeTeamMemberRole(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const supabase = await createClient()

  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Only admins can change roles.' }
  }

  const userId = formData.get('user_id') as string
  const role   = formData.get('role') as 'admin' | 'user' | 'viewer'

  if (!userId) return { success: false, error: 'Missing user ID.' }
  if (!['admin', 'user', 'viewer'].includes(role)) return { success: false, error: 'Invalid role.' }

  // Prevent admin from demoting themselves
  if (userId === profile.id) {
    return { success: false, error: 'You cannot change your own role.' }
  }

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .eq('organisation_id', profile.organisation_id)

  if (error) {
    console.error('changeRole error:', error)
    return { success: false, error: 'Failed to update role. Please try again.' }
  }

  revalidatePath('/dashboard/admin/team')
  return { success: true, message: 'Role updated.' }
}
