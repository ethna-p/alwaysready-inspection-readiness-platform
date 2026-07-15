/**
 * Server-side session utilities.
 *
 * getCurrentUserProfile() is the single source of truth for "who is the
 * current user and what role do they have?" — call it in Server Components
 * and Route Handlers rather than fetching user + role separately.
 *
 * Returns null when:
 *   - the user is not authenticated, or
 *   - the users row doesn't exist yet (edge case during first sign-in)
 */

import { createClient } from '@/lib/supabase/server'
import type { User } from '@/lib/types'

export type UserProfile = Pick<User, 'id' | 'email' | 'role' | 'organisation_id' | 'viewer_expires_at'>

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, organisation_id, viewer_expires_at')
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
