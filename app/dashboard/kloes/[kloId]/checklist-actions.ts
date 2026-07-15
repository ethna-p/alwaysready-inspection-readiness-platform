'use server'

/**
 * Server actions for the compliance sub-checklist.
 *
 * upsertChecklistCompletion — marks an item complete/incomplete and
 * optionally stores an evidence location string.  Uses UPSERT so the
 * first call creates the row and subsequent calls update it.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'

export type ChecklistActionState = {
  success: boolean
  error?: string
} | null

export async function upsertChecklistCompletion(
  _prev: ChecklistActionState,
  formData: FormData
): Promise<ChecklistActionState> {
  const profile = await getCurrentUserProfile()
  if (!profile) return { success: false, error: 'Not authenticated.' }
  if (profile.role === 'viewer') return { success: false, error: 'Viewers cannot update checklists.' }

  const checklist_item_id = formData.get('checklist_item_id') as string
  const is_complete       = formData.get('is_complete') === 'true'
  const evidence_location = (formData.get('evidence_location') as string | null)?.trim() || null

  if (!checklist_item_id) return { success: false, error: 'Missing checklist_item_id.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('klo_checklist_completions')
    .upsert(
      {
        organisation_id:    profile.organisation_id,
        checklist_item_id,
        is_complete,
        evidence_location,
        completed_by:       is_complete ? profile.id : null,
        completed_at:       is_complete ? new Date().toISOString() : null,
      },
      { onConflict: 'organisation_id,checklist_item_id' }
    )

  if (error) {
    console.error('[upsertChecklistCompletion]', error)
    return { success: false, error: 'Failed to save. Please try again.' }
  }

  return { success: true }
}
