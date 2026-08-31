'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin, requireUser } from '@/lib/auth'
import type { MockInspectionRating, MockChecklistResponse } from '@/lib/types'

// ── Start a new mock inspection ─────────────────────────────────────────────

export async function startMockInspection(
  type: 'full' | 'partial',
  keyQuestionId: string | null,
): Promise<{ id: string } | { error: string }> {
  const profile = await requireAdmin()
  if (!profile) return { error: 'Only admins can run mock inspections' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mock_inspections')
    .insert({
      organisation_id: profile.organisation_id,
      type,
      key_question_id: keyQuestionId ?? null,
      status: 'in_progress',
      conducted_by: profile.id,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Failed to start inspection' }

  revalidatePath('/dashboard/mock-inspections')
  return { id: data.id }
}

// ── Save finding for a KLOE ─────────────────────────────────────────────────

export async function saveMockFinding(
  mockInspectionId: string,
  kloItemId: string,
  rating: MockInspectionRating,
  notes: string,
): Promise<{ success: true } | { error: string }> {
  const profile = await requireUser()
  if (!profile) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify the inspection belongs to the caller's org
  const { data: inspection } = await supabase
    .from('mock_inspections')
    .select('id')
    .eq('id', mockInspectionId)
    .eq('organisation_id', profile.organisation_id)
    .maybeSingle()
  if (!inspection) return { error: 'Inspection not found' }

  const { error } = await supabase
    .from('mock_inspection_findings')
    .upsert(
      {
        mock_inspection_id: mockInspectionId,
        klo_item_id: kloItemId,
        rating,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'mock_inspection_id,klo_item_id' },
    )

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/mock-inspections/${mockInspectionId}`)
  return { success: true }
}

// ── Save checklist response for an I statement ───────────────────────────────

export async function saveMockChecklistResponse(
  mockInspectionId: string,
  checklistItemId: string,
  response: MockChecklistResponse,
  note: string,
): Promise<{ success: true } | { error: string }> {
  const profile = await requireUser()
  if (!profile) return { error: 'Not authenticated' }

  const supabase = await createClient()

  // Verify the inspection belongs to the caller's org
  const { data: inspection } = await supabase
    .from('mock_inspections')
    .select('id')
    .eq('id', mockInspectionId)
    .eq('organisation_id', profile.organisation_id)
    .maybeSingle()
  if (!inspection) return { error: 'Inspection not found' }

  const { error } = await supabase
    .from('mock_inspection_checklist_responses')
    .upsert(
      {
        mock_inspection_id: mockInspectionId,
        checklist_item_id: checklistItemId,
        response,
        note: note.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'mock_inspection_id,checklist_item_id' },
    )

  if (error) return { error: error.message }
  return { success: true }
}

// ── Complete a mock inspection ───────────────────────────────────────────────

export async function completeMockInspection(
  mockInspectionId: string,
): Promise<{ success: true } | { error: string }> {
  const profile = await requireUser()
  if (!profile) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('mock_inspections')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', mockInspectionId)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/mock-inspections')
  revalidatePath(`/dashboard/mock-inspections/${mockInspectionId}`)
  return { success: true }
}
