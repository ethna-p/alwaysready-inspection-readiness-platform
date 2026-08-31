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
import OrgLogoUpload from './OrgLogoUpload'
import AddMemberForm from './add-member-form'
import MemberRow from './member-row'
import AddVisitorForm from './add-visitor-form'
import VisitorRow from './visitor-row'
import AccountTabNav from './AccountTabNav'
import Link from 'next/link'

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
    { id: 'features',      label: 'Platform Features' },
  ]
  const defaultTab = tabs[0].id
  const activeTab  = tab ?? defaultTab

  // Fetch admin-only data
  let enabledSubServices: string[] = []
  let subscriptionTier = 'trial'
  let hasStripeCustomer = false
  let orgLogoUrl: string | null = null
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
        .select('subscription_tier, stripe_customer_id, logo_url')
        .eq('id', profile.organisation_id)
        .single(),
      supabase
        .from('users')
        .select('id, full_name, email, role, viewer_expires_at, created_at')
        .eq('organisation_id', profile.organisation_id)
        .order('full_name', { ascending: true }),
    ])
    enabledSubServices = (subServices ?? []).map(r => r.sub_service)
    subscriptionTier   = org?.subscription_tier ?? 'trial'
    hasStripeCustomer  = !!org?.stripe_customer_id
    orgLogoUrl         = org?.logo_url ?? null
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


        </div>
      )}

      {/* ══ PLATFORM FEATURES tab ═════════════════════════════════════════ */}
      {activeTab === 'features' && (
        <div className="space-y-8">
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand mb-1">What&apos;s included in your plan</h2>
            <p className="text-sm text-ink-dim mb-4">
              Every feature below is included in your AlwaysReady subscription at no extra cost.
            </p>
            <p className="text-sm text-ink-dim mb-8">
              Missing something you need?{' '}
              <Link href="/dashboard/support/new" className="text-brand underline hover:text-[#00b8a6] transition-colors">
                Share a suggestion →
              </Link>
            </p>
            <div className="space-y-10">
              {([
                {
                  category: 'Inspection Readiness',
                  features: [
                    {
                      name: 'KLOE Tracker',
                      desc: 'All 24 CQC Key Lines of Enquiry pre-loaded across Safe, Effective, Caring, Responsive, and Well-led. Set status, review dates, frequency, priority, and notes per KLOE.',
                      href: '/dashboard/kloes',
                    },
                    {
                      name: 'Compliance Checklists',
                      desc: 'Every KLOE has a pre-built checklist of the specific evidence CQC inspectors look for. Tick items off as you gather them and see a live progress bar per KLOE.',
                      href: '/dashboard/kloes',
                    },
                    {
                      name: 'Evidence Uploads',
                      desc: 'Upload policies, audits, certificates, and images directly to any KLOE — PDF, Word, Excel, and JPG/PNG, up to 10 MB each. Every file is automatically scanned for viruses.',
                      href: '/dashboard/kloes',
                    },
                    {
                      name: 'Audit Trail',
                      desc: 'Every change to every KLOE is permanently recorded — status updates, review dates, notes, and file uploads. A chronological, tamper-proof compliance history.',
                      href: '/dashboard/kloes',
                    },
                    {
                      name: 'CQC Rating Characteristics',
                      desc: 'See exactly what Outstanding, Good, Requires Improvement, and Inadequate look like for each individual KLOE — taken directly from CQC guidance.',
                      href: '/dashboard/kloes',
                    },
                    {
                      name: 'CQC Register',
                      desc: 'Your live CQC rating pulled directly from the public register, displayed in CQC\'s official colours and refreshed every 24 hours. Includes your last inspection date and a link to your public CQC profile.',
                      href: '/dashboard',
                    },
                  ],
                },
                {
                  category: 'Reporting & Analytics',
                  features: [
                    {
                      name: 'Readiness Dashboard',
                      desc: 'Overall readiness percentage and RAG breakdown across all 24 KLOEs, broken down by each CQC key question, with a team workload overview showing assigned and overdue items.',
                      href: '/dashboard',
                    },
                    {
                      name: 'Analytics',
                      desc: 'Charts showing KLOE evidence coverage, People\'s Voice confidence, action plan health, HR compliance, and mock inspection trends — all in one view. Useful for board reporting and continuous improvement.',
                      href: '/dashboard',
                    },
                    {
                      name: 'Daily Review Report',
                      desc: 'A single screen showing everything that needs attention today — overdue KLOEs first, then due soon, sorted by priority. Designed to be scanned in under five minutes.',
                      href: '/dashboard/daily-report',
                    },
                    {
                      name: 'Report Builder',
                      desc: 'Build a filtered view of your KLOE compliance position, save it as a named view, and take progress snapshots over time. Includes an AI-generated narrative summary and a Pre-Inspection view ready to hand to a CQC inspector.',
                      href: '/dashboard/reports',
                    },
                    {
                      name: 'Inspection Pack',
                      desc: 'One click generates a printable PDF of your full compliance position — RAG status, review dates, priority, and evidence location for every KLOE. Ready to hand to an inspector.',
                      href: '/dashboard/inspection-pack',
                    },
                  ],
                },
                {
                  category: 'Preparation & Assessment',
                  features: [
                    {
                      name: 'Mock Inspections',
                      desc: 'Run a full or focused self-assessment across your KLOEs. Produces a prioritised action plan — Must Address, Strengthen Before Inspection, and Maintain — that you can work through and track to completion.',
                      href: '/dashboard/mock-inspections',
                    },
                    {
                      name: "People's Voice",
                      desc: "The 19 TLAP \"I\" statements from the CQC assessment framework are pre-loaded. Record your evidence, upload supporting files against individual statements, create structured action plans, and see a summary dashboard across all five key questions.",
                      href: '/dashboard/peoples-voice',
                    },
                  ],
                },
                {
                  category: 'HR & Workforce',
                  features: [
                    {
                      name: 'HR Records',
                      desc: 'Staff profiles with employment details, DBS renewals, right to work, supervision and appraisals, references, and special category equality data — all held securely in one place.',
                      href: '/dashboard/hr',
                    },
                    {
                      name: 'Training Records',
                      desc: 'Track mandatory training for every staff member — completion dates, renewal frequency, next due date calculated automatically, and certificate uploads. Traffic light status at a glance.',
                      href: '/dashboard/hr',
                    },
                    {
                      name: 'Holiday & Leave',
                      desc: 'Annual leave entitlement, carry-over, and days taken tracked per staff member, per leave year. Configurable in days or hours. Full leave history retained.',
                      href: '/dashboard/hr',
                    },
                    {
                      name: 'HR Overview Dashboard',
                      desc: 'Team-wide compliance at a glance — colour-coded DBS, supervision, appraisal, and training status for every staff member. A "Needs attention" section highlights who is overdue or due soon.',
                      href: '/dashboard/hr',
                    },
                  ],
                },
                {
                  category: 'Team',
                  features: [
                    {
                      name: 'Team Management',
                      desc: 'Invite colleagues by email. Assign roles — Admin (full access), Staff (edit assigned KLOEs), Viewer (read-only). We recommend that only the Registered Manager holds Admin access.',
                      href: '/dashboard/account?tab=team',
                    },
                    {
                      name: 'KLOE Assignment',
                      desc: 'Assign individual KLOEs to specific team members. Staff see their personal "My KLOEs" list on login and receive email notification when a new KLOE is assigned to them.',
                      href: '/dashboard/account?tab=team',
                    },
                    {
                      name: 'Visitor Access',
                      desc: 'Create time-limited read-only logins for inspectors, trustees, or external reviewers. Access expires automatically and can be revoked early at any time.',
                      href: '/dashboard/account?tab=team',
                    },
                    {
                      name: 'Automatic Reminders',
                      desc: 'The platform emails the relevant team member when a KLOE review or HR check is due soon or overdue. Set a review frequency once and the reminders run automatically.',
                      href: '/dashboard/kloes',
                    },
                  ],
                },
                {
                  category: 'Platform',
                  features: [
                    {
                      name: 'Newsletter Drafting',
                      desc: 'AI-powered newsletter drafts for your staff team, families, or residents. Choose a topic, tone, and key points — AlwaysReady generates a ready-to-copy draft in seconds. Admin access only.',
                      href: '/dashboard/newsletter',
                    },
                    {
                      name: 'Specialist Care Configuration',
                      desc: 'Enable additional checklist items for the specialist care areas your service provides — Learning Disabilities, Mental Health, End of Life, Acquired Brain Injury, Physical Disabilities, Bariatric Care, Sensory Impairment, and Epilepsy.',
                      href: '/dashboard/account?tab=organisation',
                    },
                    {
                      name: 'Security & Two-Factor Authentication',
                      desc: 'MFA required for all Admin and Staff accounts. Row-level data isolation ensures no organisation can access another\'s records. All data encrypted at rest and in transit.',
                      href: '/dashboard/account?tab=security',
                    },
                    {
                      name: 'Dark Mode',
                      desc: 'Full dark mode available across the entire platform. Respects your system preference by default and can be toggled manually from the navigation bar.',
                      href: '/dashboard',
                    },
                    {
                      name: 'In-platform Support',
                      desc: 'Raise a query or report an issue directly from the Support link. Replies are delivered in-platform and by email — and you can reply by email to thread your response back automatically.',
                      href: '/dashboard/support/new',
                    },
                    {
                      name: 'Data Export',
                      desc: 'Download all your compliance records as CSV files and all uploaded evidence as a single ZIP, at any time. Your data is always yours — no need to contact support.',
                      href: '/dashboard/account?tab=billing',
                    },
                  ],
                },
              ] as { category: string; features: { name: string; desc: string; href: string }[] }[]).map(({ category, features }) => (
                <div key={category}>
                  <div className="relative inline-block px-2 py-0.5 mb-3">
                    <span className="absolute inset-0 bg-[#e8c547] opacity-25 -rotate-[0.5deg] -skew-x-1 rounded-sm" aria-hidden="true" />
                    <span className="relative z-10 text-[11px] font-semibold tracking-widest uppercase text-ink">{category}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map(feature => (
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
                </div>
              ))}
            </div>
            <p className="text-sm text-ink-dim mt-8">
              Missing something you need?{' '}
              <Link href="/dashboard/support/new" className="text-brand underline hover:text-[#00b8a6] transition-colors">
                Share a suggestion →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ══ ORGANISATION tab ══════════════════════════════════════════════ */}
      {activeTab === 'organisation' && isAdmin && (
        <div className="space-y-8">

          {/* Organisation logo */}
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand mb-1">Organisation logo</h2>
            <p className="text-sm text-ink-dim mb-4">
              Upload your care home&apos;s logo. It will appear in the platform header and on printed reports.
            </p>
            <OrgLogoUpload currentLogoUrl={orgLogoUrl} />
          </div>

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
                      <th scope="col" className="text-left px-4 py-3 font-medium">Name</th>
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
                <dd className="text-ink-dim">Can view all KLOEs and update the ones assigned to them. Sees their personal &quot;My KLOEs&quot; view on login.</dd>
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
                      <th scope="col" className="text-left px-4 py-3 font-medium">Name</th>
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
