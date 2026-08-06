/**
 * /dashboard/feedback — Complaints, compliments, suggestions, and concerns.
 *
 * Provides structured evidence of people's experience for the Caring and
 * Responsive key questions. CQC inspectors ask to see how feedback is
 * received, acted upon, and used to drive improvement.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import FeedbackClient, { type FeedbackRecord } from './FeedbackClient'

export const metadata = { title: 'Feedback Log — AlwaysReady' }

export default async function FeedbackPage() {
  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const orgId    = profile.organisation_id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (supabase as any)
    .from('feedback_records')
    .select('*')
    .eq('organisation_id', orgId)
    .order('received_date', { ascending: false })
    .order('created_at',    { ascending: false })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700">
        <strong>Error loading feedback records:</strong> {error.message}
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records: FeedbackRecord[] = (rows ?? []).map((r: any) => ({
    id:                   r.id,
    feedback_type:        r.feedback_type,
    received_date:        r.received_date,
    source:               r.source,
    source_detail:        r.source_detail,
    summary:              r.summary,
    action_taken:         r.action_taken,
    outcome:              r.outcome,
    status:               r.status,
    related_key_question: r.related_key_question,
    reported_to_cqc:      r.reported_to_cqc,
    created_by:           r.created_by,
    created_at:           r.created_at,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand mb-1">Feedback Log</h1>
        <p className="text-sm text-ink-dim">
          Record complaints, compliments, suggestions, and concerns received from people
          using the service, families, carers, and professionals.
        </p>
      </div>

      {/* Guidance banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Why this matters:</strong> CQC inspectors assess whether your service actively
        seeks and acts on feedback as part of the <strong>Caring</strong> and{' '}
        <strong>Responsive</strong> key questions. Logging feedback here — alongside the action
        taken and outcome — provides direct evidence that your service listens, learns, and
        improves. All staff can log feedback; admins can update status and close records.
      </div>

      <FeedbackClient
        records={records}
        isAdmin={profile.role === 'admin'}
        isViewer={profile.role === 'viewer'}
        currentUserId={profile.id}
      />
    </div>
  )
}
