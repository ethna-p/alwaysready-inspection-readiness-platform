'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { IStatementConfidence } from '@/lib/types'

export async function upsertIStatementEvidence(
  statementId: string,
  confidence: IStatementConfidence,
  evidenceSummary: string,
  actionNeeded: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organisation_id) return { error: 'No organisation found' }
  if (profile.role === 'viewer') return { error: 'Viewers cannot edit evidence' }

  const { error } = await supabase
    .from('i_statement_evidence')
    .upsert(
      {
        organisation_id:  profile.organisation_id,
        i_statement_id:   statementId,
        confidence,
        evidence_summary: evidenceSummary.trim() || null,
        action_needed:    actionNeeded.trim() || null,
        last_updated_at:  new Date().toISOString(),
        updated_by:       user.id,
      },
      { onConflict: 'organisation_id,i_statement_id' },
    )

  if (error) return { error: error.message }

  revalidatePath('/dashboard/peoples-voice')
  return { success: true }
}
