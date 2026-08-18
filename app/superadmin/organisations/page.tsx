/**
 * /superadmin/organisations — list of all provisioned orgs with impersonation.
 *
 * Protected by proxy.ts: only SUPERADMIN_EMAIL may access this route.
 * Uses the service-role admin client to bypass RLS.
 *
 * "View as admin →" generates a one-time magic link for the org's admin user
 * and opens it in a new tab, leaving your superadmin session intact.
 */
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import ImpersonateButton from './ImpersonateButton'
import CharityToggleButton from './CharityToggleButton'
import DeleteOrgButton from './DeleteOrgButton'

type OrgListItem = {
  id: string; name: string; subscription_tier: string
  trial_expires_at: string | null; created_at: string
  is_beta: boolean; is_charity: boolean; charity_number: string | null
  service_types: { name: string } | null
}

const TIER_STYLES: Record<string, string> = {
  trial:     'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  expired:   'bg-fill-dim text-ink-muted',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function trialStatus(expiresAt: string | null): { label: string; urgent: boolean } {
  if (!expiresAt) return { label: '', urgent: false }
  const daysLeft = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (daysLeft < 0) return { label: 'Trial expired', urgent: true }
  if (daysLeft === 0) return { label: 'Trial expires today', urgent: true }
  if (daysLeft <= 3) return { label: `${daysLeft}d left`, urgent: true }
  return { label: `${daysLeft}d left`, urgent: false }
}

export default async function OrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'all' } = await searchParams
  const supabase = createAdminClient()

  // ── 1. Fetch all organisations ─────────────────────────────────────────
  const { data: orgsRaw, error: orgsError } = await supabase
    .from('organisations')
    .select(`
      id, name, subscription_tier, trial_expires_at, created_at, is_beta, is_charity, charity_number,
      service_types ( name )
    `)
    .order('created_at', { ascending: false })
  const orgs = orgsRaw as OrgListItem[] | null

  if (orgsError) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700">
        <strong>Error loading organisations:</strong> {orgsError.message}
      </div>
    )
  }

  // ── 2. Apply filter ────────────────────────────────────────────────────
  const isDemo = (o: OrgListItem) => o.name.startsWith('Demo —')
  const filtered = (orgs ?? [])
    .filter(o =>
      filter === 'demo' ? isDemo(o) :
      filter === 'real' ? !isDemo(o) :
      true
    )
    .sort((a, b) =>
      filter === 'demo' ? a.name.localeCompare(b.name) : 0
    )

  // ── 3. Fetch admin users for those orgs ────────────────────────────────
  const orgIds = filtered.map(o => o.id)

  const { data: admins } = orgIds.length > 0
    ? await supabase
        .from('users')
        .select('id, full_name, email, organisation_id')
        .in('organisation_id', orgIds)
        .eq('role', 'admin')
    : { data: [] }

  // Build a lookup: orgId → first admin found
  const adminByOrg: Record<string, { id: string; full_name: string | null; email: string }> = {}
  for (const a of admins ?? []) {
    if (!adminByOrg[a.organisation_id]) {
      adminByOrg[a.organisation_id] = a
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Organisations</h1>
        <p className="text-sm text-ink-muted">
          All provisioned organisations.{' '}
          <span className="font-medium">"View as admin"</span> opens their dashboard in a new tab — your superadmin session stays open here.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(['all', 'real', 'demo'] as const).map(f => (
          <Link
            key={f}
            href={f === 'all' ? '/superadmin/organisations' : `/superadmin/organisations?filter=${f}`}
            className={`
              px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === f || (f === 'all' && filter !== 'real' && filter !== 'demo')
                ? 'bg-[#014D4E] text-white'
                : 'bg-card border border-line text-ink-muted hover:text-ink'}
            `}
          >
            {f === 'all' ? `All (${(orgs ?? []).length})` :
             f === 'real' ? `Real (${(orgs ?? []).filter(o => !o.name.startsWith('Demo —')).length})` :
             `Demo (${(orgs ?? []).filter(o => o.name.startsWith('Demo —')).length})`}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-8 text-center text-sm text-ink-muted">
          No organisations provisioned yet.{' '}
          <Link href="/superadmin/provision" className="text-brand hover:underline font-semibold">
            Provision one →
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-ink-muted mb-4">{filtered.length} organisation{filtered.length !== 1 ? 's' : ''}</p>
          <div className="space-y-3">
            {filtered.map((org: OrgListItem) => {
              const serviceType = org.service_types?.name ?? '—'
              const tier = org.subscription_tier ?? 'trial'
              const tierStyle = TIER_STYLES[tier] ?? 'bg-fill-dim text-ink-muted'
              const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
              const admin = adminByOrg[org.id]
              const trial = tier === 'trial' ? trialStatus(org.trial_expires_at) : null

              return (
                <div
                  key={org.id}
                  className="bg-card border border-line rounded-xl px-5 py-4 flex items-center justify-between gap-6"
                >
                  {/* Left: org info */}
                  <div className="min-w-0">
                    {/* Name + badges */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-ink">{org.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-fill-dim text-ink-muted">
                        {serviceType}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tierStyle}`}>
                        {tierLabel}
                      </span>
                      {org.is_beta && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          Beta
                        </span>
                      )}
                      {org.is_charity && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Charity 20% off
                        </span>
                      )}
                      {trial && (
                        <span className={`text-xs font-medium ${trial.urgent ? 'text-red-600' : 'text-ink-muted'}`}>
                          · {trial.label}
                        </span>
                      )}
                    </div>

                    {/* Charity number */}
                    {org.charity_number && (
                      <p className="text-xs text-ink-muted mt-1">
                        Charity no. <span className="font-mono text-ink">{org.charity_number}</span>
                        {' '}· <span className="text-amber-600 font-medium">Verify document before enabling discount</span>
                      </p>
                    )}

                    {/* Admin + dates */}
                    <div className="text-xs text-ink-muted space-y-0.5">
                      {admin ? (
                        <p>
                          <span className="font-medium text-ink">{admin.full_name ?? 'Unknown'}</span>
                          {' · '}
                          <span className="font-mono">{admin.email}</span>
                        </p>
                      ) : (
                        <p className="text-amber-600">No admin user found</p>
                      )}
                      <p>
                        Provisioned {formatDate(org.created_at)}
                        {org.trial_expires_at && (
                          <> · Trial expires {formatDate(org.trial_expires_at)}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <CharityToggleButton
                      orgId={org.id}
                      isCharity={org.is_charity === true}
                    />
                    {admin ? (
                      <ImpersonateButton
                        adminEmail={admin.email}
                        adminName={admin.full_name}
                      />
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                    <DeleteOrgButton orgId={org.id} orgName={org.name} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
