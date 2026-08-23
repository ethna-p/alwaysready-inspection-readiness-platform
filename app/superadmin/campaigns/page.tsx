/**
 * /superadmin/campaigns
 *
 * Direct marketing campaign management.
 * - Create and manage campaigns
 * - View opt-out suppression list
 */

import Link                 from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import CreateCampaignForm   from './CreateCampaignForm'
import DeleteCampaignButton from './DeleteCampaignButton'
import AddSuppressionForm   from './AddSuppressionForm'
import DeleteSuppressionButton from './DeleteSuppressionButton'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  draft:  'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-slate-100 text-slate-600',
}

export default async function CampaignsPage() {
  const supabase = createAdminClient()

  const { data: campaigns } = await supabase
    .from('marketing_campaigns')
    .select('id, name, description, status, created_at')
    .order('created_at', { ascending: false })

  // Contact counts per campaign
  const { data: contactCounts } = await supabase
    .from('campaign_contacts')
    .select('campaign_id')

  const contactCountMap: Record<string, number> = {}
  for (const row of contactCounts ?? []) {
    contactCountMap[row.campaign_id] = (contactCountMap[row.campaign_id] ?? 0) + 1
  }

  const { data: suppressions } = await supabase
    .from('marketing_suppressions')
    .select('id, location_name, postcode, email, source, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Campaigns</h1>
        <p className="text-sm text-ink-muted">
          Direct marketing campaigns — track who you've contacted and manage opt-outs.
        </p>
      </div>

      {/* ── Create campaign ──────────────────────────────────────────────── */}
      <div className="mb-10 p-5 bg-card border border-line rounded-xl">
        <h2 className="text-sm font-semibold text-ink mb-4">New campaign</h2>
        <CreateCampaignForm />
      </div>

      {/* ── Campaign list ────────────────────────────────────────────────── */}
      <div className="mb-12">
        {!campaigns || campaigns.length === 0 ? (
          <p className="text-sm text-ink-muted">No campaigns yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {campaigns.map(c => (
              <div key={c.id} className="bg-card border border-line rounded-xl p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/superadmin/campaigns/${c.id}`}
                      className="font-semibold text-ink hover:text-brand transition-colors"
                    >
                      {c.name}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status] ?? ''}`}>
                      {c.status}
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-sm text-ink-muted mb-1">{c.description}</p>
                  )}
                  <p className="text-xs text-ink-muted">
                    {contactCountMap[c.id] ?? 0} contact{(contactCountMap[c.id] ?? 0) !== 1 ? 's' : ''} ·{' '}
                    Created {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/superadmin/campaigns/${c.id}`}
                    className="text-xs px-3 py-1.5 rounded-lg border border-line bg-fill text-ink hover:bg-line transition-colors"
                  >
                    View contacts
                  </Link>
                  <DeleteCampaignButton id={c.id} name={c.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Suppression list ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Opt-out suppression list</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              {suppressions?.length ?? 0} record{(suppressions?.length ?? 0) !== 1 ? 's' : ''} — never contact these providers again.
            </p>
          </div>
        </div>

        <div className="mb-6 p-5 bg-card border border-line rounded-xl">
          <h3 className="text-sm font-semibold text-ink mb-3">Add manual opt-out</h3>
          <AddSuppressionForm />
        </div>

        {!suppressions || suppressions.length === 0 ? (
          <p className="text-sm text-ink-muted">No opt-outs recorded yet.</p>
        ) : (
          <div className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-fill">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Service name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Postcode</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {suppressions.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 1 ? 'bg-fill' : ''}>
                    <td className="px-5 py-3 font-medium text-ink">{s.location_name}</td>
                    <td className="px-5 py-3 text-ink-muted">{s.postcode ?? '—'}</td>
                    <td className="px-5 py-3 text-ink-muted">{s.email ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        s.source === 'optout_form' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.source === 'optout_form' ? 'Web form' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted text-xs">
                      {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DeleteSuppressionButton id={s.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
