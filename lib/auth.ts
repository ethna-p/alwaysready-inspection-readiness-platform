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
import type { SupabaseClient } from '@supabase/supabase-js'

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

/**
 * Asserts that a resource belongs to the caller's organisation.
 * Throws a plain Error (caught by the calling server action and returned
 * as an error response) if the IDs do not match.
 *
 * Use this anywhere a route or server action accepts an organisationId
 * parameter from the client — it prevents cross-tenant data access even
 * if a valid session exists.
 *
 * @param profile        - The authenticated profile returned by requireUser() or requireAdmin().
 * @param organisationId - The organisation ID associated with the resource being accessed.
 */
export function assertOwnOrg(profile: AuthedProfile, organisationId: string): void {
  if (profile.organisation_id !== organisationId) {
    throw new Error('Access denied: resource belongs to a different organisation.')
  }
}

/**
 * Returns true if userId is a member of organisationId.
 *
 * Use this before writing a client-supplied user id into an assignee/
 * reference column (e.g. compliance_records.assigned_to, action_items.assigned_to).
 * Without it, any client-supplied user id is accepted as-is — RLS scopes the
 * *row being written* to the caller's own org, but says nothing about which
 * org the referenced user id belongs to, so a caller could silently assign
 * work (and trigger an email notification) to a user in a different
 * organisation entirely.
 */
export async function isUserInOrg(
  supabase: SupabaseClient,
  userId: string,
  organisationId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .eq('organisation_id', organisationId)
    .single()
  return !!data
}
