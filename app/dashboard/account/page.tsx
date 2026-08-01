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
    ...(isAdmin ? [{ id: 'billing',      label: 'Billing' }] : []),
    ...(isAdmin ? [{ id: 'organisation', label: 'Organisation' }] : []),
    { id: 'security',      label: 'Security' },
    // NOTIFICATIONS TAB — hidden until email threading (#269) and WhatsApp (Meta API) are ready.
    // The UI (PersonalContactForm, mobile_number field, personal_email field) is fully built.
    // To restore: uncomment the line below and uncomment the tab panel further down.
    // { id: 'notifications', label: 'Notifications' },
    ...(isAdmin ? [{ id: 'team',         label: 'Team' }] : []),
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

      {/* ══ BILLING tab ═══════════════════════════════════════════════════ */}
      {activeTab === 'billing' && isAdmin && (
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

          {/* What's included */}
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand mb-1">What&apos;s included in your plan</h2>
            <p className="text-sm text-ink-dim mb-6">
              Every feature below is included in your AlwaysReady subscription at no extra cost.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                {
                  name: 'KLOE Tracker',
                  desc: 'All 24 CQC Key Lines of Enquiry pre-loaded, grouped by Safe, Effective, Caring, Responsive, and Well-led. Set status, review dates, frequency, priority, and evidence location per KLOE.',
                  href: '/dashboard/kloes',
                },
                {
                  name: 'Evidence Uploads',
                  desc: 'Upload PDF, Word, Excel, and image files directly to any KLOE — up to 10 MB per file. Files are private to your organisation.',
                  href: '/dashboard/kloes',
                },
                {
                  name: 'Audit Trail',
                  desc: 'Every change to a KLOE is permanently recorded — who made it, when, and what changed. Provides a continuous compliance history for inspectors.',
                  href: '/dashboard/kloes',
                },
                {
                  name: 'Readiness Dashboard',
                  desc: 'Overall readiness percentage at a glance. RAG status across all 24 KLOEs, broken down by each of the five CQC key questions, with team workload at a glance.',
                  href: '/dashboard',
                },
                {
                  name: 'Readiness Trend',
                  desc: 'A graph showing how your readiness percentage has changed over time, broken down by key question area — useful for demonstrating improvement to an inspector or board.',
                  href: '/dashboard',
                },
                {
                  name: 'CQC Register',
                  desc: 'Your live CQC rating pulled directly from the public register, displayed on your dashboard in CQC\'s official colours and refreshed every 24 hours.',
                  href: '/dashboard',
                },
                {
                  name: 'Daily Review Report',
                  desc: 'A single screen showing everything that needs attention — overdue KLOEs first, then due soon, sorted by priority. Designed to be scanned in under five minutes.',
                  href: '/dashboard/report',
                },
                {
                  name: 'Mock Inspections',
                  desc: 'Self-assess your evidence across every KLOE as Outstanding, Good, Requires Improvement, or Inadequate. Generates a mock report per key question area. Save and revisit over time.',
                  href: '/dashboard/mock-inspection',
                },
                {
                  name: 'Inspection Pack',
                  desc: 'One click generates a printable PDF of your full compliance position — RAG status, review dates, priority, and evidence location for every KLOE. Ready to hand to an inspector.',
                  href: '/dashboard',
                },
                {
                  name: 'HR Records',
                  desc: 'Staff profiles with employment details, DBS renewals, right to work, supervision, appraisals, mandatory training with certificate uploads, and holiday allowances — all in one place.',
                  href: '/dashboard/hr',
                },
                {
                  name: 'HR Overview Dashboard',
                  desc: 'At-a-glance view of DBS, supervision, appraisal, and training compliance across the whole team. Highlights staff members who are overdue or due soon.',
                  href: '/dashboard/hr',
                },
                {
                  name: 'Team Management',
                  desc: 'Invite colleagues by email. Assign roles — Admin (full access), Staff (edit assigned KLOEs), Viewer (read-only). No limit on the number of Admins.',
                  href: '/dashboard/account?tab=team',
                },
                {
                  name: 'Visitor Access',
                  desc: 'Grant time-limited read-only logins to inspectors or board members, with automatic expiry and early revocation at any time.',
                  href: '/dashboard/account?tab=team',
                },
                {
                  name: 'Automatic Reminders',
                  desc: 'The platform emails the relevant team member when a KLOE review or HR check is due soon or overdue. Set review frequencies per KLOE and the rest is automatic.',
                  href: '/dashboard/kloes',
                },
                {
                  name: 'Specialist Care Configuration',
                  desc: 'Enable additional checklist items for the specialist care areas your service provides — including Dementia, Learning Disabilities, Mental Health, End of Life, Physical Disabilities, and more.',
                  href: '/dashboard/account?tab=organisation',
                },
                {
                  name: 'Security & Two-Factor Authentication',
                  desc: 'Two-factor authentication required for all Admin and Staff accounts. Each organisation\'s data is fully isolated. Your records are encrypted at rest and in transit.',
                  href: '/dashboard/account?tab=security',
                },
                {
                  name: 'In-platform Support',
                  desc: 'Raise a query or report an issue directly from the Support link in the navigation bar. Replies are tracked as threaded conversations so nothing gets lost.',
                  href: '/dashboard/support/new',
                },
                {
                  name: 'Data Export',
                  desc: 'Download all your records as CSV files and all uploaded evidence files in a single ZIP at any time. Your data is always yours to keep.',
                  href: '/dashboard/account?tab=billing',
                },
              ] as { name: string; desc: string; href: string }[]).map(feature => (
                <a
                  key={feature.name}
                  href={feature.href}
                  className="group block border border-line rounded-lg p-4 hover:border-brand hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-semibold text-brand mb-1 group-hover:text-[#00b8a6] transition-colors">
                    {feature.name}
                  </p>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    {feature.desc}
                  </p>
                </a>
              ))}
            </div>
            <p className="text-sm text-ink-dim mt-6">
              Missing something you need?{' '}
              <a href="/dashboard/support/new" className="text-brand underline hover:text-[#00b8a6] transition-colors">
                Share a suggestion →
              </a>
            </p>
          </div>

        </div>
      )}

      {/* ══ ORGANISATION tab ══════════════════════════════════════════════ */}
      {activeTab === 'organisation' && isAdmin && (
        <div className="space-y-8">

          {/* Sub-services */}
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand mb-1">Sub-services we provide</h2>
            <p className="text-sm text-ink-dim mb-4">
              Enable additional checklist items for specialist care your service provides. Changes take effect immediately across relevant KLOEs.
            </p>
            <SubServicesForm enabledSubServices={enabledSubServices} />
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

      {/* ══ NOTIFICATIONS tab ═════════════════════════════════════════════
           HIDDEN — pending completion of:
             • #269: Inbound email threading (requires Resend Pro)
             • WhatsApp notifications via Meta Business API
           The PersonalContactForm component, personal_email and mobile_number
           columns on the users table, and the UI are all fully built and ready.
           To restore: uncomment the tab in the tabs array above, and uncomment
           this panel.
      {activeTab === 'notifications' && (
        <div className="space-y-8">
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
      ══════════════════════════════════════════════════════════════════════ */}

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
