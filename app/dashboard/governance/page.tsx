/**
 * /dashboard/governance — Governance meeting log.
 *
 * Records quality assurance and governance meetings that CQC inspectors
 * ask to see as evidence of effective Well-led oversight. All staff roles
 * can view; admins and staff can record meetings; only admins can sign off.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import GovernanceClient, { type GovernanceMeeting } from './GovernanceClient'

export const metadata = { title: 'Governance Log — AlwaysReady' }

export default async function GovernancePage() {
  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const orgId    = profile.organisation_id

  // Resolve user names for signed_off_by
  const { data: teamRows } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('organisation_id', orgId)
  const nameById = new Map((teamRows ?? []).map(u => [u.id, u.full_name ?? u.email ?? 'Unknown']))

  // Fetch all meetings for this org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await supabase
    .from('governance_meetings')
    .select('*')
    .eq('organisation_id', orgId)
    .order('meeting_date', { ascending: false })
    .order('created_at',   { ascending: false })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700">
        <strong>Error loading meetings:</strong> {error.message}
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meetings: GovernanceMeeting[] = (rows ?? []).map((r: any) => ({
    id:                 r.id,
    title:              r.title,
    meeting_date:       r.meeting_date,
    attendees:          r.attendees,
    agenda:             r.agenda,
    key_decisions:      r.key_decisions,
    actions_arising:    r.actions_arising,
    status:             r.status,
    signed_off_by_name: r.signed_off_by ? (nameById.get(r.signed_off_by) ?? null) : null,
    signed_off_at:      r.signed_off_at,
    created_by:         r.created_by,
    created_at:         r.created_at,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand mb-1">Governance Log</h1>
        <p className="text-sm text-ink-dim">
          Record your quality assurance and governance meetings. CQC inspectors routinely
          ask to see evidence of regular Well-led oversight — this log provides that record.
        </p>
      </div>

      {/* Guidance banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>What to record:</strong> any meeting where compliance, quality, or service
        improvement is formally reviewed — monthly QA meetings, registered manager supervision,
        staff team meetings with a governance agenda, or trustee/director reviews. Record who
        attended, what was discussed, decisions made, and actions agreed. An admin must sign
        off each record to confirm it is accurate and complete.
      </div>

      <GovernanceClient
        meetings={meetings}
        isAdmin={profile.role === 'admin'}
        isViewer={profile.role === 'viewer'}
        currentUserId={profile.id}
      />
    </div>
  )
}
