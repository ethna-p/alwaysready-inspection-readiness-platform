/**
 * /superadmin/leads — warm leads from the alwaysready.uk/waitlist form.
 * These are people who have actively requested to be notified at launch.
 */

import { createAdminClient }          from '@/lib/supabase/admin'
import DeleteLeadButton               from './DeleteLeadButton'
import BulkSendLaunchEmailButton      from './BulkSendLaunchEmailButton'

export const dynamic = 'force-dynamic'

export default async function SuperadminLeadsPage() {
  const supabase = createAdminClient()

  const { data: leads } = await supabase
    .from('waitlist_leads')
    .select('id, first_name, last_name, email, marketing_opt_in, nurture_opt_in, created_at')
    .order('created_at', { ascending: false })

  const { data: demoLeads } = await supabase
    .from('demo_leads')
    .select('id, service_type, cqc_rating, demo_type, created_at')
    .order('created_at', { ascending: false })

  const nurtureCount = leads?.filter(l => l.nurture_opt_in).length ?? 0

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-ink">Warm Leads</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
            {leads?.length ?? 0} on waitlist
          </span>
        </div>
        <p className="text-sm text-ink-muted">
          People who signed up at alwaysready.uk/waitlist. Contact these first when you launch.
        </p>
      </div>

      {/* ── Event-triggered bulk emails ────────────────────────────────────── */}
      <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-xl">
        <h2 className="text-sm font-semibold text-amber-800 mb-1">Event-triggered emails</h2>
        <p className="text-xs text-amber-700 mb-4">
          Send these when the event happens — not before. They go to all {nurtureCount} nurture subscriber{nurtureCount !== 1 ? 's' : ''}.
          Each button requires confirmation before sending.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <BulkSendLaunchEmailButton
            emailNum={9}
            label="Send framework email (Email 9)"
            description="Send when CQC publishes the new framework date"
            count={nurtureCount}
          />
          <BulkSendLaunchEmailButton
            emailNum={10}
            label="Send launch email (Email 10)"
            description="Send when AlwaysReady opens to new customers"
            count={nurtureCount}
          />
        </div>
      </div>

      {!leads || leads.length === 0 ? (
        <p className="text-ink-muted text-sm">No leads yet.</p>
      ) : (
        <div className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-fill">
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Nurture</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Blog</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Signed up</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map(lead => {
                const date = new Date(lead.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                return (
                  <tr key={lead.id} className="hover:bg-fill transition-colors">
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {[lead.first_name, lead.last_name].filter(Boolean).join(' ')}
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted">
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:text-brand transition-colors"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.nurture_opt_in ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.marketing_opt_in ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted text-xs">{date}</td>
                    <td className="px-5 py-3.5 text-right">
                      <DeleteLeadButton id={lead.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Demo leads ──────────────────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-bold text-ink">Demo Bookings</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">
            {demoLeads?.length ?? 0} total
          </span>
        </div>
        <p className="text-sm text-ink-muted mb-6">
          Pre-booking intake data collected before visitors reach the Zeeg scheduler.
        </p>

        {!demoLeads || demoLeads.length === 0 ? (
          <p className="text-ink-muted text-sm">No demo bookings yet.</p>
        ) : (
          <div className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-fill">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Demo type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Service type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">CQC rating</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {demoLeads.map(lead => {
                  const date = new Date(lead.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                  return (
                    <tr key={lead.id} className="hover:bg-fill transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          lead.demo_type === '15min'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}>
                          {lead.demo_type === '15min' ? '15 min' : '30 min'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-ink">{lead.service_type}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{lead.cqc_rating ?? '—'}</td>
                      <td className="px-5 py-3.5 text-ink-muted text-xs">{date}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
