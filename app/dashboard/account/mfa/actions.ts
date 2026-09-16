'use server'

/**
 * Generate/regenerate backup codes for the current, already-aal2 user.
 * Called right after TOTP enrolment completes (mfa/setup/page.tsx, shown
 * once) and from the "Regenerate backup codes" button in MfaSection.tsx
 * (self-service, anytime while logged in). Either call replaces any
 * existing codes — regenerating deliberately invalidates the old batch
 * rather than adding to it, so a user can never be unsure which set is
 * still valid.
 */
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAAL2Satisfied } from '@/lib/session'
import { generateBackupCodes, hashBackupCode } from '@/lib/mfa-backup-codes'

type GenerateResult =
  | { success: true; codes: string[] }
  | { error: string }

export async function generateBackupCodesForCurrentUser(): Promise<GenerateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  if (!(await isAAL2Satisfied(supabase))) {
    return { error: 'Please verify your two-factor code first.' }
  }

  const { data: factors } = await supabase.auth.mfa.listFactors()
  if (!factors?.totp?.length) {
    return { error: 'Set up an authenticator app before generating backup codes.' }
  }

  const adminSupabase = createAdminClient()

  const { error: deleteError } = await adminSupabase
    .from('mfa_backup_codes')
    .delete()
    .eq('user_id', user.id)
  if (deleteError) return { error: 'Failed to generate backup codes. Please try again.' }

  const codes = generateBackupCodes()
  const rows = codes.map(code => ({ user_id: user.id, code_hash: hashBackupCode(code) }))

  const { error: insertError } = await adminSupabase
    .from('mfa_backup_codes')
    .insert(rows)
  if (insertError) return { error: 'Failed to generate backup codes. Please try again.' }

  return { success: true, codes }
}

/**
 * How many unused backup codes the current user has saved — 0 or 10, never
 * in between, since redeeming any one code invalidates the whole batch (see
 * redeemBackupCode's doc comment in app/login/mfa/actions.ts). Used by
 * BackupCodesPanel to show "codes saved" vs. "no codes saved" in Account →
 * Security without exposing the codes themselves.
 */
export async function getBackupCodeCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const adminSupabase = createAdminClient()
  const { count } = await adminSupabase
    .from('mfa_backup_codes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('used_at', null)

  return count ?? 0
}
