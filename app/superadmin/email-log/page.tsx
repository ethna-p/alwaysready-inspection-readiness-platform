/**
 * /superadmin/email-log — trial and onboarding email progress per organisation.
 *
 * Shows which scheduled emails have been sent to each org, pulled from
 * the notification_log table. Covers:
 *   - Trial emails (notification_type: trial_day, entity_ids: day_01…day_14b)
 *   - Onboarding emails (notification_type: onboarding_week, entity_ids: week_01…week_52)
 */

import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Ordered list of trial entity_ids
const TRIAL_IDS = [
  'day_01', 'day_03', 'day_05', 'day_07',
  'day_09', 'day_11', 'day_13', 'day_14b',
] as const

// Ordered list of onboarding entity_ids
const ONBOARDING_IDS = [
  'week_01', 'week_02', 'week_03', 'week_04', 'week_05',
  'week_06', 'week_07', 'week_08', 'week_09', 'week_10',
  'week_11', 'week_12', 'week_16', 'week_20', 'week_25',
  'week_30', 'week_38', 'week_52',
] as const

function sentLabel(id: string): string {
  return id.replace('day_', 'D').replace('week_', 'W')
}

export default async function EmailLogPage() {
  const supabase = createAdminClient()

  // Fetch all orgs
  const { data: orgs } = await supabase
    .from('organisations')
    .select('id, name, trial_expires_at, subscribed_at, is_tester')
    .order('created_at', { ascending: false })

  // Fetch all trial + onboarding log entries
  const { data: logs } = await supabase
    .from('notification_log')
    .select('organisation_id, notification_type, entity_id, sent_at, recipient_email')
    .in('notification_type', ['trial_day', 'onboarding_week'])
    .order('sent_at', { ascending: true })

  // Build lookup: orgId → Set of entity_ids sent + recipient email
  const trialSent: Record<string, Set<string>>      = {}
  const onboardingSent: Record<string, Set<string>> = {}
  const orgEmail: Record<string, string>            = {}

  for (const log of logs ?? []) {
    orgEmail[log.organisation_id] = log.recipient_email
    if (log.notification_type === 'trial_day') {
      if (!trialSent[log.organisation_id]) trialSent[log.organisation_id] = new Set()
      trialSent[log.organisation_id].add(log.entity_id)
    } else if (log.notification_type === 'onboarding_week') {
      if (!onboardingSent[log.organisation_id]) onboardingSent[log.organisation_id] = new Set()
      onboardingSent[log.organisation_id].add(log.entity_id)
    }
  }

  // Only show orgs that have at least one log entry
  const activeOrgIds = new Set([
    ...Object.keys(trialSent),
    ...Object.keys(onboardingSent),
  ])

  const activeOrgs = (orgs ?? []).filter(o => activeOrgIds.has(o.id))

  const totalOrgs  = activeOrgs.length
  const totalSent  = (logs ?? []).length

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-ink">Email Log</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
            {totalOrgs} org{totalOrgs !== 1 ? 's' : ''}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {totalSent} emails sent
          </span>
        </div>
        <p className="text-sm text-ink-muted">
          Trial and onboarding email progress for each organisation. Only orgs with at least one sent email appear here.
        </p>
      </div>

      {activeOrgs.length === 0 ? (
        <p className="text-ink-muted text-sm">No emails sent yet.</p>
      ) : (
        <div className="space-y-10">
          {activeOrgs.map(org => {
            const trial      = trialSent[org.id]      ?? new Set()
            const onboarding = onboardingSent[org.id] ?? new Set()
            const trialCount = TRIAL_IDS.filter(id => trial.has(id)).length
            const obCount    = ONBOARDING_IDS.filter(id => onboarding.has(id)).length

            const status = org.subscribed_at
              ? 'Subscriber'
              : org.trial_expires_at
                ? new Date(org.trial_expires_at) > new Date() ? 'Trial' : 'Expired'
                : 'No trial'

            const statusColour = status === 'Subscriber'
              ? 'bg-teal-100 text-teal-700'
              : status === 'Trial'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-500'

            return (
              <div key={org.id} className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
                {/* Org header */}
                <div className="px-5 py-4 border-b border-line bg-fill flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-ink">{org.name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColour}`}>
                    {status}
                  </span>
                  {org.is_tester && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      Tester
                    </span>
                  )}
                  <span className="text-xs text-ink-muted ml-auto">{orgEmail[org.id] ?? ''}</span>
                </div>

                <div className="px-5 py-4 space-y-5">
                  {/* Trial emails */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                        Trial emails
                      </p>
                      <span className="text-xs text-ink-muted">
                        {trialCount}/{TRIAL_IDS.length} sent
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TRIAL_IDS.map(id => {
                        const sent = trial.has(id)
                        return (
                          <span
                            key={id}
                            title={sent ? `${id} — sent` : `${id} — not sent`}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              sent
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : 'bg-gray-50 text-gray-400 border-gray-200'
                            }`}
                          >
                            {sent ? '✓ ' : ''}{sentLabel(id)}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Onboarding emails */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                        Onboarding emails
                      </p>
                      <span className="text-xs text-ink-muted">
                        {obCount}/{ONBOARDING_IDS.length} sent
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ONBOARDING_IDS.map(id => {
                        const sent = onboarding.has(id)
                        return (
                          <span
                            key={id}
                            title={sent ? `${id} — sent` : `${id} — not sent`}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              sent
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-gray-50 text-gray-400 border-gray-200'
                            }`}
                          >
                            {sent ? '✓ ' : ''}{sentLabel(id)}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
