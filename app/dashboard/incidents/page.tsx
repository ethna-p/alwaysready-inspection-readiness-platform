/**
 * /dashboard/incidents — Incident log.
 *
 * All staff roles can view and log incidents.
 * Admins can move incidents through review → closed and record learning outcomes.
 */
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import { redirect } from 'next/navigation'
import IncidentsClient, { type Incident } from './IncidentsClient'

export const metadata = { title: 'Incident Log — AlwaysReady' }

export default async function IncidentsPage() {
  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const orgId    = profile.organisation_id

  // Build a name lookup for users in this org
  const { data: teamRows } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('organisation_id', orgId)
  const nameById = new Map((teamRows ?? []).map(u => [u.id, u.full_name ?? u.email ?? 'Unknown']))

  // Fetch all incidents for this org, most recent first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('organisation_id', orgId)
    .order('date_of_incident', { ascending: false })
    .order('created_at',       { ascending: false })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700">
        <strong>Error loading incidents:</strong> {error.message}
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incidents: Incident[] = (rows ?? []).map((r: any) => ({
    id:                  r.id,
    title:               r.title,
    incident_type:       r.incident_type,
    date_of_incident:    r.date_of_incident,
    description:         r.description,
    immediate_action:    r.immediate_action,
    people_involved:     r.people_involved,
    reported_externally: r.reported_externally,
    external_ref:        r.external_ref,
    status:              r.status,
    learning_outcome:    r.learning_outcome,
    reported_by:         r.reported_by,
    reported_by_name:    r.reported_by ? (nameById.get(r.reported_by) ?? null) : null,
    closed_at:           r.closed_at,
    closed_by_name:      r.closed_by ? (nameById.get(r.closed_by) ?? null) : null,
    created_at:          r.created_at,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand mb-1">Incident Log</h1>
        <p className="text-sm text-ink-dim">
          Record safety incidents, safeguarding concerns, near misses, and complaints.
          All entries are securely stored and available to CQC inspectors on request.
        </p>
      </div>

      {/* Guidance banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>When to log an incident:</strong> any event that has harmed or could have harmed
        a person using the service, any safeguarding concern or allegation, any formal complaint,
        and any near miss. Logging an incident here does not replace your duty to notify CQC or
        your local authority where required.
      </div>

      <IncidentsClient
        incidents={incidents}
        currentUserId={profile.id}
        isAdmin={profile.role === 'admin'}
        isViewer={profile.role === 'viewer'}
      />
    </div>
  )
}
