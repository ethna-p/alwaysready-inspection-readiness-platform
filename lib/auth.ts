/**
 * Centralised authorization helpers for server actions.
 *
 * These replace the scattered inline auth checks across action files.
 * All helpers call getCurrentUserProfile() — which uses the server-side
 * Supabase client and the session cookie — so they never trust
 * client-passed IDs.
 *
 * Usage:
 *   const profile = await requireAdmin()
 *   if (!profile) return { success: false, error: 'Admin access required.' }
 *
 * RLS remains the authoritative enforcement layer at the database level.
 * These helpers add a consistent application-layer check on top of that.
 *
 * Note: a generic requireOrgResource() helper is intentionally omitted.
 * Ownership checks are table-specific and use the typed Supabase client
 * directly in each action — this avoids needing to cast the client to any.
 */

import { getCurrentUserProfile } from '@/lib/session'
import type { UserProfile } from '@/lib/session'

/** A profile guaranteed to have an organisation_id (i.e. fully provisioned). */
export type AuthedProfile = UserProfile & { organisation_id: string }

/**
 * Returns the authenticated user's profile, or null if:
 * - not authenticated
 * - no organisation_id (edge case during provisioning)
 * - viewer account has expired (handled inside getCurrentUserProfile)
 */
export async function requireUser(): Promise<AuthedProfile | null> {
  const profile = await getCurrentUserProfile()
  if (!profile || !profile.organisation_id) return null
  return profile as AuthedProfile
}

/**
 * Returns the authenticated profile only if role === 'admin'.
 * Returns null for unauthenticated users, missing orgs, or non-admin roles.
 */
export async function requireAdmin(): Promise<AuthedProfile | null> {
  const profile = await requireUser()
  if (!profile) return null
  if (profile.role !== 'admin') return null
  return profile
}

/**
 * Returns the authenticated profile only if the user's role is in allowedRoles.
 * Expired viewer accounts are already filtered out by requireUser().
 */
export async function requireRole(
  allowedRoles: Array<'admin' | 'user' | 'viewer'>
): Promise<AuthedProfile | null> {
  const profile = await requireUser()
  if (!profile) return null
  if (!allowedRoles.includes(profile.role as 'admin' | 'user' | 'viewer')) return null
  return profile
}
