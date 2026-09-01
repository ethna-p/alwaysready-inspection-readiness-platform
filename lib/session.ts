/**
 * Server-side session utilities.
 *
 * getCurrentUserProfile() is the single source of truth for "who is the
 * current user and what role do they have?" — call it in Server Components
 * and Route Handlers rather than fetching user + role separately.
 *
 * Returns null when:
 *   - the user is not authenticated, or
 *   - the users row doesn't exist yet (edge case during first sign-in), or
 *   - the user has an MFA factor enrolled but hasn't completed verification
 *     this session (nextLevel === aal2, currentLevel !== aal2). This enforces
 *     AAL2 at the data layer for all API routes and server actions, closing
 *     the gap left by middleware (which is excluded from /api/* paths).
 */

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@/lib/types'

/**
 * Returns true when the session satisfies the required AAL level.
 * A user who has enrolled MFA but not verified it this session fails the check.
 * Users with no factor enrolled always pass (they are redirected to MFA setup
 * by middleware on page load; this guard covers direct API/action calls).
 */
export async function isAAL2Satisfied(supabase: SupabaseClient): Promise<boolean> {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (!aal) return true // can't determine — allow and let RLS handle it
  // nextLevel === 'aal2' means a factor is enrolled; if current is still aal1
  // the user skipped the MFA step (e.g. called the API directly).
  return !(aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2')
}

export type UserProfile = Pick<User, 'id' | 'email' | 'full_name' | 'username' | 'role' | 'organisation_id' | 'viewer_expires_at' | 'personal_email' | 'mobile_number'>

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  // Enforce AAL2: if the user has MFA enrolled but hasn't verified it this
  // session, treat them as unauthenticated at the data layer.
  if (!(await isAAL2Satisfied(supabase))) return null

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, username, role, organisation_id, viewer_expires_at, personal_email, mobile_number')
    .eq('id', user.id)
    .single()

  if (error || !data) return null

  // Treat expired viewer sessions as unauthenticated at the app layer.
  // RLS already blocks them at the DB layer, but this allows us to show
  // a friendly "your access has expired" message instead of silent 403s.
  if (data.role === 'viewer' && data.viewer_expires_at) {
    const expired = new Date(data.viewer_expires_at) < new Date()
    if (expired) return null
  }

  return data as UserProfile
}

/**
 * Convenience helper — throws a redirect rather than returning null.
 * Use in Server Components where missing auth should bounce to /login.
 */
export async function requireUserProfile(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile()
  if (!profile) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }
  return profile as UserProfile
}
