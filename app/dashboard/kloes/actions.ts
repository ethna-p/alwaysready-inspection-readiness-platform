'use server'

/**
 * Server actions for compliance record updates.
 *
 * The append-only contract:
 *   App INSERTs into compliance_record_history.
 *   The database trigger (sync_compliance_record_from_history) UPSERTs
 *   compliance_records automatically. We never write to compliance_records
 *   directly from app code.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ComplianceStatus } from '@/lib/types'

export type ActionState =
  | { success: true; message: string }
  | { success: false; error: string }
  | null

/** Adds review_frequency_days to a date string (YYYY-MM-DD) and returns an ISO timestamp. */
function calcNextReviewDue(dateStr: string, frequencyDays: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + frequencyDays)
  return d.toISOString()
}

export async function updateKloCompliance(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  // ── Auth ───────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated. Please sign in again.' }
  }

  // ── Parse form ─────────────────────────────────────────────
  const kloItemId         = formData.get('klo_item_id') as string
  const rawStatus         = formData.get('status') as string
  const rawPriority       = formData.get('priority') as string
  const rawDateReviewed   = formData.get('date_reviewed') as string
  const rawFrequency      = formData.get('review_frequency_days') as string
  const evidenceLocation  = (formData.get('evidence_location') as string).trim() || null
  const notes             = (formData.get('notes') as string).trim() || null

  const status: ComplianceStatus = (rawStatus as ComplianceStatus) || 'not_started'
  const priority                 = Math.min(5, Math.max(1, parseInt(rawPriority, 10) || 3))
  const dateReviewed             = rawDateReviewed || null
  const reviewFrequencyDays      = Math.max(1, parseInt(rawFrequency, 10) || 90)
  const nextReviewDue            = dateReviewed
    ? calcNextReviewDue(dateReviewed, reviewFrequencyDays)
    : null

  if (!kloItemId) {
    return { success: false, error: 'Missing KLOE identifier.' }
  }

  // ── User's org ─────────────────────────────────────────────
  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('organisation_id')
    .eq('id', user.id)
    .single()

  if (userErr || !userRow) {
    return { success: false, error: 'Could not retrieve your organisation.' }
  }

  const organisationId = userRow.organisation_id

  // ── Fetch the current record (to detect priority/frequency changes) ─
  const { data: currentRecord } = await supabase
    .from('compliance_records')
    .select('priority, review_frequency_days')
    .eq('organisation_id', organisationId)
    .eq('klo_item_id', kloItemId)
    .maybeSingle()

  // ── Insert into history (trigger will upsert compliance_records) ────
  const { error: historyErr } = await supabase
    .from('compliance_record_history')
    .insert({
      organisation_id:       organisationId,
      klo_item_id:           kloItemId,
      status,
      priority,
      date_reviewed:         dateReviewed,
      next_review_due:       nextReviewDue,
      review_frequency_days: reviewFrequencyDays,
      evidence_location:     evidenceLocation,
      notes,
      changed_by:            user.id,
    })

  if (historyErr) {
    console.error('compliance_record_history insert error:', historyErr)
    return { success: false, error: 'Failed to save. Please try again.' }
  }

  // ── Audit: priority changed? ────────────────────────────────
  const oldPriority = currentRecord?.priority ?? null
  if (oldPriority !== priority) {
    await supabase.from('priority_history').insert({
      organisation_id: organisationId,
      klo_item_id:     kloItemId,
      old_priority:    oldPriority,
      new_priority:    priority,
      changed_by:      user.id,
    })
  }

  // ── Audit: review frequency changed? ───────────────────────
  const oldFrequency = currentRecord?.review_frequency_days ?? null
  if (oldFrequency !== reviewFrequencyDays) {
    await supabase.from('review_frequency_history').insert({
      organisation_id:    organisationId,
      klo_item_id:        kloItemId,
      old_frequency_days: oldFrequency,
      new_frequency_days: reviewFrequencyDays,
      changed_by:         user.id,
    })
  }

  // ── Revalidate pages that show this data ───────────────────
  revalidatePath('/dashboard/kloes')
  revalidatePath(`/dashboard/kloes/${kloItemId}`)

  return { success: true, message: 'KLOE updated and saved to your audit trail.' }
}
