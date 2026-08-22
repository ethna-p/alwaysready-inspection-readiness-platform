/**
 * /superadmin/campaigns/[id]
 *
 * Campaign detail — contacts list with opt-out status, add contact form,
 * mark as contacted, and campaign status management.
 */

import Link                    from 'next/link'
import { notFound }            from 'next/navigation'
import { createAdminClient }   from '@/lib/supabase/admin'
import AddContactForm           from './AddContactForm'
import MarkContactedButton      from './MarkContactedButton'
import DeleteContactButton      from './DeleteContactButton'
import CampaignStatusSelect     from './CampaignStatusSelect'
import type { MarketingCampaign, CampaignContact } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  draft:  'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-slate-100 text-slate-600',
}

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createAdminClient()

  const { data: campaign } = await (supabase as any)
    .from('marketing_campaigns')
    .select('id, name, description, status, created_at')
    .eq('id', params.id)
    .single() as { data: MarketingCampaign | null }

  if (!campaign) notFound()

  const { data: contacts } = await (supabase as any)
    .from('campaign_contacts')
    .select('id, location_id, location_name, provider_name, street_address, city, postcode, region, service_type, cqc_profile_url, contact_method, contacted_at, notes, suppressed_at, created_at')
    .eq('campaign_id', params.id)
    .order('created_at', { ascending: false }) as { data: CampaignContact[] | null }

  const total       = contacts?.length ?? 0
  const contacted   = contacts?.filter(c => c.contacted_at).length ?? 0
  const suppressed  = contacts?.filter(c => c.suppressed_at).length ?? 0
  const pending     = total - contacted

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-ink-muted">
        <Link href="/superadmin/campaigns" className="hover:text-brand transition-colors">Campaigns</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{campaign.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-ink">{campaign.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[campaign.status] ?? ''}`}>
              {campaign.status}
            </span>
          </div>
          {campaign.description && (
            <p className="text-sm text-ink-muted">{campaign.description}</p>
          )}
        </div>
        <CampaignStatusSelect id={campaign.id} currentStatus={campaign.status as 'draft' | 'active' | 'closed'} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total contacts', value: total },
          { label: 'Letter sent', value: contacted, colour: 'text-green-700' },
          { label: 'Awaiting send', value: pending, colour: 'text-amber-700' },
          { label: 'Opted out', value: suppressed, colour: 'text-red-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-line rounded-xl p-4">
            <p className="text-xs text-ink-muted mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.colour ?? 'text-ink'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Add contact */}
      <div className="mb-10 p-5 bg-card border border-line rounded-xl">
        <h2 className="text-sm font-semibold text-ink mb-4">Add contact</h2>
        <AddContactForm campaignId={campaign.id} />
      </div>

      {/* Contacts table */}
      {!contacts || contacts.length === 0 ? (
        <p className="text-sm text-ink-muted">No contacts added yet.</p>
      ) : (
        <div className="bg-card border border-line rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-fill">
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Service</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Address</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Region</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Letter sent</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => (
                <tr key={c.id} className={i % 2 === 1 ? 'bg-fill' : ''}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink leading-tight">
                      {c.cqc_profile_url ? (
                        <a href={c.cqc_profile_url} target="_blank" rel="noopener noreferrer"
                          className="hover:text-brand transition-colors">
                          {c.location_name}
                        </a>
                      ) : c.location_name}
                    </div>
                    {c.provider_name && c.provider_name !== c.location_name && (
                      <div className="text-xs text-ink-muted">{c.provider_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted text-xs">
                    {[c.street_address, c.city, c.postcode].filter(Boolean).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-ink-muted text-xs">{c.region ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{c.service_type ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.suppressed_at ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">Opted out</span>
                    ) : c.contacted_at ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">Sent</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {c.contacted_at
                      ? new Date(c.contacted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!c.contacted_at && !c.suppressed_at && (
                        <MarkContactedButton contactId={c.id} campaignId={campaign.id} />
                      )}
                      <DeleteContactButton contactId={c.id} campaignId={campaign.id} name={c.location_name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
