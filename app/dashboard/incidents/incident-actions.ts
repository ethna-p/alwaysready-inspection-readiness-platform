'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'

// ── Types ─────────────────────────────────────────────────────────────────────

export type IncidentType = 'safety' | 'safeguarding' | 'near_miss' | 'complaint' | 'other'
export type IncidentStatus = 'open' | 'under_review' | 'closed'

// ── Create ────────────────────────────────────────────────────────────────────

export async function createIncident(formData: FormData): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (!profile || !['admin', 'user'].includes(profile.role)) {
    return { error: 'Permission denied.' }
  }

  const supabase = await createClient()

  const title            = (formData.get('title') as string)?.trim()
  const incident_type    = formData.get('incident_type') as IncidentType
  const date_of_incident = formData.get('date_of_incident') as string
  const description      = (formData.get('description') as string)?.trim()
  const immediate_action = (formData.get('immediate_action') as string)?.trim() || null
  const people_involved  = (formData.get('people_involved') as string)?.trim() || null
  const reported_externally = formData.get('reported_externally') === 'true'
  const external_ref     = (formData.get('external_ref') as string)?.trim() || null

  if (!title || !incident_type || !date_of_incident || !description) {
    return { error: 'Title, type, date, and description are required.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('incidents').insert({
    organisation_id:    profile.organisation_id,
    title,
    incident_type,
    date_of_incident,
    description,
    immediate_action,
    people_involved,
    reported_externally,
    external_ref,
    reported_by: profile.id,
    status: 'open',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/incidents')
  return {}
}

// ── Update status (admin only) ────────────────────────────────────────────────

export async function updateIncidentStatus(
  incidentId: string,
  status: IncidentStatus,
  learning_outcome?: string,
): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Permission denied.' }

  const supabase = await createClient()

  const updates: Record<string, unknown> = { status }
  if (status === 'closed') {
    updates.learning_outcome = learning_outcome?.trim() || null
    updates.closed_at        = new Date().toISOString()
    updates.closed_by        = profile.id
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('incidents')
    .update(updates)
    .eq('id', incidentId)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/incidents')
  return {}
}

// ── Update own incident (reporter, while open/under_review) ──────────────────

export async function updateIncident(
  incidentId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (!profile || !['admin', 'user'].includes(profile.role)) {
    return { error: 'Permission denied.' }
  }

  const supabase = await createClient()

  const title            = (formData.get('title') as string)?.trim()
  const incident_type    = formData.get('incident_type') as IncidentType
  const date_of_incident = formData.get('date_of_incident') as string
  const description      = (formData.get('description') as string)?.trim()
  const immediate_action = (formData.get('immediate_action') as string)?.trim() || null
  const people_involved  = (formData.get('people_involved') as string)?.trim() || null
  const reported_externally = formData.get('reported_externally') === 'true'
  const external_ref     = (formData.get('external_ref') as string)?.trim() || null

  if (!title || !incident_type || !date_of_incident || !description) {
    return { error: 'Title, type, date, and description are required.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('incidents')
    .update({
      title,
      incident_type,
      date_of_incident,
      description,
      immediate_action,
      people_involved,
      reported_externally,
      external_ref,
    })
    .eq('id', incidentId)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/incidents')
  return {}
}

// ── Delete (admin only) ───────────────────────────────────────────────────────

export async function deleteIncident(incidentId: string): Promise<{ error?: string }> {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return { error: 'Permission denied.' }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('incidents')
    .delete()
    .eq('id', incidentId)
    .eq('organisation_id', profile.organisation_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/incidents')
  return {}
}
