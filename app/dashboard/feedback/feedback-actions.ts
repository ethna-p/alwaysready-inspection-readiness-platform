'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'

// ── Types ─────────────────────────────────────────────────────────────────────

export type FeedbackType   = 'complaint' | 'compliment' | 'suggestion' | 'concern'
export type FeedbackSource = 'person_using_service' | 'family_or_carer' | 'professional' | 'anonymous' | 'other'
export type FeedbackStatus = 'open' | 'actioned' | 'closed'

// ── Create ────────────────────────────────────────────────────────────────────

export async function createFeedback(formData: FormData): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (!profile || !['admin', 'user'].includes(profile.role)) {
    return { error: 'Permission denied.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const feedback_type          = formData.get('feedback_type') as FeedbackType
  const received_date          = formData.get('received_date') as string
  const source                 = formData.get('source') as FeedbackSource
  const source_detail          = (formData.get('source_detail') as string)?.trim() || null
  const summary                = (formData.get('summary') as string)?.trim()
  const action_taken           = (formData.get('action_taken') as string)?.trim() || null
  const outcome                = (formData.get('outcome') as string)?.trim() || null
  const related_key_question   = (formData.get('related_key_question') as string)?.trim() || null
  const reported_to_cqc        = formData.get('reported_to_cqc') === 'true'

  if (!feedback_type || !received_date || !source || !summary) {
    return { error: 'Type, date, source, and summary are required.' }
  }

  const { error } = await supabase.from('feedback_records').insert({
    organisation_id:      profile.organisation_id,
    feedback_type,
    received_date,
    source,
    source_detail,
    summary,
    action_taken,
    outcome,
    related_key_question,
    reported_to_cqc,
    status: 'open',
    created_by: profile.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/feedback')
  return {}
}

// ── Update (own + open, or admin any) ────────────────────────────────────────

export async function updateFeedback(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (!profile || !['admin', 'user'].includes(profile.role)) {
    return { error: 'Permission denied.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const feedback_type        = formData.get('feedback_type') as FeedbackType
  const received_date        = formData.get('received_date') as string
  const source               = formData.get('source') as FeedbackSource
  const source_detail        = (formData.get('source_detail') as string)?.trim() || null
  const summary              = (formData.get('summary') as string)?.trim()
  const action_taken         = (formData.get('action_taken') as string)?.trim() || null
  const outcome              = (formData.get('outcome') as string)?.trim() || null
  const related_key_question = (formData.get('related_key_question') as string)?.trim() || null
  const reported_to_cqc      = formData.get('reported_to_cqc') === 'true'
  const status               = formData.get('status') as FeedbackStatus

  if (!feedback_type || !received_date || !source || !summary) {
    return { error: 'Type, date, source, and summary are required.' }
  }

  const { error } = await supabase
    .from('feedback_records')
    .update({
      feedback_type,
      received_date,
      source,
      source_detail,
      summary,
      action_taken,
      outcome,
      related_key_question,
      reported_to_cqc,
      status: status || 'open',
    })
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/feedback')
  return {}
}

// ── Delete (admin only) ───────────────────────────────────────────────────────

export async function deleteFeedback(id: string): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Permission denied.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { error } = await supabase
    .from('feedback_records')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/feedback')
  return {}
}
