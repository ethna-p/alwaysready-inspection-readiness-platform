/**
 * /superadmin/leads — warm leads from the alwaysready.uk/waitlist form.
 * These are people who have actively requested to be notified at launch.
 */

import { createAdminClient }          from '@/lib/supabase/admin'
import DeleteLeadButton               from './DeleteLeadButton'
import DeleteSubscriberButton          from './DeleteSubscriberButton'
import BulkSendLaunchEmailButton      from './BulkSendLaunchEmailButton'
import AddZeegBookingForm             from './AddZeegBookingForm'
import EditScheduledAtButton          from './EditScheduledAtButton'
import DeletePipelineRowButton        from './DeletePipelineRowButton'
import { matchLeadsToBookings }       from '@/lib/leads-pipeline'

export const dynamic = 'force-dynamic'

export default async function SuperadminLeadsPage() {
  const supabase = createAdminClient()

  const { data: leads } = await supabase
    .from('waitlist_leads')
    .select('id, first_name, last_name, email, marketing_opt_in, nurture_opt_in, created_at')
    .order('created_at', { ascending: false })

  const { data: demoLeads } = await supabase
    .from('demo_leads')
    .select('id, service_type, cqc_rating, demo_type, email, name, created_at')
    .order('created_at', { ascending: false })

  const { data: zeegBookings } = await supabase
    .from('zeeg_bookings')
    .select('id, invitee_email, invitee_name, demo_type, booked_at, scheduled_at, cancelled, created_at')
    .order('created_at', { ascending: false })

  // Build unified rows: a lead and a booking are paired when they share an email, and when one email
  // appears on several leads the name and demo type decide which booking goes with which lead
  // (see lib/leads-pipeline.ts).
  const bookingById = new Map((zeegBookings ?? []).map(b => [b.id, b]))
  const bookingForLead = matchLeadsToBookings(
    (demoLeads ?? []).map(l => ({ id: l.id, email: l.email, name: l.name, demo_type: l.demo_type })),
    (zeegBookings ?? []).map(b => ({ id: b.id, invitee_email: b.invitee_email, invitee_name: b.invitee_name, demo_type: b.demo_type })),
  )
  const matchedZeegIds = new Set<string>(bookingForLead.values())

  const leadRows = (demoLeads ?? []).map(lead => {
    const zeegId = bookingForLead.get(lead.id)
    const zeeg = zeegId ? bookingById.get(zeegId) ?? null : null
    return {
      key:            `lead-${lead.id}`,
      demo_lead_id:   lead.id,
      zeeg_booking_id: zeeg?.id ?? null,
      name:           lead.name ?? zeeg?.invitee_name ?? null,
      email:          lead.email ?? zeeg?.invitee_email ?? null,
      demo_type:      lead.demo_type,
      service_type:   lead.service_type,
      cqc_rating:     lead.cqc_rating ?? null,
      scheduled_at:   zeeg?.scheduled_at ?? null,
    }
  })

  const unmatchedZeegRows = (zeegBookings ?? [])
    .filter(b => !matchedZeegIds.has(b.id))
    .map(b => ({
      key:            `zeeg-${b.id}`,
      demo_lead_id:   null,
      zeeg_booking_id: b.id,
      name:           b.invitee_name ?? null,
      email:          b.invitee_email ?? null,
      demo_type:      b.demo_type,
      service_type:   null,
      cqc_rating:     null,
      scheduled_at:   b.scheduled_at ?? null,
    }))

  const unifiedRows = [...leadRows, ...unmatchedZeegRows]

  const { data: blogSubscribers } = await supabase
    .from('blog_subscribers')
    .select('id, email, full_name, source, subscribed_at, unsubscribed_at')
    .order('subscribed_at', { ascending: false })

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

      {/* ── Demo Pipeline ───────────────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-bold text-ink">Demo Pipeline</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">
            {unifiedRows.length} {unifiedRows.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <AddZeegBookingForm />

        <p className="text-sm text-ink-muted mb-4">
          All demo leads and Zeeg bookings. Rows with both intake data and a booking are fully matched by email.
        </p>


        {unifiedRows.length === 0 ? (
          <p className="text-ink-muted text-sm">No entries yet.</p>
        ) : (
          <div className="bg-card border border-line rounded-xl overflow-hidden shadow-sm mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-fill">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Demo type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Service type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">CQC rating</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Scheduled for</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {unifiedRows.map(row => {
                  const scheduledAt = row.scheduled_at
                    ? new Date(row.scheduled_at).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : null
                  const demoType = row.demo_type
                  return (
                    <tr key={row.key} className="hover:bg-fill transition-colors">
                      <td className="px-5 py-3.5 font-medium text-ink">
                        {row.name ?? <span className="text-ink-subtle">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted text-xs">
                        {row.email ?? <span className="text-ink-subtle">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {demoType ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            demoType === '15min' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                          }`}>
                            {demoType === '15min' ? '15 min' : '30 min'}
                          </span>
                        ) : <span className="text-ink-subtle">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-ink">{row.service_type ?? <span className="text-ink-subtle">—</span>}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{row.cqc_rating ?? <span className="text-ink-subtle">—</span>}</td>
                      <td className="px-5 py-3.5 text-ink-muted text-xs">
                        <span className="inline-flex items-center">
                          {scheduledAt ?? <span className="text-ink-subtle">—</span>}
                          {row.zeeg_booking_id && (
                            <EditScheduledAtButton
                              zeegBookingId={row.zeeg_booking_id}
                              currentValue={row.scheduled_at}
                            />
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <DeletePipelineRowButton demoLeadId={row.demo_lead_id} zeegBookingId={row.zeeg_booking_id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Blog subscribers ────────────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-bold text-ink">Blog Subscribers</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
            {blogSubscribers?.filter(s => !s.unsubscribed_at).length ?? 0} active
          </span>
          {(blogSubscribers?.length ?? 0) > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              {blogSubscribers?.length ?? 0} total
            </span>
          )}
        </div>
        <p className="text-sm text-ink-muted mb-6">
          People who signed up for the blog newsletter at alwaysready.uk. Separate consent from platform marketing.
        </p>

        {!blogSubscribers || blogSubscribers.length === 0 ? (
          <p className="text-ink-muted text-sm">No blog subscribers yet.</p>
        ) : (
          <div className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-fill">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Subscribed</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {blogSubscribers.map(sub => {
                  const subscribedDate = new Date(sub.subscribed_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                  return (
                    <tr key={sub.id} className="hover:bg-fill transition-colors">
                      <td className="px-5 py-3.5 font-medium text-ink">{sub.full_name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-ink-muted">
                        <a
                          href={`mailto:${sub.email}`}
                          className="hover:text-brand transition-colors"
                        >
                          {sub.email}
                        </a>
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted text-xs">{sub.source}</td>
                      <td className="px-5 py-3.5 text-ink-muted text-xs">{subscribedDate}</td>
                      <td className="px-5 py-3.5">
                        {sub.unsubscribed_at ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            Unsubscribed
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <DeleteSubscriberButton id={sub.id} />
                      </td>
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
