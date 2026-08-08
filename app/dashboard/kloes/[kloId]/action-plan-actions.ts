'use server'

/**
 * Action plan server actions.
 *
 * createActionItem   — add a new action to a KLOE
 * updateActionItem   — edit title, description, due date, priority, assignee, status
 * signOffActionItem  — mark complete with optional completion notes
 * deleteActionItem   — admin only; hard delete
 *
 * Note: action_items is a runtime-migrated table not yet in Supabase's generated
 * types, so we cast the client to `any` to bypass the type checker.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createActionItem(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentUserProfile()
  if (!profile) return { success: false, error: 'Not authenticated.' }
  if (profile.role === 'viewer') return { success: false, error: 'Viewers cannot create action items.' }

  const kloItemId   = (formData.get('klo_item_id') as string | null)?.trim()
  const title       = (formData.get('title') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const dueDate     = (formData.get('due_date') as string | null)?.trim() || null
  const priority    = (formData.get('priority') as string | null)?.trim() || 'medium'
  const assignedTo  = (formData.get('assigned_to') as string | null)?.trim() || null

  if (!kloItemId || !title) {
    return { success: false, error: 'Title is required.' }
  }
  if (!['high', 'medium', 'low'].includes(priority)) {
    return { success: false, error: 'Invalid priority.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const { error } = await supabase.from('action_items').insert({
    organisation_id: profile.organisation_id,
    klo_item_id:     kloItemId,
    title,
    description,
    due_date:        dueDate || null,
    priority:        priority as 'high' | 'medium' | 'low',
    assigned_to:     assignedTo || null,
    created_by:      profile.id,
  })

  if (error) {
    console.error('[action-plan] createActionItem error:', error)
    return { success: false, error: 'Could not create action item. Please try again.' }
  }

  revalidatePath(`/dashboard/kloes/${kloItemId}`)
  return { success: true }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateActionItem(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentUserProfile()
  if (!profile) return { success: false, error: 'Not authenticated.' }
  if (profile.role === 'viewer') return { success: false, error: 'Viewers cannot edit action items.' }

  const id          = (formData.get('id') as string | null)?.trim()
  const kloItemId   = (formData.get('klo_item_id') as string | null)?.trim()
  const title       = (formData.get('title') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const dueDate     = (formData.get('due_date') as string | null)?.trim() || null
  const priority    = (formData.get('priority') as string | null)?.trim() || 'medium'
  const assignedTo  = (formData.get('assigned_to') as string | null)?.trim() || null
  const status      = (formData.get('status') as string | null)?.trim() || 'open'

  if (!id || !kloItemId || !title) {
    return { success: false, error: 'Missing required fields.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const { error } = await supabase
    .from('action_items')
    .update({ title, description, due_date: dueDate || null, priority: priority as 'high' | 'medium' | 'low', assigned_to: assignedTo || null, status: status as 'open' | 'in_progress' | 'completed' })
    .eq('id', id)

  if (error) {
    console.error('[action-plan] updateActionItem error:', error)
    return { success: false, error: 'Could not update action item. Please try again.' }
  }

  revalidatePath(`/dashboard/kloes/${kloItemId}`)
  return { success: true }
}

// ─── Sign off ─────────────────────────────────────────────────────────────────

export async function signOffActionItem(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentUserProfile()
  if (!profile) return { success: false, error: 'Not authenticated.' }
  if (profile.role === 'viewer') return { success: false, error: 'Viewers cannot sign off action items.' }

  const id               = (formData.get('id') as string | null)?.trim()
  const kloItemId        = (formData.get('klo_item_id') as string | null)?.trim()
  const completionNotes  = (formData.get('completion_notes') as string | null)?.trim() || null

  if (!id || !kloItemId) return { success: false, error: 'Missing required fields.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const { error } = await supabase
    .from('action_items')
    .update({
      status:           'completed',
      completion_notes: completionNotes,
      completed_at:     new Date().toISOString(),
      completed_by:     profile.id,
    })
    .eq('id', id)

  if (error) {
    console.error('[action-plan] signOffActionItem error:', error)
    return { success: false, error: 'Could not sign off action item. Please try again.' }
  }

  revalidatePath(`/dashboard/kloes/${kloItemId}`)
  return { success: true }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteActionItem(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentUserProfile()
  if (!profile) return { success: false, error: 'Not authenticated.' }
  if (profile.role !== 'admin') return { success: false, error: 'Only admins can delete action items.' }

  const id        = (formData.get('id') as string | null)?.trim()
  const kloItemId = (formData.get('klo_item_id') as string | null)?.trim()

  if (!id || !kloItemId) return { success: false, error: 'Missing required fields.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const { error } = await supabase.from('action_items').delete().eq('id', id)

  if (error) {
    console.error('[action-plan] deleteActionItem error:', error)
    return { success: false, error: 'Could not delete action item. Please try again.' }
  }

  revalidatePath(`/dashboard/kloes/${kloItemId}`)
  return { success: true }
}
