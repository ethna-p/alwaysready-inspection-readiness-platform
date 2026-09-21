'use server'

/**
 * Server actions for team management.
 * All actions are admin-only — enforced here and at the RLS layer.
 *
 * All team members and visitors use real email addresses.
 * Email-based invite is the only onboarding path.
 */

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserProfile } from '@/lib/session'

export type TeamActionState =
  | { success: true; message: string }
  | { success: false; error: string }
  | null


// ── Invite team member (email-based onboarding) ────────────────────────────

export async function inviteTeamMember(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const adminSupabase = createAdminClient()

  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Only admins can invite team members.' }
  }

  const fullName = (formData.get('full_name') as string ?? '').trim()
  const email    = (formData.get('email') as string ?? '').trim().toLowerCase()
  const role     = formData.get('role') as 'admin' | 'user'

  if (!fullName) return { success: false, error: 'Full name is required.' }
  if (!email)    return { success: false, error: 'Email address is required.' }
  if (!['admin', 'user'].includes(role)) return { success: false, error: 'Invalid role.' }

  // Build an absolute redirect URL using the incoming request host —
  // works on both localhost and the Vercel production domain with no extra env vars.
  const headersList = await headers()
  const host        = headersList.get('host') ?? 'localhost:3000'
  const proto       = host.startsWith('localhost') ? 'http' : 'https'
  const redirectTo  = `${proto}://${host}/auth/callback?next=/account/setup`

  // Send the Supabase invite email
  const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
    email,
    {
      data: { organisation_id: profile.organisation_id, role, full_name: fullName },
      redirectTo,
    }
  )

  if (inviteError || !inviteData?.user) {
    console.error('[inviteTeamMember] inviteUserByEmail error:', inviteError)
    if (inviteError?.message?.toLowerCase().includes('already been registered')) {
      return { success: false, error: 'This email address already has an account.' }
    }
    return { success: false, error: 'Failed to send invite. Please try again.' }
  }

  // Insert public.users row immediately so they appear in the team list.
  // Use adminSupabase — RLS has no INSERT policy for authenticated users.
  // onboarding_complete = true: invited users join an already-configured org
  // and should skip the first-time welcome screen.
  const { error: insertError } = await adminSupabase
    .from('users')
    .insert({
      id:                  inviteData.user.id,
      organisation_id:     profile.organisation_id,
      email,
      full_name:           fullName,
      role,
      onboarding_complete: true,
    })

  if (insertError) {
    // Roll back auth user so we don't leave an orphan
    await adminSupabase.auth.admin.deleteUser(inviteData.user.id)
    console.error('[inviteTeamMember] users insert error:', insertError)
    return { success: false, error: 'Failed to save invitation. Please try again.' }
  }

  revalidatePath('/dashboard/account')
  return {
    success: true,
    message: `Invitation sent to ${email}. ${fullName} will receive an email with a link to set up their account.`,
  }
}


// ── Reset MFA ────────────────────────────────────────────────────────────────
//
// Recovery path for a teammate who's lost their authenticator device.
// Before this action existed, the ONLY way to remove a factor was
// self-service (MfaSection.tsx's "Remove", which requires already being
// logged in with a working factor) -- circular for someone actually locked
// out, and admins had no way to help a teammate in that position at all.
// Same shape and org-scoping check as the other team actions.
// Doesn't cover a SOLE admin locking themselves out (no one else to do this
// for them) -- that still needs direct Supabase intervention.

export async function resetTeamMemberMfa(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const adminSupabase = createAdminClient()

  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Only admins can reset MFA.' }
  }

  const userId   = formData.get('user_id') as string
  const fullName = formData.get('full_name') as string

  if (!userId) return { success: false, error: 'Missing user ID.' }

  // Use the self-service "Remove" in Account -> Security instead, which
  // works fine for a still-logged-in admin — this action exists for
  // resetting a TEAMMATE who's actually locked out.
  if (userId === profile.id) {
    return { success: false, error: "You can't reset your own MFA here — use Remove in your own Account settings instead." }
  }

  // Tenant-isolation check — without this an
  // admin could supply any user_id and strip MFA from a user in a different
  // organisation via the admin auth client.
  const { data: targetUser } = await adminSupabase
    .from('users')
    .select('organisation_id')
    .eq('id', userId)
    .single()

  if (!targetUser || targetUser.organisation_id !== profile.organisation_id) {
    return { success: false, error: 'User not found in your organisation.' }
  }

  const { data: factorsData, error: listError } = await adminSupabase.auth.admin.mfa.listFactors({ userId })
  if (listError) {
    console.error('resetTeamMemberMfa: listFactors error:', listError)
    return { success: false, error: 'Failed to reset MFA. Please try again.' }
  }

  const factors = factorsData?.factors ?? []
  if (factors.length === 0) {
    return { success: true, message: `${fullName} has no MFA factor enrolled — nothing to reset.` }
  }

  for (const factor of factors) {
    const { error } = await adminSupabase.auth.admin.mfa.deleteFactor({ id: factor.id, userId })
    if (error) {
      console.error('resetTeamMemberMfa: deleteFactor error:', error)
      return { success: false, error: 'Failed to reset MFA. Please try again.' }
    }
  }

  revalidatePath('/dashboard/account')

  return {
    success: true,
    message: `MFA reset for ${fullName}. They'll be prompted to set up two-factor authentication again on their next login.`,
  }
}


// ── Create visitor login ────────────────────────────────────────────────────

export async function createVisitorLogin(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const adminSupabase = createAdminClient()

  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Only admins can create visitor logins.' }
  }

  const fullName = (formData.get('full_name') as string).trim()
  const email    = (formData.get('email') as string ?? '').trim().toLowerCase()
  const daysRaw  = parseInt(formData.get('duration_days') as string, 10)

  if (!fullName) return { success: false, error: 'Name is required.' }
  if (!email)    return { success: false, error: 'Email address is required.' }
  if (isNaN(daysRaw) || daysRaw < 1 || daysRaw > 365) {
    return { success: false, error: 'Duration must be between 1 and 365 days.' }
  }

  const expiresAt = new Date()
  expiresAt.setUTCDate(expiresAt.getUTCDate() + daysRaw)

  // ── Invite the visitor by email ──────────────────────────────────────────
  // Same route as a team invite: Supabase emails the visitor a link, and they set their OWN password
  // on /account/setup. The admin never sees or relays a credential. (This used to create the account
  // with a generated password and show it to the admin to pass on.)
  const headersList = await headers()
  const host        = headersList.get('host') ?? 'localhost:3000'
  const proto       = host.startsWith('localhost') ? 'http' : 'https'
  const redirectTo  = `${proto}://${host}/auth/callback?next=/account/setup`

  const { data: authData, error: authError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    data: { organisation_id: profile.organisation_id, role: 'viewer', full_name: fullName },
    redirectTo,
  })

  if (authError || !authData?.user) {
    console.error('createVisitorLogin invite error:', authError)
    if (authError?.message?.toLowerCase().includes('already been registered')) {
      return { success: false, error: 'An account with this email already exists.' }
    }
    return { success: false, error: 'Failed to send the invitation. Please try again.' }
  }

  // ── Insert into public.users ─────────────────────────────────────────────
  // onboarding_complete: true — a visitor joins an already-configured org for
  // a fixed window and should never see the first-time welcome/consent screen
  // (same reasoning as inviteTeamMember below). Without this, middleware
  // redirects every /dashboard/* visit to /dashboard/welcome forever, since
  // nothing in the visitor's flow can ever mark onboarding complete.
  const { error: insertError } = await adminSupabase
    .from('users')
    .insert({
      id:                  authData.user.id,
      organisation_id:     profile.organisation_id,
      email,
      full_name:           fullName,
      role:                'viewer',
      viewer_expires_at:   expiresAt.toISOString(),
      onboarding_complete: true,
    })

  if (insertError) {
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    console.error('createVisitorLogin insert error:', insertError)
    return { success: false, error: 'Failed to save visitor login. Please try again.' }
  }

  revalidatePath('/dashboard/account')

  return {
    success: true,
    message: `Invitation sent to ${email}. ${fullName} will receive an email with a link to set their own password. `
      + `Their access expires ${daysRaw} day${daysRaw === 1 ? '' : 's'} from now, whether or not they have signed in yet. `
      + `If the link expires before they use it, they can choose "Forgot your password?" on the login page.`,
  }
}


// ── Revoke visitor login ────────────────────────────────────────────────────

export async function revokeVisitorLogin(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Only admins can revoke visitor logins.' }
  }

  const userId   = formData.get('user_id') as string
  const fullName = (formData.get('full_name') as string) ?? 'visitor'

  if (!userId) return { success: false, error: 'Missing user ID.' }

  // Verify the target is a viewer in this org (safety check)
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, role, organisation_id')
    .eq('id', userId)
    .eq('organisation_id', profile.organisation_id)
    .single()

  if (!targetUser) return { success: false, error: 'Visitor login not found.' }
  if (targetUser.role !== 'viewer') return { success: false, error: 'Only viewer accounts can be revoked here.' }

  // Delete from public.users first (FK constraint means auth delete can cascade)
  const { error: deleteRowError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (deleteRowError) {
    console.error('revokeVisitorLogin delete row error:', deleteRowError)
    return { success: false, error: 'Failed to revoke visitor login. Please try again.' }
  }

  // Delete from Supabase auth
  const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(userId)
  if (deleteAuthError) {
    console.error('revokeVisitorLogin auth delete error:', deleteAuthError)
  }

  revalidatePath('/dashboard/account')
  return { success: true, message: `Visitor login for ${fullName} has been revoked.` }
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

  revalidatePath('/dashboard/account')
  return { success: true, message: 'Role updated.' }
}
