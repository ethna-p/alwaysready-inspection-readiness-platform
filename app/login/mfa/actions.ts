'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashBackupCode } from '@/lib/mfa-backup-codes'

/**
 * Returns the correct post-MFA redirect destination for the current user.
 * The superadmin email comparison is done server-side so the value is never
 * baked into the client JS bundle (avoids NEXT_PUBLIC_ exposure).
 */
export async function getPostMfaDestination(): Promise<'/superadmin' | '/dashboard'> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (superadminEmail && user?.email === superadminEmail) {
    return '/superadmin'
  }
  return '/dashboard'
}

/**
 * Redeems a backup code for the current aal1 session (password already
 * verified, TOTP device lost — exactly the case this page exists for).
 * Identity here comes from the already-authenticated session, not from
 * anything the caller supplies, so this can't be used to reset a factor on
 * an account the caller doesn't control.
 *
 * A valid, unused code proves the same thing a second factor would, so it's
 * treated the same way admin/superadmin-initiated MFA resets already are:
 * delete the stuck TOTP factor and every remaining backup code (the whole
 * batch is spent, not just the one used — the resolution is always "set up
 * a fresh authenticator and get a fresh batch"), and let the existing
 * mandatory-setup redirect in middleware.ts take it from there. No separate
 * AAL-upgrade path needed.
 */
type RedeemResult =
  | { success: true }
  | { error: string }

export async function redeemBackupCode(code: string): Promise<RedeemResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  if (!code.trim()) return { error: 'Enter a backup code.' }

  const adminSupabase = createAdminClient()
  const codeHash = hashBackupCode(code)

  const { data: match } = await adminSupabase
    .from('mfa_backup_codes')
    .select('id')
    .eq('user_id', user.id)
    .eq('code_hash', codeHash)
    .is('used_at', null)
    .maybeSingle()

  if (!match) {
    return { error: 'Invalid or already-used backup code.' }
  }

  const { error: deleteCodesError } = await adminSupabase
    .from('mfa_backup_codes')
    .delete()
    .eq('user_id', user.id)
  if (deleteCodesError) return { error: 'Something went wrong. Please try again.' }

  const { data: factorsData, error: listError } = await adminSupabase.auth.admin.mfa.listFactors({ userId: user.id })
  if (listError) return { error: 'Something went wrong. Please try again.' }

  for (const factor of factorsData?.factors ?? []) {
    const { error } = await adminSupabase.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id })
    if (error) return { error: 'Something went wrong. Please try again.' }
  }

  // Deleting the factor via the admin API doesn't touch the CALLER's own
  // session — its access token was already minted (at login) with AAL
  // claims baked in from when the factor still existed, so
  // getAuthenticatorAssuranceLevel() keeps reporting nextLevel: 'aal2' until
  // that token is reissued. Without this, the hard-navigate right after a
  // successful redemption walks straight into middleware's own "factor
  // enrolled but not verified this session" guard (aal.nextLevel === 'aal2'
  // && currentLevel !== 'aal2') and bounces back to /login/mfa — which then
  // finds zero factors to challenge against and gives up to /login,
  // stranding the user in a dead end instead of reaching mandatory re-setup.
  // refreshSession() on this same cookie-bound client remints the token
  // with current AAL state and flushes it to cookies before we return.
  await supabase.auth.refreshSession()

  return { success: true }
}
