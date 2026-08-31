'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin, requireRole } from '@/lib/auth'
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
  const profile = await requireRole(['admin', 'user'])
  if (!profile) return { error: 'Not authenticated or insufficient permissions.' }

  const supabase = await createClient()

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
        updated_by:       profile.id,
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
  const profile = await requireRole(['admin', 'user'])
  if (!profile) return { error: 'Not authenticated or insufficient permissions.' }

  const supabase = await createClient()

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
      created_by:      profile.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/peoples-voice')
  return { success: true }
}

export async function signOffIStatementAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const profile = await requireRole(['admin', 'user'])
  if (!profile) return { error: 'Not authenticated or insufficient permissions.' }

  const supabase = await createClient()

  const id              = formData.get('id') as string
  const completionNotes = (formData.get('completion_notes') as string)?.trim() || null

  const { error } = await supabase
    .from('i_statement_actions')
    .update({
      status:           'completed',
      completion_notes: completionNotes,
      completed_at:     new Date().toISOString(),
      completed_by:     profile.id,
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
  const profile = await requireAdmin()
  if (!profile) return { error: 'Only admins can delete action items.' }

  const supabase = await createClient()

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
