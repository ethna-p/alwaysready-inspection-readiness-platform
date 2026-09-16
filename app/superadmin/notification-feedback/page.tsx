/**
 * /superadmin/notification-feedback — responses to the opt-in notification
 * re-confirmation poll (Issue #31). Read-only: feedback is submitted from
 * Account -> Notifications (app/dashboard/account/notifications/actions.ts),
 * this page just surfaces the aggregate.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const USEFULNESS_LABELS: Record<string, string> = {
  very_useful:     'Very useful',
  somewhat_useful: 'Somewhat useful',
  not_useful:      'Not useful',
}

const USEFULNESS_STYLES: Record<string, string> = {
  very_useful:     'bg-green-100 text-green-700',
  somewhat_useful: 'bg-amber-100 text-amber-700',
  not_useful:      'bg-red-100 text-red-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default async function NotificationFeedbackPage() {
  const supabase = createAdminClient()

  const { data: feedback, error } = await supabase
    .from('notification_feedback')
    .select('id, usefulness, suggestion, created_at, user_id, organisation_id')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700">
        <strong>Error loading notification feedback:</strong> {error.message}
      </div>
    )
  }

  const rows = feedback ?? []

  // Look up submitter + org names for display
  const userIds = [...new Set(rows.map(r => r.user_id))]
  const orgIds  = [...new Set(rows.map(r => r.organisation_id))]

  const [{ data: users }, { data: orgs }] = await Promise.all([
    userIds.length > 0
      ? supabase.from('users').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[] }),
    orgIds.length > 0
      ? supabase.from('organisations').select('id, name').in('id', orgIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const userById = new Map((users ?? []).map(u => [u.id, u]))
  const orgById  = new Map((orgs ?? []).map(o => [o.id, o]))

  const counts = { very_useful: 0, somewhat_useful: 0, not_useful: 0 }
  for (const r of rows) counts[r.usefulness as keyof typeof counts]++

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-ink">Notification Feedback</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {rows.length} response{rows.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-sm text-ink-muted">
          Responses to the opt-in notification re-confirmation poll (review reminders + governance digest).
        </p>
      </div>

      {rows.length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {(['very_useful', 'somewhat_useful', 'not_useful'] as const).map(key => (
            <div key={key} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${USEFULNESS_STYLES[key]}`}>
              {USEFULNESS_LABELS[key]}: {counts[key]}
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-8 text-center text-sm text-ink-muted">
          No feedback submitted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => {
            const user = userById.get(r.user_id)
            const org  = orgById.get(r.organisation_id)
            return (
              <div key={r.id} className="bg-card border border-line rounded-xl px-5 py-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{user?.full_name ?? user?.email ?? '—'}</p>
                    <p className="text-xs text-ink-muted">{org?.name ?? '—'} · {formatDate(r.created_at)}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${USEFULNESS_STYLES[r.usefulness]}`}>
                    {USEFULNESS_LABELS[r.usefulness]}
                  </span>
                </div>
                {r.suggestion && (
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap mt-2 bg-fill rounded-lg px-3 py-2">
                    {r.suggestion}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
