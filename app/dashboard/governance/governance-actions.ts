'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MeetingStatus = 'draft' | 'signed_off'

// ── Create ────────────────────────────────────────────────────────────────────

export async function createMeeting(formData: FormData): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (!profile || !['admin', 'user'].includes(profile.role)) {
    return { error: 'Permission denied.' }
  }

  const title           = (formData.get('title') as string)?.trim()
  const meeting_date    = formData.get('meeting_date') as string
  const attendees       = (formData.get('attendees') as string)?.trim() || null
  const agenda          = (formData.get('agenda') as string)?.trim() || null
  const key_decisions   = (formData.get('key_decisions') as string)?.trim() || null
  const actions_arising = (formData.get('actions_arising') as string)?.trim() || null

  if (!title || !meeting_date) return { error: 'Title and date are required.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { error } = await supabase.from('governance_meetings').insert({
    organisation_id: profile.organisation_id,
    title,
    meeting_date,
    attendees,
    agenda,
    key_decisions,
    actions_arising,
    created_by: profile.id,
    status: 'draft',
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/governance')
  return {}
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateMeeting(
  meetingId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (!profile || !['admin', 'user'].includes(profile.role)) {
    return { error: 'Permission denied.' }
  }

  const title           = (formData.get('title') as string)?.trim()
  const meeting_date    = formData.get('meeting_date') as string
  const attendees       = (formData.get('attendees') as string)?.trim() || null
  const agenda          = (formData.get('agenda') as string)?.trim() || null
  const key_decisions   = (formData.get('key_decisions') as string)?.trim() || null
  const actions_arising = (formData.get('actions_arising') as string)?.trim() || null

  if (!title || !meeting_date) return { error: 'Title and date are required.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { error } = await supabase
    .from('governance_meetings')
    .update({ title, meeting_date, attendees, agenda, key_decisions, actions_arising })
    .eq('id', meetingId)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/governance')
  return {}
}

// ── Sign off (admin only) ─────────────────────────────────────────────────────

export async function signOffMeeting(meetingId: string): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Only admins can sign off meetings.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { error } = await supabase
    .from('governance_meetings')
    .update({
      status:        'signed_off',
      signed_off_by: profile.id,
      signed_off_at: new Date().toISOString(),
    })
    .eq('id', meetingId)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/governance')
  return {}
}

// ── Delete (admin only) ───────────────────────────────────────────────────────

export async function deleteMeeting(meetingId: string): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Permission denied.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { error } = await supabase
    .from('governance_meetings')
    .delete()
    .eq('id', meetingId)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/governance')
  return {}
}
