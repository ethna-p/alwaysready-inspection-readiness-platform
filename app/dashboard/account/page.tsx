/**
 * /dashboard/account — account settings + team management.
 * Available to all roles; tab visibility is role-dependent.
 */
import { Suspense } from 'react'
import { getCurrentUserProfile } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession, createCancellationPortalSession } from '@/app/actions/stripe'
import ChangePasswordForm from './ChangePasswordForm'
import PersonalContactForm from './PersonalContactForm'
import MfaSection from './MfaSection'
import SubServicesForm from './SubServicesForm'
import AddMemberForm from './add-member-form'
import MemberRow from './member-row'
import AddVisitorForm from './add-visitor-form'
import VisitorRow from './visitor-row'
import AccountTabNav from './AccountTabNav'

export const metadata = { title: 'Account Settings — AlwaysReady' }

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()

  const isAdmin = profile?.role === 'admin'

  // Tabs available to this user
  const tabs = [
    ...(isAdmin ? [{ id: 'organisation', label: 'Organisation' }] : []),
    { id: 'security',      label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    ...(isAdmin ? [{ id: 'team', label: 'Team' }] : []),
  ]
  const defaultTab = tabs[0].id
  const activeTab  = tab ?? defaultTab

  // Fetch admin-only data
  let enabledSubServices: string[] = []
  let subscriptionTier = 'trial'
  let hasStripeCustomer = false
  let members: Awaited<ReturnType<typeof supabase.from>>['data'] = []
  let visitors: typeof members = []

  if (isAdmin && profile.organisation_id) {
    const [{ data: subServices }, { data: org }, { data: allUsers }] = await Promise.all([
      supabase
        .from('organisation_sub_services')
        .select('sub_service')
        .eq('organisation_id', profile.organisation_id),
      supabase
        .from('organisations')
        .select('subscription_tier, stripe_customer_id')
        .eq('id', profile.organisation_id)
        .single(),
      supabase
        .from('users')
        .select('id, full_name, username, email, role, viewer_expires_at, created_at')
        .eq('organisation_id', profile.organisation_id)
        .order('full_name', { ascending: true }),
    ])
    enabledSubServices = (subServices ?? []).map(r => r.sub_service)
    subscriptionTier   = org?.subscription_tier ?? 'trial'
    hasStripeCustomer  = !!org?.stripe_customer_id
    members  = (allUsers ?? []).filter(u => u.role !== 'viewer')
    visitors = (allUsers ?? []).filter(u => u.role === 'viewer')
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-brand mb-1">Account settings</h1>
        <p className="text-sm text-ink-dim">
          Signed in as <span className="font-medium text-ink">{profile?.full_name ?? 'Unknown'}</span>
        </p>
      </div>

      {/* ── Tab nav ───────────────────────────────────────────────────── */}
      <Suspense>
        <AccountTabNav tabs={tabs} defaultTab={defaultTab} />
      </Suspense>

      {/* ══ ORGANISATION tab ══════════════════════════════════════════════ */}
      {activeTab === 'organisation' && isAdmin && (
        <div className="space-y-8">

          {/* Subscription */}
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand mb-1">Subscription</h2>
            <p className="text-sm text-ink-dim mb-4">
              {subscriptionTier === 'active'
                ? 'Your subscription is active — £75 per month.'
                : subscriptionTier === 'past_due'
                ? 'Your last payment failed. Please update your payment details to restore full access.'
                : 'You are currently on a free trial.'}
            </p>
            {hasStripeCustomer ? (
              <div className="flex flex-wrap items-center gap-6">
                <form action={createBillingPortalSession}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-brand underline hover:text-[#00b8a6] transition-colors cursor-pointer"
                  >
                    Manage subscription →
                  </button>
                </form>
                {subscriptionTier === 'active' && (
                  <form action={createCancellationPortalSession}>
                    <button
                      type="submit"
                      className="text-sm font-medium text-red-600 underline hover:text-red-800 transition-colors cursor-pointer"
                    >
                      Cancel my subscription
                    </button>
                  </form>
                )}
              </div>
            ) : subscriptionTier !== 'active' ? (
              <a
                href="/upgrade"
                className="text-sm font-medium text-brand underline hover:text-[#00b8a6] transition-colors"
              >
                Subscribe now →
              </a>
            ) : null}
          </div>

          {/* Sub-services */}
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand mb-1">Sub-services we provide</h2>
            <p className="text-sm text-ink-dim mb-4">
              Enable additional checklist items for specialist care your service provides. Changes take effect immediately across relevant KLOEs.
            </p>
            <SubServicesForm enabledSubServices={enabledSubServices} />
          </div>

          {/* Export data */}
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand mb-1">Export your data</h2>
            <p className="text-sm text-ink-dim mb-6">
              Download a full copy of your organisation&apos;s data at any time.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* ZIP 1 — records */}
              <div className="border border-line rounded-lg p-4">
                <p className="text-sm font-medium text-ink mb-1">Records &amp; data</p>
                <p className="text-sm text-ink-muted mb-4">
                  All your KLOE records, compliance history, HR profiles, training records, holiday allowances, and team members as CSV files.
                </p>
                <a
                  href="/api/export-data"
                  download
                  className="
                    inline-flex items-center gap-2
                    bg-[#014D4E] text-white text-sm font-semibold
                    px-4 py-2 rounded-lg
                    hover:bg-[#013636]
                    focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
                    transition-colors
                  "
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download records
                </a>
              </div>

              {/* ZIP 2 — evidence files */}
              <div className="border border-line rounded-lg p-4">
                <p className="text-sm font-medium text-ink mb-1">Evidence files</p>
                <p className="text-sm text-ink-muted mb-4">
                  All documents and files you have uploaded as evidence, organised by KLOE. May take a moment for large collections.
                </p>
                <a
                  href="/api/export-evidence"
                  download
                  className="
                    inline-flex items-center gap-2
                    bg-[#014D4E] text-white text-sm font-semibold
                    px-4 py-2 rounded-lg
                    hover:bg-[#013636]
                    focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
                    transition-colors
                  "
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download evidence
                </a>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ══ SECURITY tab ══════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="space-y-8">

          {/* Two-factor authentication */}
          <Suspense>
            <MfaSection role={profile?.role ?? null} />
          </Suspense>

          {/* Change password */}
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand mb-1">Change password</h2>
            <p className="text-sm text-ink-dim mb-6">
              Enter your current password, then choose a new one.
            </p>
            <ChangePasswordForm />
          </div>

        </div>
      )}

      {/* ══ NOTIFICATIONS tab ═════════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="space-y-8">

          {/* Personal contact details */}
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand mb-1">Notification contact details</h2>
            <p className="text-sm text-ink-dim mb-6">
              Add a personal email or mobile number to receive notifications. These are separate from your login credentials.
            </p>
            <PersonalContactForm
              personalEmail={profile?.personal_email ?? null}
              mobileNumber={profile?.mobile_number ?? null}
            />
          </div>

        </div>
      )}

      {/* ══ TEAM tab ══════════════════════════════════════════════════════ */}
      {activeTab === 'team' && isAdmin && (
        <div className="space-y-8">

          {/* Team members list */}
          <section aria-labelledby="team-list-heading">
            <h2 id="team-list-heading" className="text-base font-semibold text-brand mb-4">
              Team members
              <span className="ml-2 text-sm font-normal text-ink-dim">
                ({(members as { id: string }[]).length})
              </span>
            </h2>

            {(members as { id: string }[]).length === 0 ? (
              <p className="text-sm text-ink-dim">No team members yet. Add your first below.</p>
            ) : (
              <div className="bg-card rounded-xl border border-line overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs text-ink-dim uppercase tracking-wide">
                      <th scope="col" className="text-left px-4 py-3 font-medium">Name / Login ID</th>
                      <th scope="col" className="text-left px-4 py-3 font-medium">Role</th>
                      <th scope="col" className="text-left px-4 py-3 font-medium">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(members as Parameters<typeof MemberRow>[0]['member'][]).map(member => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        isSelf={member.id === profile.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Role guide */}
          <section
            className="bg-canvas rounded-xl border border-line p-5 text-sm"
            aria-labelledby="role-guide-heading"
          >
            <h3 id="role-guide-heading" className="font-semibold text-brand mb-3">
              Role guide
            </h3>
            <dl className="space-y-2 text-ink">
              <div className="flex gap-2">
                <dt className="font-medium w-16 shrink-0">Admin</dt>
                <dd className="text-ink-dim">Full access — view and edit all KLOEs, assign tasks, manage team, create inspector logins.</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium w-16 shrink-0">User</dt>
                <dd className="text-ink-dim">Can view all KLOEs and update the ones assigned to them. Sees their personal "My KLOEs" view on login.</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium w-16 shrink-0">Viewer</dt>
                <dd className="text-ink-dim">Read-only access — for board members, owners, or CQC inspectors. Cannot edit anything.</dd>
              </div>
            </dl>
          </section>

          {/* Invite team member */}
          <section
            className="bg-card rounded-xl border border-line p-6"
            aria-labelledby="add-member-heading"
          >
            <h3 id="add-member-heading" className="text-base font-semibold text-brand mb-1">
              Invite team member
            </h3>
            <p className="text-sm text-ink-dim mb-4">
              An invitation email will be sent. The recipient clicks the link and sets their own password — no credentials to share manually.
            </p>
            <AddMemberForm />
          </section>

          {/* Visitor logins list */}
          <section aria-labelledby="visitor-list-heading">
            <h3 id="visitor-list-heading" className="text-base font-semibold text-brand mb-1">
              Visitor logins
              {(visitors as { id: string }[]).length > 0 && (
                <span className="ml-2 text-sm font-normal text-ink-dim">
                  ({(visitors as { id: string }[]).length})
                </span>
              )}
            </h3>
            <p className="text-sm text-ink-dim mb-4">
              Read-only access for inspectors, board members, or other external visitors. Access expires automatically.
            </p>

            {(visitors as { id: string }[]).length === 0 ? (
              <p className="text-sm text-ink-dim">No visitor logins yet.</p>
            ) : (
              <div className="bg-card rounded-xl border border-line overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs text-ink-dim uppercase tracking-wide">
                      <th scope="col" className="text-left px-4 py-3 font-medium">Name / Login ID</th>
                      <th scope="col" className="text-left px-4 py-3 font-medium">Access expires</th>
                      <th scope="col" className="text-left px-4 py-3 font-medium">Revoke</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(visitors as Parameters<typeof VisitorRow>[0]['visitor'][]).map(visitor => (
                      <VisitorRow key={visitor.id} visitor={visitor} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Create visitor login */}
          <section
            className="bg-card rounded-xl border border-line p-6"
            aria-labelledby="add-visitor-heading"
          >
            <h3 id="add-visitor-heading" className="text-base font-semibold text-brand mb-1">
              Create visitor login
            </h3>
            <p className="text-sm text-ink-dim mb-4">
              Create a temporary read-only login for an inspector or external visitor. They can view all KLOEs, the audit trail, trend data, and reports — but cannot make any changes.
            </p>
            <AddVisitorForm />
          </section>

        </div>
      )}
    </div>
  )
}
