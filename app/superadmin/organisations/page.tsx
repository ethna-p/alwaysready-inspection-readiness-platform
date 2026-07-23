/**
 * /superadmin/organisations — list of all provisioned orgs with impersonation.
 *
 * Protected by proxy.ts: only SUPERADMIN_EMAIL may access this route.
 * Uses the service-role admin client to bypass RLS.
 *
 * "View as admin →" generates a one-time magic link for the org's admin user
 * and opens it in a new tab, leaving your superadmin session intact.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import ImpersonateButton from './ImpersonateButton'

const TIER_STYLES: Record<string, string> = {
  trial:     'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  expired:   'bg-gray-100 text-gray-500',
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

export default async function OrganisationsPage() {
  const supabase = createAdminClient()

  // ── 1. Fetch all real orgs (exclude demo/shadow orgs) ──────────────────
  const { data: orgs, error: orgsError } = await supabase
    .from('organisations')
    .select(`
      id, name, subscription_tier, trial_expires_at, created_at, is_beta,
      service_types ( name )
    `)
    .eq('is_demo', false)
    .order('created_at', { ascending: false })

  if (orgsError) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700">
        <strong>Error loading organisations:</strong> {orgsError.message}
      </div>
    )
  }

  // ── 2. Fetch admin users for those orgs ────────────────────────────────
  const orgIds = (orgs ?? []).map(o => o.id)

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
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">Organisations</h1>
        <p className="text-sm text-gray-500">
          All provisioned organisations.{' '}
          <span className="font-medium">"View as admin"</span> opens their dashboard in a new tab — your superadmin session stays open here.
        </p>
      </div>

      {!orgs || orgs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          No organisations provisioned yet.{' '}
          <a href="/superadmin/provision" className="text-[#014D4E] hover:underline font-semibold">
            Provision one →
          </a>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">{orgs.length} organisation{orgs.length !== 1 ? 's' : ''}</p>
          <div className="space-y-3">
            {orgs.map(org => {
              const serviceType = (org as any).service_types?.name ?? '—'
              const tier = org.subscription_tier ?? 'trial'
              const tierStyle = TIER_STYLES[tier] ?? 'bg-gray-100 text-gray-500'
              const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
              const admin = adminByOrg[org.id]
              const trial = tier === 'trial' ? trialStatus(org.trial_expires_at) : null

              return (
                <div
                  key={org.id}
                  className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-6"
                >
                  {/* Left: org info */}
                  <div className="min-w-0">
                    {/* Name + badges */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-[#1a1a1a]">{org.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {serviceType}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tierStyle}`}>
                        {tierLabel}
                      </span>
                      {(org as any).is_beta && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          Beta
                        </span>
                      )}
                      {trial && (
                        <span className={`text-xs font-medium ${trial.urgent ? 'text-red-600' : 'text-gray-400'}`}>
                          · {trial.label}
                        </span>
                      )}
                    </div>

                    {/* Admin + dates */}
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {admin ? (
                        <p>
                          <span className="font-medium text-gray-700">{admin.full_name ?? 'Unknown'}</span>
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

                  {/* Right: action */}
                  <div className="shrink-0">
                    {admin ? (
                      <ImpersonateButton
                        adminEmail={admin.email}
                        adminName={admin.full_name}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
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
