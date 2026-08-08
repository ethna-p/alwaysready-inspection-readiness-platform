'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CqcRating   = 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
export type ReviewStatus = 'draft_received' | 'fac_submitted' | 'final_report' | 'action_plan_active' | 'closed'
export type FacDisputeType = 'factual_error' | 'subjective_judgment'
export type FacStatus   = 'pending' | 'submitted' | 'upheld' | 'rejected'

// ── Review actions ────────────────────────────────────────────────────────────

export async function createReview(formData: FormData): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Permission denied.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const inspection_date     = formData.get('inspection_date') as string
  const draft_received_date = (formData.get('draft_received_date') as string) || null
  const overall_rating      = (formData.get('overall_rating') as CqcRating) || 'not_rated'
  const safe_rating         = (formData.get('safe_rating') as CqcRating) || 'not_rated'
  const effective_rating    = (formData.get('effective_rating') as CqcRating) || 'not_rated'
  const caring_rating       = (formData.get('caring_rating') as CqcRating) || 'not_rated'
  const responsive_rating   = (formData.get('responsive_rating') as CqcRating) || 'not_rated'
  const well_led_rating     = (formData.get('well_led_rating') as CqcRating) || 'not_rated'
  const inspector_name      = (formData.get('inspector_name') as string)?.trim() || null
  const key_findings        = (formData.get('key_findings') as string)?.trim() || null
  const status              = (formData.get('status') as ReviewStatus) || 'draft_received'

  if (!inspection_date) return { error: 'Inspection date is required.' }

  const { data, error } = await supabase
    .from('post_inspection_reviews')
    .insert({
      organisation_id: profile.organisation_id,
      inspection_date,
      draft_received_date,
      overall_rating,
      safe_rating,
      effective_rating,
      caring_rating,
      responsive_rating,
      well_led_rating,
      inspector_name,
      key_findings,
      status,
      created_by: profile.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  if (!data?.id) return { error: 'Record created but ID was not returned. Please refresh.' }

  revalidatePath('/dashboard/post-inspection')
  redirect(`/dashboard/post-inspection/${data.id}`)
}

export async function updateReview(id: string, formData: FormData): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Permission denied.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const { error } = await supabase
    .from('post_inspection_reviews')
    .update({
      inspection_date:     formData.get('inspection_date') as string,
      draft_received_date: (formData.get('draft_received_date') as string) || null,
      final_report_date:   (formData.get('final_report_date') as string) || null,
      overall_rating:      (formData.get('overall_rating') as CqcRating) || 'not_rated',
      safe_rating:         (formData.get('safe_rating') as CqcRating) || 'not_rated',
      effective_rating:    (formData.get('effective_rating') as CqcRating) || 'not_rated',
      caring_rating:       (formData.get('caring_rating') as CqcRating) || 'not_rated',
      responsive_rating:   (formData.get('responsive_rating') as CqcRating) || 'not_rated',
      well_led_rating:     (formData.get('well_led_rating') as CqcRating) || 'not_rated',
      inspector_name:      (formData.get('inspector_name') as string)?.trim() || null,
      key_findings:        (formData.get('key_findings') as string)?.trim() || null,
      staff_briefing:      (formData.get('staff_briefing') as string)?.trim() || null,
      status:              (formData.get('status') as ReviewStatus) || 'draft_received',
    })
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/post-inspection')
  revalidatePath(`/dashboard/post-inspection/${id}`)
  return {}
}

export async function deleteReview(id: string): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Permission denied.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const { error } = await supabase
    .from('post_inspection_reviews')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/post-inspection')
  return {}
}

// ── FAC item actions ──────────────────────────────────────────────────────────

export async function createFacItem(reviewId: string, formData: FormData): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Permission denied.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const key_question       = formData.get('key_question') as 'Safe' | 'Effective' | 'Caring' | 'Responsive' | 'Well-led'
  const inspector_finding  = (formData.get('inspector_finding') as string)?.trim()
  const dispute_type       = formData.get('dispute_type') as FacDisputeType
  const our_position       = (formData.get('our_position') as string)?.trim()
  const evidence_reference = (formData.get('evidence_reference') as string)?.trim() || null

  if (!key_question || !inspector_finding || !dispute_type || !our_position) {
    return { error: 'Key question, inspector finding, dispute type, and our position are required.' }
  }

  const { error } = await supabase.from('fac_items').insert({
    organisation_id: profile.organisation_id,
    review_id:       reviewId,
    key_question,
    inspector_finding,
    dispute_type,
    our_position,
    evidence_reference,
    status: 'pending',
    created_by: profile.id,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/post-inspection/${reviewId}`)
  return {}
}

export async function updateFacItem(id: string, reviewId: string, formData: FormData): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Permission denied.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const { error } = await supabase
    .from('fac_items')
    .update({
      key_question:       formData.get('key_question') as 'Safe' | 'Effective' | 'Caring' | 'Responsive' | 'Well-led',
      inspector_finding:  (formData.get('inspector_finding') as string)?.trim(),
      dispute_type:       formData.get('dispute_type') as FacDisputeType,
      our_position:       (formData.get('our_position') as string)?.trim(),
      evidence_reference: (formData.get('evidence_reference') as string)?.trim() || null,
      status:             (formData.get('status') as FacStatus) || 'pending',
    })
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/post-inspection/${reviewId}`)
  return {}
}

export async function deleteFacItem(id: string, reviewId: string): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Permission denied.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const { error } = await supabase
    .from('fac_items')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/post-inspection/${reviewId}`)
  return {}
}
