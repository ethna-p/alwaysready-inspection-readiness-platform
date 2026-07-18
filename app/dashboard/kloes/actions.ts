'use server'

/**
 * Server actions for compliance record updates.
 *
 * The append-only contract:
 *   App INSERTs into compliance_record_history.
 *   The database trigger (sync_compliance_record_from_history) UPSERTs
 *   compliance_records automatically. We never write to compliance_records
 *   directly from app code — except for the assigned_to field (assignKloe).
 *
 * Role rules (enforced here AND at the RLS layer):
 *   admin  → can update all fields including priority, frequency, and assignment
 *   user   → can only update status / date_reviewed / evidence_location / notes
 *              and only for KLOEs assigned to them
 *   viewer → read-only; all mutations blocked
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
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

  // ── Auth + role ────────────────────────────────────────────
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return { success: false, error: 'Not authenticated. Please sign in again.' }
  }
  if (profile.role === 'viewer') {
    return { success: false, error: 'Viewers cannot make changes.' }
  }

  const isAdmin = profile.role === 'admin'

  // ── Parse form ─────────────────────────────────────────────
  const kloItemId         = formData.get('klo_item_id') as string
  const rawStatus         = formData.get('status') as string
  const rawPriority       = formData.get('priority') as string
  const rawDateReviewed   = formData.get('date_reviewed') as string
  const rawFrequency      = formData.get('review_frequency_days') as string
  const evidenceLocation  = (formData.get('evidence_location') as string | null)?.trim() || null
  const notes             = (formData.get('notes') as string | null)?.trim() || null

  const status: ComplianceStatus = (rawStatus as ComplianceStatus) || 'not_started'
  const dateReviewed             = rawDateReviewed || null

  if (!kloItemId) {
    return { success: false, error: 'Missing KLOE identifier.' }
  }

  const organisationId = profile.organisation_id

  // ── Fetch the current record ────────────────────────────────
  // Need this to:
  //   a) Preserve admin-set priority/frequency for non-admin saves
  //   b) Detect changes for audit sub-tables
  const { data: currentRecord } = await supabase
    .from('compliance_records')
    .select('priority, review_frequency_days')
    .eq('organisation_id', organisationId)
    .eq('klo_item_id', kloItemId)
    .maybeSingle()

  // For non-admins: ignore any submitted priority/frequency and use the
  // existing values (or sensible defaults if this is a brand-new record).
  const priority = isAdmin
    ? Math.min(5, Math.max(1, parseInt(rawPriority, 10) || 3))
    : (currentRecord?.priority ?? 3)

  const reviewFrequencyDays = isAdmin
    ? Math.max(1, parseInt(rawFrequency, 10) || 90)
    : (currentRecord?.review_frequency_days ?? 90)

  const nextReviewDue = dateReviewed
    ? calcNextReviewDue(dateReviewed, reviewFrequencyDays)
    : null

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
      changed_by:            profile.id,
    })

  if (historyErr) {
    console.error('compliance_record_history insert error:', historyErr)
    // If RLS blocked the insert, surface a helpful message
    if (historyErr.code === '42501') {
      return { success: false, error: 'You do not have permission to edit this KLOE. Check with your admin.' }
    }
    return { success: false, error: 'Failed to save. Please try again.' }
  }

  // ── Audit: priority changed? (admin only — users can't change it) ────
  if (isAdmin) {
    const oldPriority = currentRecord?.priority ?? null
    if (oldPriority !== priority) {
      await supabase.from('priority_history').insert({
        organisation_id: organisationId,
        klo_item_id:     kloItemId,
        old_priority:    oldPriority,
        new_priority:    priority,
        changed_by:      profile.id,
      })
    }

    // ── Audit: review frequency changed? ─────────────────────
    const oldFrequency = currentRecord?.review_frequency_days ?? null
    if (oldFrequency !== reviewFrequencyDays) {
      await supabase.from('review_frequency_history').insert({
        organisation_id:    organisationId,
        klo_item_id:        kloItemId,
        old_frequency_days: oldFrequency,
        new_frequency_days: reviewFrequencyDays,
        changed_by:         profile.id,
      })
    }
  }

  // ── Reset checklist ticks when a new review date is recorded ──────────
  // Completing a review cycle means the checklist needs to be re-ticked
  // for the next cycle. Evidence location fields are preserved.
  if (dateReviewed) {
    // Get all checklist item IDs for this KLOE
    const { data: checklistItems } = await supabase
      .from('klo_checklist_items')
      .select('id')
      .eq('klo_item_id', kloItemId)

    if (checklistItems && checklistItems.length > 0) {
      const itemIds = checklistItems.map(ci => ci.id)
      await supabase
        .from('klo_checklist_completions')
        .update({ is_complete: false })
        .in('checklist_item_id', itemIds)
        .eq('is_complete', true)
    }
  }

  // ── Revalidate pages that show this data ───────────────────
  revalidatePath('/dashboard/kloes')
  revalidatePath(`/dashboard/kloes/${kloItemId}`)

  return { success: true, message: 'KLOE updated and saved to your audit trail.' }
}

/**
 * Assign (or unassign) a KLOE to a team member.
 * Admin-only action — RLS also enforces this at the DB layer.
 */
export async function assignKloe(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const profile = await getCurrentUserProfile()
  if (!profile) {
    return { success: false, error: 'Not authenticated. Please sign in again.' }
  }
  if (profile.role !== 'admin') {
    return { success: false, error: 'Only admins can assign KLOEs.' }
  }

  const kloItemId  = formData.get('klo_item_id') as string
  const assignToId = (formData.get('assigned_to') as string) || null // empty string → null (unassign)

  if (!kloItemId) {
    return { success: false, error: 'Missing KLOE identifier.' }
  }

  const { error } = await supabase
    .from('compliance_records')
    .update({ assigned_to: assignToId || null })
    .eq('organisation_id', profile.organisation_id)
    .eq('klo_item_id', kloItemId)

  if (error) {
    console.error('assignKloe update error:', error)
    if (error.code === '42501') {
      return { success: false, error: 'Permission denied. Only admins can assign KLOEs.' }
    }
    return { success: false, error: 'Failed to save assignment. Please try again.' }
  }

  revalidatePath(`/dashboard/kloes/${kloItemId}`)
  revalidatePath('/dashboard/kloes')

  return {
    success: true,
    message: assignToId ? 'KLOE assigned successfully.' : 'KLOE unassigned.',
  }
}
