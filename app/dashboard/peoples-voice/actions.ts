'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { IStatementConfidence } from '@/lib/types'

// ── Upsert evidence + review dates ───────────────────────────────────────────

export async function upsertIStatementEvidence(
  statementId: string,
  confidence: IStatementConfidence,
  evidenceSummary: string,
  actionNeeded: string,
  dateReviewed: string,
  nextReviewDue: string,
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
        date_reviewed:    dateReviewed || null,
        next_review_due:  nextReviewDue || null,
        last_updated_at:  new Date().toISOString(),
        updated_by:       user.id,
      },
      { onConflict: 'organisation_id,i_statement_id' },
    )

  if (error) return { error: error.message }

  revalidatePath('/dashboard/peoples-voice')
  return { success: true }
}

// ── Action item actions ───────────────────────────────────────────────────────

export async function createIStatementAction(
  formData: FormData,
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
  if (profile.role === 'viewer') return { error: 'Viewers cannot create action items' }

  const statementId  = formData.get('i_statement_id') as string
  const title        = (formData.get('title') as string)?.trim()
  const description  = (formData.get('description') as string)?.trim() || null
  const dueDate      = (formData.get('due_date') as string) || null
  const priority     = (formData.get('priority') as string) || 'medium'
  const assignedTo   = (formData.get('assigned_to') as string) || null

  if (!statementId) return { error: 'Missing statement ID' }
  if (!title)       return { error: 'Title is required' }

  const { error } = await supabase
    .from('i_statement_actions')
    .insert({
      organisation_id: profile.organisation_id,
      i_statement_id:  statementId,
      title,
      description,
      due_date:        dueDate,
      priority:        priority as 'high' | 'medium' | 'low',
      assigned_to:     assignedTo || null,
      created_by:      user.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/peoples-voice')
  return { success: true }
}

export async function signOffIStatementAction(
  formData: FormData,
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
  if (profile.role === 'viewer') return { error: 'Viewers cannot sign off action items' }

  const id              = formData.get('id') as string
  const completionNotes = (formData.get('completion_notes') as string)?.trim() || null

  const { error } = await supabase
    .from('i_statement_actions')
    .update({
      status:           'completed',
      completion_notes: completionNotes,
      completed_at:     new Date().toISOString(),
      completed_by:     user.id,
    })
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/peoples-voice')
  return { success: true }
}

export async function deleteIStatementAction(
  formData: FormData,
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
  if (profile.role !== 'admin') return { error: 'Only admins can delete action items' }

  const id = formData.get('id') as string

  const { error } = await supabase
    .from('i_statement_actions')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/peoples-voice')
  return { success: true }
}
