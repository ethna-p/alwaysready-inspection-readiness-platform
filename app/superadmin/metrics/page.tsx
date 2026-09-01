/**
 * /superadmin/metrics — operational health dashboard.
 *
 * Covers:
 *   - Org growth and conversion
 *   - Evidence and KLOE coverage
 *   - Notifications
 *   - HR (DBS, training)
 *
 * All queries run server-side via the admin Supabase client.
 * No raw SQL — queries are composed with the JS client and aggregated in JS.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ─── helpers ──────────────────────────────────────────────────────────────────

function startOfWeek(date: Date): string {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1) // Monday
  return d.toISOString().slice(0, 10)
}

function startOfMonth(date: Date): string {
  return date.toISOString().slice(0, 7) // "YYYY-MM"
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function MetricsPage() {
  const supabase = createAdminClient()

  // ── 1. Orgs ────────────────────────────────────────────────────────────────
  const { data: allOrgs } = await supabase
    .from('organisations')
    .select('id, name, created_at, subscribed_at, trial_expires_at, subscription_tier, is_beta, is_tester, cqc_rating')
    .order('created_at', { ascending: false })

  const orgs = allOrgs ?? []

  // Signups by week (last 12 weeks)
  const twelveWeeksAgo = daysAgo(84)
  const recentOrgs = orgs.filter(o => o.created_at >= twelveWeeksAgo)
  const byWeek: Record<string, number> = {}
  for (const o of recentOrgs) {
    const w = startOfWeek(new Date(o.created_at))
    byWeek[w] = (byWeek[w] ?? 0) + 1
  }
  const signupsByWeek = Object.entries(byWeek)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12)

  // Conversion by month (last 6 months)
  const sixMonthsAgo = daysAgo(180)
  const recentForConversion = orgs.filter(o => o.created_at >= sixMonthsAgo)
  const byMonth: Record<string, { total: number; converted: number; daysSum: number; daysCount: number }> = {}
  for (const o of recentForConversion) {
    const m = startOfMonth(new Date(o.created_at))
    if (!byMonth[m]) byMonth[m] = { total: 0, converted: 0, daysSum: 0, daysCount: 0 }
    byMonth[m].total++
    if (o.subscribed_at) {
      byMonth[m].converted++
      const days = (new Date(o.subscribed_at).getTime() - new Date(o.created_at).getTime()) / 86400000
      byMonth[m].daysSum += days
      byMonth[m].daysCount++
    }
  }
  const conversionByMonth = Object.entries(byMonth)
    .sort(([a], [b]) => b.localeCompare(a))

  // Active subscribers
  const activeSubscribers = orgs.filter(o => o.subscribed_at)

  // Subscription health
  const now = new Date().toISOString()
  const health = {
    paid: orgs.filter(o => o.subscribed_at).length,
    activeTrial: orgs.filter(o => !o.subscribed_at && o.trial_expires_at && o.trial_expires_at >= now).length,
    expiredTrial: orgs.filter(o => !o.subscribed_at && o.trial_expires_at && o.trial_expires_at < now).length,
  }

  // ── 2. Evidence uploads by org ──────────────────────────────────────────────
  const { data: evidence } = await supabase
    .from('kloe_evidence')
    .select('organisation_id, uploaded_at')

  const evidenceByOrg: Record<string, { count: number; last: string }> = {}
  for (const e of evidence ?? []) {
    if (!evidenceByOrg[e.organisation_id]) {
      evidenceByOrg[e.organisation_id] = { count: 0, last: '' }
    }
    evidenceByOrg[e.organisation_id].count++
    if (e.uploaded_at > evidenceByOrg[e.organisation_id].last) {
      evidenceByOrg[e.organisation_id].last = e.uploaded_at
    }
  }
  const evidenceRows = activeSubscribers
    .map(o => ({
      name: o.name,
      count: evidenceByOrg[o.id]?.count ?? 0,
      last: evidenceByOrg[o.id]?.last ?? null,
    }))
    .sort((a, b) => b.count - a.count)

  // ── 3. Notifications ────────────────────────────────────────────────────────
  const thirtyDaysAgo = daysAgo(30)
  const { data: notifLogs } = await supabase
    .from('notification_log')
    .select('notification_type, entity_type, organisation_id, sent_at')
    .gte('sent_at', thirtyDaysAgo)

  const notifByType: Record<string, { count: number; orgs: Set<string>; last: string }> = {}
  for (const n of notifLogs ?? []) {
    const key = `${n.notification_type}::${n.entity_type ?? ''}`
    if (!notifByType[key]) notifByType[key] = { count: 0, orgs: new Set(), last: '' }
    notifByType[key].count++
    notifByType[key].orgs.add(n.organisation_id)
    if (n.sent_at > notifByType[key].last) notifByType[key].last = n.sent_at
  }
  const notifRows = Object.entries(notifByType)
    .map(([key, v]) => {
      const [type, entity] = key.split('::')
      return { type, entity: entity || '—', count: v.count, orgs: v.orgs.size, last: v.last }
    })
    .sort((a, b) => b.count - a.count)

  // ── 4. HR ───────────────────────────────────────────────────────────────────

  // DBS checks expiring in 60 days
  const in60 = daysFromNow(60)
  const todayStr = today()
  const { data: staffProfiles } = await supabase
    .from('hr_staff_profiles')
    .select('organisation_id, job_title, dbs_next_review_due, employment_status')
    .eq('employment_status', 'active')
    .not('dbs_next_review_due', 'is', null)
    .lte('dbs_next_review_due', in60)
    .order('dbs_next_review_due', { ascending: true })

  const orgById = Object.fromEntries(orgs.map(o => [o.id, o.name]))

  const dbsRows = (staffProfiles ?? []).map(sp => ({
    org: orgById[sp.organisation_id] ?? sp.organisation_id,
    jobTitle: sp.job_title ?? '—',
    due: sp.dbs_next_review_due as string,
    daysLeft: Math.ceil((new Date(sp.dbs_next_review_due!).getTime() - new Date(todayStr).getTime()) / 86400000),
  }))

  // Training completions (last 90 days)
  const ninetyDaysAgo = daysAgo(90)
  const { data: trainingRecords } = await supabase
    .from('hr_training_records')
    .select('training_type_id, user_id, date_completed, organisation_id')
    .gte('date_completed', ninetyDaysAgo.slice(0, 10))

  const { data: trainingTypes } = await supabase
    .from('hr_training_types')
    .select('id, name')

  const typeNameById = Object.fromEntries((trainingTypes ?? []).map(t => [t.id, t.name]))
  const completionsByType: Record<string, { count: number; staffSet: Set<string> }> = {}
  for (const r of trainingRecords ?? []) {
    const name = typeNameById[r.training_type_id] ?? r.training_type_id
    if (!completionsByType[name]) completionsByType[name] = { count: 0, staffSet: new Set() }
    completionsByType[name].count++
    completionsByType[name].staffSet.add(r.user_id)
  }
  const completionRows = Object.entries(completionsByType)
    .map(([name, v]) => ({ name, completions: v.count, staff: v.staffSet.size }))
    .sort((a, b) => b.completions - a.completions)

  // Training records without certificates
  const { data: allTraining } = await supabase
    .from('hr_training_records')
    .select('id, organisation_id, training_type_id')

  const { data: certs } = await supabase
    .from('hr_training_certificates')
    .select('training_record_id')

  const certSet = new Set((certs ?? []).map(c => c.training_record_id))
  const noCertByOrgType: Record<string, number> = {}
  for (const r of allTraining ?? []) {
    if (!certSet.has(r.id)) {
      const key = `${orgById[r.organisation_id] ?? r.organisation_id} — ${typeNameById[r.training_type_id] ?? '?'}`
      noCertByOrgType[key] = (noCertByOrgType[key] ?? 0) + 1
    }
  }
  const noCertRows = Object.entries(noCertByOrgType)
    .map(([key, count]) => { const [org, type] = key.split(' — '); return { org, type, count } })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // ─── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-ink">Metrics</h1>
        <p className="text-sm text-ink-muted mt-1">Operational health — refreshed on every page load.</p>
      </div>

      {/* ── Subscription health ── */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-4">Subscription health</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Paid subscribers', value: health.paid, colour: 'text-teal-700 bg-teal-50 border-teal-200' },
            { label: 'Active trials', value: health.activeTrial, colour: 'text-amber-700 bg-amber-50 border-amber-200' },
            { label: 'Expired trials', value: health.expiredTrial, colour: 'text-gray-600 bg-gray-50 border-gray-200' },
          ].map(({ label, value, colour }) => (
            <div key={label} className={`rounded-xl border p-5 ${colour}`}>
              <div className="text-3xl font-bold">{value}</div>
              <div className="text-sm mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trial signups by week ── */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-4">Trial signups — last 12 weeks</h2>
        <div className="bg-card border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-fill text-ink-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Week starting</th>
                <th className="px-4 py-3 text-right">Signups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {signupsByWeek.length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-4 text-ink-muted">No data.</td></tr>
              ) : signupsByWeek.map(([week, count]) => (
                <tr key={week}>
                  <td className="px-4 py-3 text-ink">{week}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Trial to paid conversion ── */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-4">Trial to paid conversion — last 6 months</h2>
        <div className="bg-card border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-fill text-ink-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Month</th>
                <th className="px-4 py-3 text-right">Trials</th>
                <th className="px-4 py-3 text-right">Converted</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Avg days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {conversionByMonth.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-ink-muted">No data.</td></tr>
              ) : conversionByMonth.map(([month, v]) => (
                <tr key={month}>
                  <td className="px-4 py-3 text-ink">{month}</td>
                  <td className="px-4 py-3 text-right">{v.total}</td>
                  <td className="px-4 py-3 text-right">{v.converted}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {v.total > 0 ? `${((v.converted / v.total) * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-muted">
                    {v.daysCount > 0 ? (v.daysSum / v.daysCount).toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Active subscribers ── */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-4">
          Active subscribers
          <span className="ml-2 text-xs font-normal text-ink-muted">({activeSubscribers.length})</span>
        </h2>
        <div className="bg-card border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-fill text-ink-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Organisation</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-left">Subscribed</th>
                <th className="px-4 py-3 text-left">CQC rating</th>
                <th className="px-4 py-3 text-left">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {activeSubscribers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-ink-muted">No active subscribers yet.</td></tr>
              ) : activeSubscribers.map(o => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-ink">{o.name}</td>
                  <td className="px-4 py-3 text-ink-muted capitalize">{o.subscription_tier ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{o.subscribed_at ? o.subscribed_at.slice(0, 10) : '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{o.cqc_rating ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {o.is_beta && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Beta</span>}
                      {o.is_tester && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">Tester</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Evidence uploads ── */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-4">Evidence uploads by org</h2>
        <div className="bg-card border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-fill text-ink-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Organisation</th>
                <th className="px-4 py-3 text-right">Total uploads</th>
                <th className="px-4 py-3 text-left">Last upload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {evidenceRows.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-4 text-ink-muted">No evidence uploaded yet.</td></tr>
              ) : evidenceRows.map(r => (
                <tr key={r.name}>
                  <td className="px-4 py-3 text-ink">{r.name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{r.count}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.last ? r.last.slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Notifications ── */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-4">Notifications sent — last 30 days</h2>
        <div className="bg-card border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-fill text-ink-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Entity</th>
                <th className="px-4 py-3 text-right">Sent</th>
                <th className="px-4 py-3 text-right">Orgs</th>
                <th className="px-4 py-3 text-left">Most recent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {notifRows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-ink-muted">No notifications in the last 30 days.</td></tr>
              ) : notifRows.map(r => (
                <tr key={`${r.type}-${r.entity}`}>
                  <td className="px-4 py-3 font-medium text-ink">{r.type}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.entity}</td>
                  <td className="px-4 py-3 text-right">{r.count}</td>
                  <td className="px-4 py-3 text-right">{r.orgs}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.last.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── DBS checks expiring ── */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-4">DBS checks expiring in 60 days</h2>
        {dbsRows.length === 0 ? (
          <p className="text-sm text-ink-muted">No DBS checks due within 60 days.</p>
        ) : (
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-fill text-ink-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Organisation</th>
                  <th className="px-4 py-3 text-left">Job title</th>
                  <th className="px-4 py-3 text-left">Due date</th>
                  <th className="px-4 py-3 text-right">Days left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {dbsRows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-ink">{r.org}</td>
                    <td className="px-4 py-3 text-ink-muted">{r.jobTitle}</td>
                    <td className="px-4 py-3 text-ink-muted">{r.due}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${r.daysLeft <= 14 ? 'text-red-600' : 'text-amber-600'}`}>
                      {r.daysLeft}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Training completions ── */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-4">Training completions — last 90 days</h2>
        {completionRows.length === 0 ? (
          <p className="text-sm text-ink-muted">No training completed in the last 90 days.</p>
        ) : (
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-fill text-ink-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Training type</th>
                  <th className="px-4 py-3 text-right">Completions</th>
                  <th className="px-4 py-3 text-right">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {completionRows.map(r => (
                  <tr key={r.name}>
                    <td className="px-4 py-3 text-ink">{r.name}</td>
                    <td className="px-4 py-3 text-right">{r.completions}</td>
                    <td className="px-4 py-3 text-right text-ink-muted">{r.staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Training without certificate ── */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-4">Training records without certificate</h2>
        {noCertRows.length === 0 ? (
          <p className="text-sm text-ink-muted">All training records have a certificate uploaded.</p>
        ) : (
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-fill text-ink-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Organisation</th>
                  <th className="px-4 py-3 text-left">Training type</th>
                  <th className="px-4 py-3 text-right">Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {noCertRows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-ink">{r.org}</td>
                    <td className="px-4 py-3 text-ink-muted">{r.type}</td>
                    <td className="px-4 py-3 text-right">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
