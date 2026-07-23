'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MockInspectionRating, MockChecklistResponse } from '@/lib/types'

// ── Start a new mock inspection ─────────────────────────────────────────────

export async function startMockInspection(
  type: 'full' | 'partial',
  keyQuestionId: string | null,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organisation_id) return { error: 'No organisation found' }
  if (profile.role !== 'admin') return { error: 'Only admins can run mock inspections' }

  const { data, error } = await (supabase as any)
    .from('mock_inspections')
    .insert({
      organisation_id: profile.organisation_id,
      type,
      key_question_id: keyQuestionId ?? null,
      status: 'in_progress',
      conducted_by: user.id,
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase as any)
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase as any)
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase as any)
    .from('mock_inspections')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', mockInspectionId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/mock-inspections')
  revalidatePath(`/dashboard/mock-inspections/${mockInspectionId}`)
  return { success: true }
}
