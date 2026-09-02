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
 *
 * Defence-in-depth: all mutations scope to profile.organisation_id in addition
 * to the RLS policies on the table, so a cross-org write fails at both layers.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole, requireAdmin } from '@/lib/auth'

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createActionItem(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(['admin', 'user'])
  if (!profile) return { success: false, error: 'Not authenticated or insufficient permissions.' }

  const kloItemId      = (formData.get('klo_item_id') as string | null)?.trim()
  const title          = (formData.get('title') as string | null)?.trim()
  const description    = (formData.get('description') as string | null)?.trim() || null
  const dueDate        = (formData.get('due_date') as string | null)?.trim() || null
  const priority       = (formData.get('priority') as string | null)?.trim() || 'medium'
  const assignedTo     = (formData.get('assigned_to') as string | null)?.trim() || null
  const findingId      = (formData.get('mock_inspection_finding_id') as string | null)?.trim() || null

  if (!kloItemId || !title) {
    return { success: false, error: 'Title is required.' }
  }
  if (!['high', 'medium', 'low'].includes(priority)) {
    return { success: false, error: 'Invalid priority.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  const { error } = await (supabase as any).from('action_items').insert({
    organisation_id:             profile.organisation_id,
    klo_item_id:                 kloItemId,
    title,
    description,
    due_date:                    dueDate || null,
    priority:                    priority as 'high' | 'medium' | 'low',
    assigned_to:                 assignedTo || null,
    created_by:                  profile.id,
    mock_inspection_finding_id:  findingId,
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
  const profile = await requireRole(['admin', 'user'])
  if (!profile) return { success: false, error: 'Not authenticated or insufficient permissions.' }

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

  if (!['high', 'medium', 'low'].includes(priority)) {
    return { success: false, error: 'Invalid priority.' }
  }
  if (!['open', 'in_progress', 'completed'].includes(status)) {
    return { success: false, error: 'Invalid status.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  // Scope to caller's org — defence-in-depth on top of RLS
  const { data, error } = await (supabase as any)
    .from('action_items')
    .update({
      title,
      description,
      due_date:    dueDate || null,
      priority:    priority as 'high' | 'medium' | 'low',
      assigned_to: assignedTo || null,
      status:      status as 'open' | 'in_progress' | 'completed',
    })
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)
    .select('id')

  if (error) {
    console.error('[action-plan] updateActionItem error:', error)
    return { success: false, error: 'Could not update action item. Please try again.' }
  }
  if (!data || data.length === 0) {
    return { success: false, error: 'Action item not found or you do not have permission to edit it.' }
  }

  revalidatePath(`/dashboard/kloes/${kloItemId}`)
  return { success: true }
}

// ─── Sign off ─────────────────────────────────────────────────────────────────

export async function signOffActionItem(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(['admin', 'user'])
  if (!profile) return { success: false, error: 'Not authenticated or insufficient permissions.' }

  const id               = (formData.get('id') as string | null)?.trim()
  const kloItemId        = (formData.get('klo_item_id') as string | null)?.trim()
  const completionNotes  = (formData.get('completion_notes') as string | null)?.trim() || null

  if (!id || !kloItemId) return { success: false, error: 'Missing required fields.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  // Scope to caller's org — defence-in-depth on top of RLS
  const { data, error } = await (supabase as any)
    .from('action_items')
    .update({
      status:           'completed',
      completion_notes: completionNotes,
      completed_at:     new Date().toISOString(),
      completed_by:     profile.id,
    })
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)
    .select('id')

  if (error) {
    console.error('[action-plan] signOffActionItem error:', error)
    return { success: false, error: 'Could not sign off action item. Please try again.' }
  }
  if (!data || data.length === 0) {
    return { success: false, error: 'Action item not found or you do not have permission to sign it off.' }
  }

  revalidatePath(`/dashboard/kloes/${kloItemId}`)
  return { success: true }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteActionItem(formData: FormData): Promise<ActionResult> {
  const profile = await requireAdmin()
  if (!profile) return { success: false, error: 'Only admins can delete action items.' }

  const id        = (formData.get('id') as string | null)?.trim()
  const kloItemId = (formData.get('klo_item_id') as string | null)?.trim()

  if (!id || !kloItemId) return { success: false, error: 'Missing required fields.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()

  // Scope to caller's org — defence-in-depth on top of RLS
  const { data, error } = await (supabase as any)
    .from('action_items')
    .delete()
    .eq('id', id)
    .eq('organisation_id', profile.organisation_id)
    .select('id')

  if (error) {
    console.error('[action-plan] deleteActionItem error:', error)
    return { success: false, error: 'Could not delete action item. Please try again.' }
  }
  if (!data || data.length === 0) {
    return { success: false, error: 'Action item not found.' }
  }

  revalidatePath(`/dashboard/kloes/${kloItemId}`)
  return { success: true }
}
