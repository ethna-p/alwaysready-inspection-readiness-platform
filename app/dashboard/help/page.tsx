/**
 * /dashboard/help — User guide.
 *
 * Plain English. Print-friendly. All roles see everything.
 * Jump-to sections for Admin, Staff, Visitor, and FAQs.
 * No database queries — fully static.
 */

export const metadata = { title: 'Help & User Guide — AlwaysReady' }

// ── Reusable section anchor wrapper ──────────────────────────────────────────

function Section({
  id,
  label,
  colour,
  children,
}: {
  id: string
  label: string
  colour: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-8 bg-card rounded-2xl border border-line overflow-hidden print:border-gray-400 print:rounded-none print:break-inside-avoid"
    >
      <div className={`px-6 py-4 ${colour}`}>
        <h2 className="text-lg font-bold text-white">{label}</h2>
      </div>
      <div className="px-6 py-6 space-y-6 text-sm text-ink leading-relaxed">
        {children}
        <div className="pt-2 print:hidden">
          <a
            href="#"
            className="text-xs text-brand hover:underline focus:outline-none focus:ring-1 focus:ring-[#014D4E] rounded"
          >
            ↑ Back to top
          </a>
        </div>
      </div>
    </section>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-bold text-brand text-base mt-2">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-[#014D4E] text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {number}
      </span>
      <p>{children}</p>
    </div>
  )
}

function RAGPill({ colour, label, description }: { colour: string; label: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`shrink-0 mt-0.5 inline-block w-3 h-3 rounded-full ${colour}`} aria-hidden="true" />
      <span>
        <span className="font-semibold">{label} — </span>
        {description}
      </span>
    </div>
  )
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-line last:border-0 pb-4 last:pb-0">
      <p className="font-semibold text-brand mb-1">{question}</p>
      <p className="text-ink">{answer}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  return (
    <div className="print:max-w-none">

      {/* Page heading */}
      <div className="mb-6 print:mb-4">
        <h1 className="text-2xl font-bold text-brand">Help &amp; User Guide</h1>
        <p className="text-sm text-ink-dim mt-1">
          Everything you need to get the most out of AlwaysReady.
        </p>
      </div>

      {/* ── Jump-to navigation ─────────────────────────────────────────────── */}
      <nav
        aria-label="Page sections"
        className="bg-card rounded-xl border border-line p-5 mb-8 print:hidden"
      >
        <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-3">
          Jump to a section
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '#platform-features', label: 'What\'s in the platform' },
            { href: '#understanding-rag', label: 'Understanding RAG status' },
            { href: '#for-admins',        label: 'For Admins' },
            { href: '#hr-records',        label: 'HR Records' },
            { href: '#for-staff',         label: 'For Staff' },
            { href: '#for-visitors',      label: 'For Visitors' },
            { href: '#faqs',              label: 'FAQs' },
            { href: '#v1-faqs',           label: 'Platform FAQ' },
            { href: '#data-security',     label: 'Data Security' },
            { href: '#data-retention',    label: 'Data Retention' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="
                inline-block text-sm font-medium
                bg-canvas border border-line rounded-lg
                px-4 py-2
                text-brand hover:bg-[#014D4E] hover:text-white hover:border-[#014D4E]
                focus:outline-none focus:ring-2 focus:ring-[#014D4E]
                transition-colors
              "
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-8">

        {/* ── What's in the platform ─────────────────────────────────────────── */}
        <Section id="platform-features" label="What's in the platform" colour="bg-[#014D4E]">
          {/* Suggestion callout */}
          <div className="rounded-xl border border-[#014D4E]/20 bg-[#014D4E]/5 px-5 py-4">
            <p className="font-semibold text-brand mb-1">Got an idea for something new?</p>
            <p className="text-sm text-ink mb-3">
              If there is a feature you would find useful that is not listed above, we would genuinely love to hear about it. Your suggestions help shape the platform — and if it is something many services would benefit from, there is a good chance it will make it in.
            </p>
            <a
              href="/dashboard/support/new"
              className="inline-block text-sm font-medium bg-[#014D4E] text-white px-4 py-2 rounded-lg hover:bg-[#013838] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 transition-colors"
            >
              Share a suggestion →
            </a>
          </div>

          <P>
            Here is everything currently available in AlwaysReady.
          </P>

          <H3>KLOE Tracker</H3>
          <div className="space-y-1">
            <p>• All 24 CQC Key Lines of Enquiry (KLOEs) pre-loaded, grouped by the five key questions: Safe, Effective, Caring, Responsive, and Well-led.</p>
            <p>• Set the status of each KLOE: Not started, In progress, or Completed.</p>
            <p>• Record the date of each review and when the next review is due — the platform calculates your readiness automatically.</p>
            <p>• Set review frequency per KLOE (monthly, quarterly, annual, or custom).</p>
            <p>• Set a priority level (1–5) per KLOE to reflect the seriousness of non-compliance.</p>
            <p>• Add evidence location notes — where the document or policy is physically or digitally stored.</p>
            <p>• Upload evidence files (PDF, Word (.docx), Excel (.xlsx), JPG, PNG — up to 10 MB each).</p>
            <p>• View CQC rating characteristics (Outstanding, Good, Requires Improvement, Inadequate) for each KLOE.</p>
            <p>• Assign any KLOE to a specific team member.</p>
            <p>• Full audit trail per KLOE — every change recorded with who made it and when, permanently.</p>
          </div>

          <H3>Readiness Dashboard</H3>
          <div className="space-y-1">
            <p>• Overall inspection readiness percentage at a glance.</p>
            <p>• Breakdown by each of the five CQC key question areas.</p>
            <p>• RAG status indicators across all KLOEs — Red (overdue), Amber (due soon), Green (current), Grey (not yet assessed).</p>
            <p>• Team workload overview showing assigned KLOEs and overdue items per staff member.</p>
          </div>

          <H3>CQC Register</H3>
          <div className="space-y-1">
            <p>• Your live CQC rating (Outstanding, Good, Requires Improvement, or Inadequate) is displayed on the dashboard, pulled directly from the public CQC register.</p>
            <p>• The rating uses CQC&apos;s official colour scheme so it matches what inspectors and the public see on the CQC website.</p>
            <p>• Your registered service name, as held by CQC, is shown alongside your rating — useful for confirming your registration details are correct.</p>
            <p>• The date of your most recent CQC inspection is displayed so you always know when you were last assessed.</p>
            <p>• A direct link to your service&apos;s entry on the CQC website is included — one click to your public-facing profile.</p>
            <p>• Rating data is refreshed automatically every 24 hours so your dashboard always reflects the current CQC register.</p>
            <p>• At sign-up, your CQC Location ID is validated against the live register — confirming your service is CQC-registered before your account is created.</p>
          </div>

          <H3>Daily Review Report</H3>
          <div className="space-y-1">
            <p>• A single screen showing everything that needs attention — overdue KLOEs first, then due soon, sorted by priority.</p>
            <p>• Designed to be scanned in under five minutes each morning.</p>
          </div>

          <H3>Readiness Trend</H3>
          <div className="space-y-1">
            <p>• A graph showing how your overall readiness percentage has changed over recent weeks and months.</p>
            <p>• Breakdown by key question area so you can see which areas are improving and which need attention.</p>
          </div>

          <H3>Mock Inspections</H3>
          <div className="space-y-1">
            <p>• Self-assessment tool that walks you through every KLOE.</p>
            <p>• Rate your evidence for each KLOE as Outstanding, Good, Requires Improvement, or Inadequate.</p>
            <p>• Produces a mock inspection report showing a self-assessed rating per key question area.</p>
            <p>• Save and revisit previous mock inspections to track your self-assessment over time.</p>
          </div>

          <H3>Inspection Pack</H3>
          <div className="space-y-1">
            <p>• A one-click printable summary of your full compliance position.</p>
            <p>• Shows current RAG status, review dates, priority, and evidence location for every KLOE.</p>
            <p>• Designed to be handed to an inspector or presented to a board.</p>
          </div>

          <H3>Team Management</H3>
          <div className="space-y-1">
            <p>• Invite team members by email — they receive a link and set their own password.</p>
            <p>• Assign roles: Admin (full access), Staff / User (view all, edit assigned KLOEs), Viewer (read-only).</p>
            <p>• We recommend that only the Registered Manager holds the Admin role. All other team members should be Staff or Viewer.</p>
            <p>• Create temporary Visitor logins for inspectors or board members, with automatic expiry.</p>
            <p>• Revoke visitor access early at any time.</p>
            <p>• Reset any team member&apos;s password from the Team page.</p>
          </div>

          <H3>HR Records</H3>
          <div className="space-y-1">
            <p>• Staff record for each team member: employment details, job title, contracted hours, start date.</p>
            <p>• Compliance dates: DBS renewal, right to work, references.</p>
            <p>• Supervision and appraisal due dates, with RAG status tracking across the whole team.</p>
            <p>• Training records: completion dates, renewal frequency, next due date calculated automatically, certificate uploads.</p>
            <p>• Holiday allowances: entitlement and days or hours taken, tracked per leave year.</p>
            <p>• Absence records: sick leave and other absence episodes, with reason categories, return-to-work interview tracking, Bradford Factor calculation (rolling 52 weeks), and year-to-date sick days.</p>
            <p>• HR overview dashboard showing DBS, Supervision, Appraisal, and Mandatory Training compliance across the team at a glance.</p>
            <p>• Needs attention section highlighting individual staff members who are overdue or due soon.</p>
            <p>• Special category data fields for equality monitoring (held under Equality Act 2010 obligations).</p>
          </div>

          <H3>Account &amp; Security</H3>
          <div className="space-y-1">
            <p>• Two-factor authentication (2FA) required for all Admin and Staff accounts.</p>
            <p>• Password change available at any time from the Account page.</p>
            <p>• Each organisation&apos;s data is fully isolated — no other organisation can access your records.</p>
          </div>

          <H3>Support</H3>
          <div className="space-y-1">
            <p>• In-platform support ticket system — raise a query or report an issue directly from the Support link in the navigation bar.</p>
            <p>• Email support at support@alwaysready.uk.</p>
          </div>

        </Section>

        {/* ── Understanding RAG ──────────────────────────────────────────────── */}
        <Section id="understanding-rag" label="Understanding RAG status" colour="bg-[#014D4E]">
          <P>
            Every KLOE in the platform is given a RAG status — Red, Amber, Green, or Grey. This tells you at a glance how well-prepared your service is for each area of inspection.
          </P>
          <div className="space-y-3 my-2">
            <RAGPill colour="bg-green-500"  label="Green"  description="This KLOE has been reviewed, marked as completed, and the next review date has not yet passed. Everything is in order." />
            <RAGPill colour="bg-amber-400"  label="Amber"  description="This KLOE is either in progress, or the next review date is coming up within the next 30 days. It needs your attention soon." />
            <RAGPill colour="bg-red-500"    label="Red"    description="This KLOE is overdue. The next review date has passed, or the KLOE was marked as completed but the review date is now in the past. This needs urgent attention." />
            <RAGPill colour="bg-gray-300"   label="Grey"   description="No review has been recorded for this KLOE yet. It has not been assessed." />
          </div>
          <P>
            The RAG status is calculated automatically every time you view the platform. You do not need to set it manually — it updates based on the status and review dates you enter.
          </P>
          <P>
            When an inspector visits, they will see the same RAG colours you see. Green KLOEs show that your team is proactive and organised. A mix of amber and grey is normal for a service just getting started. Red KLOEs should always be prioritised.
          </P>
        </Section>

        {/* ── For Admins ─────────────────────────────────────────────────────── */}
        <Section id="for-admins" label="For Admins" colour="bg-[#00b8a6]">
          <P>
            As an Admin, you have full access to the platform. You can view and edit all KLOEs, manage your team, assign tasks, run mock inspections, and maintain HR records. You are responsible for keeping AlwaysReady up to date and making sure the right people have the right access. We recommend that only the Registered Manager holds the Admin role. All other team members should be given Staff or Viewer access, which limits what they can see and change.
          </P>

          <H3>Inviting team members</H3>
          <P>
            Go to <strong>Team</strong> in the navigation bar and scroll to <strong>Invite team member</strong>. Enter their full name, email address, and role, then click <strong>Send invite</strong>. They will receive an email with a link to set their own password and activate their account. Once they have done this, they will appear as active in your team list. You do not need to share any credentials manually — the invitation handles everything.
          </P>

          <H3>Understanding roles</H3>
          <div className="space-y-2">
            <p><strong>Admin</strong> — full access. Can edit all KLOEs, manage the team, assign tasks, run mock inspections, maintain HR records, and create visitor logins. This role should be held by the Registered Manager only. Senior staff should be given the Staff role instead.</p>
            <p><strong>Staff (User)</strong> — can view all KLOEs and update the ones assigned to them. When they log in, they see their personal &ldquo;My KLOEs&rdquo; list first.</p>
            <p><strong>Visitor</strong> — read-only. Can view everything but cannot change anything. For inspectors and external visitors. Access expires automatically.</p>
          </div>

          <H3>Two-factor authentication</H3>
          <P>
            All Admin and Staff accounts must set up two-factor authentication (2FA) before they can access the platform. When you first log in, you will be guided through setting it up using an authenticator app such as Google Authenticator or Authy. Once set up, every login requires your password plus a six-digit code from the app. This protects your organisation&apos;s compliance data from unauthorised access. Visitor accounts do not require two-factor authentication.
          </P>
          <P>
            <strong>No smartphone?</strong> You can also use a desktop or browser-based authenticator. <strong>Authy</strong> is a free app for Windows and Mac (authy.com). The <strong>Authenticator</strong> browser extension works in Chrome and Firefox (search &ldquo;Authenticator&rdquo; in the relevant add-ons store). <strong>Microsoft Authenticator</strong> is also available as a Windows desktop app from the Microsoft Store. All of these work with the QR code shown during setup.
          </P>

          <H3>Assigning KLOEs to team members</H3>
          <P>
            Open any KLOE from the KLOE tracker. At the top of the page you will see an <strong>Assign this KLOE</strong> panel. Select a team member from the dropdown and click Save. They will see this KLOE in their personal My KLOEs view when they log in. You can assign a KLOE to yourself as well as to other team members.
          </P>

          <H3>Running a mock inspection</H3>
          <P>
            Go to <strong>Mock Inspections</strong> in the navigation bar. A mock inspection walks you through each KLOE and asks you to rate your current evidence as Outstanding, Good, Requires Improvement, or Inadequate. At the end, the platform produces a report showing your self-assessed rating for each key question area. This is a useful tool for spotting gaps before a real CQC inspection. Ratings produced in a mock inspection are for self-assessment only — they do not represent the view of CQC or any regulatory body, and reference codes in the report are AlwaysReady identifiers, not CQC codes.
          </P>

          <H3>Reading the dashboard</H3>
          <P>
            The dashboard shows your overall inspection readiness as a percentage, and breaks it down by each key question area (Safe, Effective, Caring, Responsive, Well-led). The Team workload section shows which staff members have assigned KLOEs and how many are overdue, so you can see at a glance if anyone needs support.
          </P>

          <H3>Uploading evidence files</H3>
          <P>
            Open any KLOE and scroll to the <strong>Evidence files</strong> section. Click <strong>Upload file</strong> and select a document from your device. Accepted formats are PDF, Word (.docx), Excel (.xlsx), and images (JPG or PNG), up to 10 MB per file. Legacy .doc and .xls files are not accepted for security reasons. Files are private and can only be accessed by members of your organisation and any visitors you have given access to.
          </P>
          <P>
            <strong>Important:</strong> only upload governance documents — policies, certificates, risk assessments, and similar records. Do not upload anything containing resident-specific clinical information, care plans, or personal health records.
          </P>

          <H3>Changing your own password</H3>
          <P>
            Go to <strong>Account</strong> in the navigation bar. Enter your current password, choose a new one (at least 8 characters), and confirm it. Click <strong>Change password</strong>. Your new password takes effect immediately.
          </P>

          <H3>Resetting a team member&apos;s password</H3>
          <P>
            Team members can change their own password at any time by going to <strong>Account</strong> in the navigation bar. If a team member has been locked out and cannot log in, go to <strong>Team</strong>, find their name, and click <strong>Reset password</strong>. A new temporary password will be generated and shown on screen — give it to them directly so they can log in and set their own.
          </P>

          <H3>Creating a visitor login before an inspection</H3>
          <div className="space-y-2">
            <Step number={1}>Go to <strong>Team</strong> in the navigation bar.</Step>
            <Step number={2}>Scroll to the <strong>Visitor logins</strong> section at the bottom of the page.</Step>
            <Step number={3}>Click <strong>Create visitor login</strong>. Enter the visitor&apos;s name and decide how many days you want to give them access.</Step>
            <Step number={4}>The login ID and a temporary password will appear on screen. Share these with the inspector so they can log in on their own device.</Step>
            <Step number={5}>Access expires automatically after the number of days you chose. If you need to remove access early, click <strong>Revoke</strong> next to their name in the Visitor logins list.</Step>
          </div>

          <H3>The audit trail</H3>
          <P>
            Every time a KLOE is updated, the platform records who made the change, what changed, and when. This record cannot be altered or deleted. During an inspection, this is powerful evidence that your team is actively managing compliance — not just filling in forms on the day.
          </P>
        </Section>

        {/* ── HR Records ─────────────────────────────────────────────────────── */}
        <Section id="hr-records" label="HR Records" colour="bg-[#014D4E]">
          <P>
            The HR module helps you keep staff records in one place — employment details, compliance dates, training, and holiday allowances. Access is restricted to Admin users. Go to <strong>HR</strong> in the navigation bar to get started.
          </P>

          <H3>The HR overview dashboard</H3>
          <P>
            The top of the HR page shows four RAG summary cards: <strong>DBS</strong>, <strong>Supervision</strong>, <strong>Appraisal</strong>, and <strong>Mandatory Training</strong>. Each card shows what percentage of your team are current, how many are overdue, and how many are due soon. The colour and headline update automatically based on the most urgent status — red for overdue, amber for due soon, green if all current.
          </P>
          <P>
            Below the summary cards, a <strong>Needs attention</strong> section highlights individual staff members with overdue or upcoming dates, so you can act quickly without scrolling through the full staff list.
          </P>

          <H3>Adding a staff member to HR records</H3>
          <P>
            Staff members appear in HR once they have been added to your team via the <strong>Team</strong> page. You do not need to add them separately in HR — their account automatically creates an HR record slot. Click <strong>View</strong> next to any staff member to open their record and fill in their details.
          </P>

          <H3>Employment and compliance details</H3>
          <P>
            Each staff record contains sections for employment information (job title, contracted hours, start date), personal details (date of birth, gender, ethnicity — held under your Equality Act obligations), emergency contact, and compliance fields including DBS check date, right to work, and references. Fill in the relevant fields and click <strong>Save staff record</strong> at the bottom of the form.
          </P>
          <P>
            The <strong>DBS renewal due</strong>, <strong>Supervision next due</strong>, and <strong>Appraisal next due</strong> fields drive the RAG dashboard at the top of the HR overview. Keep these dates up to date to ensure the dashboard reflects your team&apos;s real compliance status.
          </P>

          <H3>Training records</H3>
          <P>
            Scroll to the <strong>Training Records</strong> section on a staff member&apos;s page. A list of training types is shown — click the arrow on any row to expand it. You can record the date the training was completed, how frequently it needs to be renewed, and any notes. The platform calculates the next due date automatically. You can also upload a training certificate directly to the record — PDF, Word (.docx), Excel (.xlsx), JPG, or PNG files up to 10 MB are accepted.
          </P>
          <P>
            Training completion across your team feeds into the <strong>Mandatory Training</strong> card on the HR overview. A training type is counted as complete for a staff member once a completion date has been recorded and the next due date has not passed.
          </P>

          <H3>Holiday allowances</H3>
          <P>
            Scroll to the <strong>Holiday Allowance</strong> section on a staff member&apos;s page. You can record their entitlement and days taken for the current leave year. Holiday can be tracked in days or hours — you can change the unit for your whole organisation by going to <strong>HR</strong> and clicking <strong>Change</strong> next to the holiday unit setting.
          </P>

          <H3>Absence records</H3>
          <P>
            Scroll to the <strong>Absence Records</strong> section on a staff member&apos;s page to record sick leave and other absences. Each absence episode is logged individually with a start date, end date, and the number of days absent (calculated automatically from the dates, but editable if needed). You can select a reason category — Musculoskeletal, Respiratory or Cold and Flu, Mental Health and Stress, Gastrointestinal, Injury, or Other — and add any notes. This builds a complete absence history over time, supporting management review and demonstrating thorough workforce oversight to CQC.
          </P>
          <P>
            Return-to-work interview details can be recorded for each absence episode — whether the interview was completed, the date it took place, and any notes. Return-to-work interviews are a standard HR expectation in the care sector and a CQC inspection point under Safe and Well-led.
          </P>
          <P>
            The section also shows the staff member&apos;s <strong>Bradford Factor</strong> for the rolling 52 weeks — a standard HR measure (S&sup2; × D, where S is the number of separate sickness absences and D is total days absent) displayed as Low, Medium, or High — alongside total sick days in the current leave year.
          </P>

          <H3>Special category data</H3>
          <P>
            Personal details such as date of birth, gender, ethnicity, disability status, and marital status are held in the HR record for equality monitoring purposes, as required under the Equality Act 2010 and your obligations as an employer. This data is visible only to Admin users within your organisation. It is never shared with CQC or any third party.
          </P>
        </Section>

        {/* ── For Staff ──────────────────────────────────────────────────────── */}
        <Section id="for-staff" label="For Staff" colour="bg-[#5b8fa8]">
          <P>
            As a staff member, you have a personal space in AlwaysReady called <strong>My KLOEs</strong>. This shows you the KLOEs your manager has assigned to you. Your job is to keep them up to date so the service is ready for inspection.
          </P>

          <H3>Logging in for the first time</H3>
          <P>
            Your manager will send you an invitation email from AlwaysReady. Click the <strong>Accept invite</strong> button in the email, which will take you to the platform where you can set your own password. Once your password is set, you can log in at any time using your email address and that password. If you do not receive the invitation email, check your junk folder and ask your manager to resend it.
          </P>

          <H3>Logging in after your first visit</H3>
          <P>
            Go to the AlwaysReady login page and enter your email address and password. If you have forgotten your password, click <strong>Forgot password</strong> on the login page to receive a reset link by email, or ask your admin to reset it for you from the Team page.
          </P>

          <H3>Your My KLOEs page</H3>
          <P>
            When you log in, you will see a list of KLOEs that have been assigned to you, sorted with the most urgent at the top. Each one shows a RAG colour, the current status, and when it is next due. Click on any KLOE to open it and update it.
          </P>

          <H3>Updating a KLOE</H3>
          <div className="space-y-2">
            <Step number={1}>Click on the KLOE you want to update from your My KLOEs list.</Step>
            <Step number={2}>Scroll down to the <strong>Update this KLOE</strong> section.</Step>
            <Step number={3}>Set the status to <strong>Completed</strong> if the review is done, or <strong>In progress</strong> if you are still working on it.</Step>
            <Step number={4}>Enter the date you carried out the review and when the next review should happen.</Step>
            <Step number={5}>Add any notes or the location of your evidence (for example, &ldquo;Folder B, shelf 2 in the office&rdquo; or a link to a shared drive).</Step>
            <Step number={6}>Click <strong>Save update</strong>. Your changes are saved immediately and added to the audit trail.</Step>
            <Step number={7}>Optionally, scroll to <strong>Evidence files</strong> and upload a supporting document — a policy, certificate, or risk assessment relevant to this KLOE.</Step>
          </div>

          <H3>What the RAG colours mean</H3>
          <P>
            See the <a href="#understanding-rag" className="text-brand font-medium hover:underline">Understanding RAG status</a> section above for a full explanation.
          </P>

          <H3>Can I see KLOEs I have not been assigned?</H3>
          <P>
            Yes — you can browse the full KLOE list from the <strong>KLOEs</strong> link in the navigation bar. You can read any KLOE, but you can only save changes to the ones assigned to you.
          </P>

          <H3>Changing your password</H3>
          <P>
            Go to <strong>Account</strong> in the navigation bar. Enter your current password, choose a new one (at least 8 characters), and confirm it. If you have forgotten your password and cannot log in, click <strong>Forgot password</strong> on the login page or ask your admin to reset it for you.
          </P>
        </Section>

        {/* ── For Visitors ───────────────────────────────────────────────────── */}
        <Section id="for-visitors" label="For Visitors" colour="bg-[#6b7280]">
          <P>
            As a visitor, you have read-only access to the AlwaysReady platform. This means you can view all the information in the platform, but you cannot make any changes. Your login has been set up specifically for your visit and will stop working automatically after a set number of days.
          </P>

          <H3>What you can see</H3>
          <div className="space-y-1">
            <p><strong>Dashboard</strong> — an overview of the service&apos;s overall inspection readiness, broken down by each key question area.</p>
            <p><strong>KLOE tracker</strong> — the full list of Key Lines of Enquiry, showing current status, RAG rating, priority, and who each KLOE is assigned to.</p>
            <p><strong>Audit trail</strong> — a complete, time-stamped record of every update made to each KLOE, including who made the change and what was changed.</p>
            <p><strong>Trend over time</strong> — a graph showing how the service&apos;s readiness has changed over recent weeks and months.</p>
            <p><strong>Daily review report</strong> — a summary of current compliance status across all key question areas.</p>
            <p><strong>Inspection pack</strong> — a printable summary of all KLOE data, designed to support an inspection visit.</p>
          </div>

          <H3>What the RAG colours mean</H3>
          <P>
            See the <a href="#understanding-rag" className="text-brand font-medium hover:underline">Understanding RAG status</a> section above for a full explanation. The audit trail beneath each KLOE shows the full history of how the service has been managing that area over time.
          </P>

          <H3>When your access expires</H3>
          <P>
            Your login has been set up with an expiry date. Once that date passes, you will no longer be able to log in. If you need access for longer, please contact the manager who provided your login details.
          </P>
        </Section>

        {/* ── FAQs ───────────────────────────────────────────────────────────── */}
        <Section id="faqs" label="Frequently asked questions" colour="bg-[#014D4E]">
          <div className="space-y-4">
            <FAQ
              question="How does a new team member get access?"
              answer="An Admin goes to Team in the navigation bar, fills in the new person's name, email address, and role, and clicks Send invite. The new team member receives an email with a link to set their own password. Once they have done this, their account is active. No credentials need to be shared manually."
            />
            <FAQ
              question="What if someone doesn't receive their invite email?"
              answer="Ask them to check their junk or spam folder first. If it is not there, go to Team, find their name, and use the Reset password option to generate a fresh link, or delete their account and send a new invite. Make sure the email address entered was correct."
            />
            <FAQ
              question="What happens if a team member forgets their password?"
              answer="They can click Forgot password on the login page and receive a reset link by email. Alternatively, an Admin can go to Team, find their name, and click Reset password — a new temporary password will be shown on screen to give to them directly."
            />
            <FAQ
              question="What is two-factor authentication and why is it required for Admins?"
              answer="Two-factor authentication (2FA) means that logging in requires both your password and a six-digit code from an authenticator app. It is required for all Admin and Staff accounts because they have access to sensitive compliance data. It significantly reduces the risk of unauthorised access even if a password is compromised. Visitor accounts do not require 2FA. If a staff member does not have a smartphone, they can use a desktop app such as Authy (Windows/Mac) or Microsoft Authenticator, or the Authenticator browser extension for Chrome or Firefox — all work with the setup QR code."
            />
            <FAQ
              question="Can I change my own password?"
              answer="Yes — go to Account in the navigation bar. Enter your current password, choose a new one, and confirm it. Your new password takes effect immediately. If you have forgotten your current password and cannot log in, use the Forgot password link on the login page."
            />
            <FAQ
              question="Can I upload documents to a KLOE?"
              answer="Yes. Open any KLOE and scroll to the Evidence files section. You can upload PDFs, Word documents, Excel files, and images up to 10 MB each. Only upload governance documents — policies, certificates, and risk assessments. Do not upload anything containing resident-specific clinical information or care plans."
            />
            <FAQ
              question="What does 'overdue' mean?"
              answer="A KLOE is overdue when it was marked as completed but the next review date has now passed. It shows as Red. This does not mean the service is non-compliant — it means the review needs to be done again to confirm everything is still in order."
            />
            <FAQ
              question="What is the HR module for?"
              answer="The HR module lets Admins keep staff records in one place — employment details, DBS check dates, supervision and appraisal due dates, training records, and holiday allowances. The HR overview dashboard shows at a glance which staff members are overdue or coming up for review. It is separate from the KLOE compliance tracker and is only visible to Admin users."
            />
            <FAQ
              question="How does the HR RAG dashboard work?"
              answer="The four cards at the top of the HR page (DBS, Supervision, Appraisal, Mandatory Training) show the compliance status across your whole team. Each card shows the percentage overdue, due soon, or current. If any staff member is overdue, the card turns red and shows the percentage overdue. The Needs attention section below lists those individuals by name so you can act quickly."
            />
            <FAQ
              question="Can I track staff absences and sick leave?"
              answer="Yes. The HR module includes an Absence Records section on each staff member's profile. You can log each absence episode individually with a start date, end date, days absent, a reason category, and notes. Go to HR in the navigation bar, open a staff member's record, and scroll to Absence Records."
            />
            <FAQ
              question="Does AlwaysReady calculate the Bradford Factor?"
              answer="Yes. The Bradford Factor (S² × D, where S is the number of separate sickness absences and D is total days absent over a rolling 52-week period) is calculated automatically for each staff member from their logged absence records and displayed as Low, Medium, or High. You do not need to calculate it manually."
            />
            <FAQ
              question="Does AlwaysReady track return-to-work interviews?"
              answer="Yes. Each absence episode includes fields to record whether a return-to-work interview was completed, the date it took place, and any notes. Return-to-work interviews are a standard HR expectation and a CQC inspection point under Safe and Well-led."
            />
            <FAQ
              question="What is a mock inspection?"
              answer="A mock inspection is a self-assessment tool. It walks you through each KLOE and asks you to rate your evidence as Outstanding, Good, Requires Improvement, or Inadequate. At the end it produces a report showing a self-assessed rating for each key question area. It is useful for identifying gaps before a real CQC inspection. The ratings are for internal use only and do not represent the view of CQC."
            />
            <FAQ
              question="Can two people update the same KLOE at the same time?"
              answer="Yes, but the last person to save will overwrite the previous save. To avoid confusion, it is best to agree with your team who is responsible for each KLOE. Use the assignment feature to make this clear."
            />
            <FAQ
              question="Can I delete a record or undo a change?"
              answer="No. The audit trail is permanent and cannot be altered or deleted. This is by design — it protects the service by proving that records are genuine and have not been tampered with. If you make a mistake, simply save a corrected update and it will appear as the latest entry."
            />
            <FAQ
              question="Who can see my updates?"
              answer="All admins in your organisation can see all updates. Staff can view all KLOEs but can only edit the ones assigned to them. Visitors can read everything but cannot change anything. Nobody outside your organisation can see your data."
            />
            <FAQ
              question="How do I know when a KLOE is coming up for review?"
              answer="The KLOE tracker shows the next review date for every KLOE. KLOEs due within 30 days show as Amber. The daily report also lists upcoming reviews. Check the dashboard regularly — it takes less than a minute to scan."
            />
            <FAQ
              question="What happens when a visitor's access expires?"
              answer="Their login simply stops working. They will see an error if they try to log in after the expiry date. No data is deleted. The admin can revoke access early at any time from the Team page, or extend it by creating a new visitor login."
            />
            <FAQ
              question="Is the information in AlwaysReady shared with CQC?"
              answer="No. AlwaysReady is a private tool for your service. The data you enter is only visible to people you give access to. It is not connected to any CQC systems. You choose what to share and with whom, by creating visitor logins."
            />
            <FAQ
              question="Does AlwaysReady guarantee a good CQC rating?"
              answer="No — and it's important to be clear about this. AlwaysReady helps you organise your evidence, track your compliance activity, and prepare for inspection. Your readiness score and RAG status are calculated from your own self-assessed inputs, not from an independent audit of your service. CQC inspection outcomes depend on a wide range of factors that are entirely outside our knowledge or control — how your team performs on the day, what inspectors observe, and how evidence is assessed against the standards. What AlwaysReady does is help you arrive at inspection better organised and with your evidence ready. That is a real advantage — but it is not a guarantee."
            />
            <FAQ
              question="How long is our data kept, and can we export it?"
              answer="Your data is retained for as long as your subscription is active, plus 30 days after it ends to give you time to export everything. You can download your data at any time from Account → Organisation — two exports are available: a CSV of all your compliance records, audit trail, and team data, and a ZIP archive of all your uploaded evidence files. No need to contact support."
            />
            <FAQ
              question="Can I export my evidence files?"
              answer="Yes. Go to Account → Organisation and use the Download evidence archive button. This creates a ZIP file containing all the documents your team has uploaded across all KLOEs. The CSV records export (same page) covers everything else — compliance records, audit trail, team list, and HR data."
            />
            <FAQ
              question="What sub-services does AlwaysReady support?"
              answer="You can configure which specialist sub-services your organisation provides from the Admin settings page. Currently supported: Dementia Care, Learning Disabilities, Mental Health, End of Life Care, Acquired Brain Injury (ABI), Physical Disabilities, Bariatric Care, Sensory Impairment, Epilepsy, and Autism. Sub-service selection is reflected in your compliance tracking. If you provide a sub-service that is not listed, let us know via the Support tab."
            />
            <FAQ
              question="What is the newsletter drafting tool and who can use it?"
              answer="The newsletter drafting tool is an AI-assisted feature available to Admin users. You choose your audience, a topic or occasion, a tone, and add any key points — the platform generates a ready-to-copy draft in seconds. It is a drafting aid only: AlwaysReady never sends newsletters on your behalf, and all output should be reviewed before use. Do not include personal details of residents, patients, families, or individual staff in your prompts. Each organisation can generate up to 10 drafts per calendar month."
            />
            <FAQ
              question="Is there a dark mode?"
              answer="Yes. Click the sun/moon icon in the navigation bar to switch between light and dark mode. The platform will also follow your device's system preference by default if you haven't set a manual preference."
            />
            <FAQ
              question="Can I reply to a support ticket by email?"
              answer="Yes. When you receive a reply to your support ticket, you can reply directly to that email and your response will be threaded back into the ticket automatically. You do not need to log in to the platform to continue the conversation."
            />
            <FAQ
              question="What should I do if something looks wrong in the platform?"
              answer="Contact your admin in the first instance. If the issue appears to be a technical problem with the platform itself, the admin should raise a support ticket using the Support link in the navigation bar."
            />
            <FAQ
              question="Why am I signed out when I close my browser tab?"
              answer="AlwaysReady automatically signs you out when you close your browser tab. This is a security feature designed to protect resident and staff data on shared devices — it ensures that nobody can access your account simply by opening the browser after you have finished. When you are ready to use AlwaysReady again, simply sign back in. If you are using a personal device and find this inconvenient, contact your admin — they may be able to advise on alternative ways to keep your session active."
            />
          </div>
        </Section>

        {/* ── Platform FAQ (V1) ──────────────────────────────────────────────── */}
        <Section id="v1-faqs" label="Platform FAQ" colour="bg-[#014D4E]">

          <H3>How the Platform Works</H3>
          <div className="space-y-4">
            <FAQ question="How does the AlwaysReady platform work?" answer="AlwaysReady is structured around the five CQC key questions, their linked KLOEs, and the CQC 'I' questions. For each KLOE or 'I' question, you record a RAG status, set a review date, add notes, and upload evidence. This tracks your compliance position over time. Your dashboard provides a live view of where you stand, and your Daily Review Report highlights what needs attention today." />
            <FAQ question="What does a daily routine with AlwaysReady look like?" answer="You log in to your dashboard and review your Daily Review Report, which highlights the KLOEs most overdue for review and those rated Red or Amber. You update statuses, add notes, upload evidence, and set next review dates. Over time, this builds a live, accurate picture of your compliance health." />
            <FAQ question="Can I see a snapshot of our compliance status?" answer="Yes. Your Readiness Dashboard provides a live view of your compliance position across all five CQC key questions, including RAG ratings, priority indicators, and review dates. You can see at a glance where you are strong and where to focus next." />
            <FAQ question="What is the RAG status system?" answer="RAG stands for Red, Amber, Green — a colour-coded status system used across the platform to show inspection readiness at a glance. Green means a KLOE has been reviewed and is up to date. Amber means it is in progress or due for review within 30 days. Red means it is overdue and requires urgent attention. Grey means no review has yet been recorded. The RAG status updates automatically based on the dates and statuses you enter — you never have to set it manually." />
            <FAQ question="Is there a way to test how prepared we are before a real inspection?" answer="Yes — AlwaysReady includes a mock inspection tool. It guides you through each KLOE and prompts you to self-assess your evidence as Outstanding, Good, Requires Improvement, or Inadequate. At the end, it produces a report showing a self-assessed rating for each of the five key question areas. These ratings are for internal self-assessment only and do not represent the views of CQC or any regulatory body." />
            <FAQ question="Does AlwaysReady work on a tablet or mobile?" answer="Yes. AlwaysReady is a web-based platform optimised to run in any browser — on desktops, laptops, tablets, or smartphones. No app download is required." />
            <FAQ question="Does AlwaysReady work offline?" answer="No. AlwaysReady requires an internet connection. All data is securely stored in the cloud, so you can access it from any device with a web browser." />
            <FAQ question="Is there a dark mode?" answer="Yes. Click the sun/moon icon in the navigation bar to switch between light and dark modes. The platform also respects your device's system preference by default if you have not set a manual preference." />
            <FAQ question="Why am I signed out when I close my browser tab?" answer="AlwaysReady automatically signs you out when you close the browser tab. This deliberate security feature protects compliance and staff data on shared devices — it ensures nobody can access your account simply by reopening the browser after you have finished. When you are ready to use AlwaysReady again, simply sign back in." />
          </div>

          <H3>The KLOE Tracker</H3>
          <div className="space-y-4">
            <FAQ question="Can I add my own KLOEs or customise the list?" answer="No. The 24 KLOEs are fixed within the CQC framework and cannot be added to or removed. This ensures your compliance records always map accurately to the framework used by inspectors. However, you can add your own notes and evidence to each KLOE." />
            <FAQ question="What is the priority level for?" answer="The priority level (1 to 5, with 1 highest) reflects how serious non-compliance in that area would be for your service. You set it yourself, based on your knowledge of your service. Priority is used to sort your Daily Review Report, so the most critical overdue KLOEs always appear at the top." />
            <FAQ question="What is the difference between evidence location notes and uploading a file?" answer="Evidence location notes are a free-text field where you specify where a document is stored — for example, a shared drive folder, a filing cabinet, or a policy management system. Uploading a file attaches the document to the KLOE in AlwaysReady. You can use one, the other, or both for each KLOE." />
            <FAQ question="How does review frequency work?" answer="For each KLOE, you can set how often it needs to be reviewed — monthly, quarterly, annually, or a custom number of days. When you record a review date, the platform automatically calculates the next review due date based on the frequency you have set. This determines the RAG status and your Daily Review Report." />
            <FAQ question="Can I assign the same KLOE to more than one person?" answer="No — each KLOE can be assigned to one team member at a time. If ownership needs to change, an Admin can reassign it at any time from the KLOE detail page." />
          </div>

          <H3>Document and Evidence Management</H3>
          <div className="space-y-4">
            <FAQ question="How does document management work in AlwaysReady?" answer="You can upload evidence files directly to each KLOE. Every upload is virus-scanned, time-stamped, and linked to the relevant key question, so your evidence trail builds naturally as you work. Everything is securely stored and easy to retrieve." />
            <FAQ question="What types of documents can I upload?" answer="You can upload any non-clinical governance-related document: policies, audits, meeting minutes, training records, anonymised incident reviews, and action plans. Supported file types include PDF, Word (.docx), Excel (.xlsx), and images (JPG and PNG). The maximum file size is 10 MB per file. Legacy .doc and .xls formats are not accepted — please save files in the current format before uploading." />
            <FAQ question="Is there a limit on file size?" answer="Each file can be up to 10 MB. There is no limit on the number of files you can upload." />
            <FAQ question="Can I delete files I have uploaded?" answer="Yes. Uploaded evidence files can be deleted directly from the KLOE by clicking the delete button." />
            <FAQ question="Does AlwaysReady provide policy templates?" answer="No. AlwaysReady does not provide generic policy templates because they can pose legal and clinical risks if not tailored. Instead, it helps you organise, evidence, and track your service-specific policies." />
            <FAQ question="Can I export data from AlwaysReady?" answer="Yes. The Inspection Pack generates a one-click, printable summary of your compliance position across all KLOEs. You can also download a full CSV export of all your compliance records and a separate ZIP archive of all your uploaded evidence files — both available at any time from Account > Organisation, without needing to contact support." />
            <FAQ question="Can I export my evidence files separately?" answer="Yes. Go to Account > Organisation, then click Download evidence archive. This creates a ZIP file containing all documents your team has uploaded across all KLOEs. The records export on the same page covers your compliance data, audit trail, and team information." />
          </div>

          <H3>CQC Framework and Governance</H3>
          <div className="space-y-4">
            <FAQ question="Does AlwaysReady guarantee a good CQC rating?" answer="No. AlwaysReady helps you organise your evidence, track your compliance activity, and prepare for inspection. Your readiness score and RAG status are calculated from your self-assessed inputs, not from an independent audit of your service. CQC inspection outcomes depend on a wide range of factors entirely outside our knowledge or control. AlwaysReady helps you arrive at inspection better organised and with your evidence ready. That is a real advantage — but it is not a guarantee." />
            <FAQ question="How does AlwaysReady support the CQC regulatory framework?" answer="AlwaysReady is built around the five CQC key questions — Safe, Effective, Caring, Responsive, and Well-led — and their associated KLOEs. Every feature on the platform maps to this framework, so you always know what to collect, where it fits, and how to demonstrate it." />
            <FAQ question="Does AlwaysReady provide an audit trail?" answer="Yes. AlwaysReady maintains a secure, time-stamped record of every change made on the platform — including who made the change, what was changed, and when. This record cannot be altered or deleted." />
            <FAQ question="Does AlwaysReady keep a record of changes for inspection purposes?" answer="Yes. Every update to a KLOE — including who made it, what changed, and when — is permanently recorded in an audit trail. During an inspection, it provides verifiable evidence that your team has been actively managing compliance over time, rather than merely preparing on the day." />
            <FAQ question="What happens to our KLOEs if the CQC framework changes?" answer="AlwaysReady is designed so that any updates to the framework can be applied with a simple data change, not a rebuild. Your existing compliance records remain unaffected by framework updates." />
          </div>

          <H3>Team Access and Workforce</H3>
          <div className="space-y-4">
            <FAQ question="How does team access work in AlwaysReady?" answer="You can invite your team and assign each person a role — Admin, User, or Viewer. Each role has a different level of access, allowing you to share governance responsibilities while maintaining control over who can see and change what." />
            <FAQ question="Can I control user permissions?" answer="Yes. Role-based permissions let you control who can view, update, or manage different areas of the platform. Viewer access can also be set to expire." />
            <FAQ question="Can more than one person access the account?" answer="Yes. You can invite as many team members as needed. Roles: Admin (full access), User (can update their assigned KLOEs), or Viewer (read-only). We recommend that only the Registered Manager holds the Admin role." />
            <FAQ question="Who should have the Admin role?" answer="We recommend that only the Registered Manager holds the Admin role. Admin users have full access to the platform — including HR records, staff employment data, training records, absence history, and team management settings. This is sensitive information that should only be accessible to those with a genuine business need. Most team members should be given the Staff role, which allows them to work on their assigned KLOEs without seeing HR records or management settings." />
            <FAQ question="Can the Registered Manager give their deputy Admin access?" answer="Yes. The platform allows the Admin role to be assigned to any team member. If the Registered Manager wants their deputy to have full access — for example, to provide cover during leave — they can assign the Admin role from the Team page in Account settings. This should be a deliberate decision, given the level of access it grants, including full visibility of all HR records." />
            <FAQ question="How do staff members get access?" answer="Admins add team members to the platform via the Team section. Enter the team member's name, email address, and role, then click Send invite. The team member receives login details by email and sets their own password on first login." />
            <FAQ question="Can I give a CQC inspector read-only access during a visit?" answer="Yes. Create a Visitor login on the Team page. You set the access duration, and it expires automatically. The visitor can view the KLOE tracker, audit trail, readiness trend, and inspection pack. They cannot make any changes, and you can revoke access at any time before expiry." />
          </div>

          <H3>HR Module</H3>
          <div className="space-y-4">
            <FAQ question="What is the HR module?" answer="The HR module enables Admins to manage staff and compliance records. You can record employment details, DBS check dates, supervision and appraisal due dates, training completions, and holiday allowances for each staff member. An overview dashboard provides a clear view of the team's compliance status at a glance." />
            <FAQ question="Does AlwaysReady track mandatory training?" answer="Yes. The HR module includes a training records section for each staff member. You can record completion dates, set renewal frequencies, upload certificates, and view automatically calculated next-due dates." />
            <FAQ question="Can staff complete daily care notes in AlwaysReady?" answer="No. AlwaysReady is not a care-planning or daily-notes system. It focuses on governance, oversight, and inspection-readiness, not on recording care." />
            <FAQ question="What is special category data and why does AlwaysReady hold it?" answer="Special category data includes fields such as date of birth, gender, ethnicity, disability status, and marital status. AlwaysReady stores this data in staff HR records for equality monitoring, as required by the Equality Act 2010 for employers. This data is visible only to Admin users within your organisation and is never shared with CQC or any third party." />
            <FAQ question="Can holiday be tracked in hours instead of days?" answer="Yes. Holiday allowances can be tracked in days or hours. You can change the unit for your whole organisation on the HR settings page." />
            <FAQ question="Does AlwaysReady track sick leave and absence?" answer="Yes. The HR module includes an absence records section for each staff member where you log each episode individually — recording start and end dates, the number of days absent, a reason category, and any notes. This builds a complete absence history over time, which supports management review and demonstrates thorough workforce oversight to CQC." />
            <FAQ question="What types of absence can I record?" answer="You can record sick leave and other absences. For each episode you select a reason category: Musculoskeletal, Respiratory or Cold and Flu, Mental Health and Stress, Gastrointestinal, Injury, or Other. The number of days absent is calculated automatically from the start and end dates but can be edited manually." />
            <FAQ question="Does AlwaysReady calculate the Bradford Factor?" answer="Yes. The Bradford Factor (S² × D, where S is the number of separate sickness absences and D is total days absent in a rolling 52-week period) is calculated automatically from logged absence records and displayed as Low, Medium, or High." />
            <FAQ question="Does AlwaysReady track return-to-work interviews?" answer="Yes. Each absence record includes fields to record whether a return-to-work interview has been completed, the date it took place, and any notes. Return-to-work interviews are a standard HR expectation in the care sector and a CQC inspection point under Safe and Well-led." />
            <FAQ question="Who can see absence records?" answer="Absence records are visible to Admin users only. Staff and Viewer accounts cannot access HR data, including absence records." />
          </div>

          <H3>Specialist Services and Sub-Specialisms</H3>
          <div className="space-y-4">
            <FAQ question="Does AlwaysReady cater for specialist care such as dementia or learning disabilities?" answer="Yes. When you sign up, you select your service type and any sub-specialisms you offer. AlwaysReady tailors the compliance checklist accordingly, adding relevant items for your service context." />
            <FAQ question="What sub-specialisms does AlwaysReady support?" answer="AlwaysReady currently supports the following sub-specialisms: Dementia Care, Learning Disabilities, Mental Health, End of Life Care, Acquired Brain Injury (ABI), Physical Disabilities, Bariatric Care, Sensory Impairment, Epilepsy, and Autism. Sub-specialisms can be selected at sign-up or updated in your account settings." />
          </div>

          <H3>Newsletter Drafting Tool</H3>
          <div className="space-y-4">
            <FAQ question="What is the newsletter drafting tool?" answer="The newsletter drafting tool is an AI-assisted feature available to Admin users. You choose your audience (staff, families and residents, or both), a topic or occasion, and a tone, then add any key points — the platform generates a ready-to-copy draft in seconds. It is a drafting aid only: AlwaysReady never sends newsletters on your behalf, and all output should be reviewed and edited before use." />
            <FAQ question="Who can use the newsletter drafting tool?" answer="The tool is available to Admin users. Staff and Viewer logins do not have access." />
            <FAQ question="Is there a limit on how many newsletter drafts I can generate?" answer="Yes — each organisation can create up to 10 drafts per calendar month." />
            <FAQ question="Can I include resident or patient details in my newsletter prompt?" answer="No. You must not include personal details of residents, patients, families, or individual staff members in the drafting tool. The tool is for generating general compliance communications only. A notice reminding you of this is prominently displayed at the top of the tool." />
            <FAQ question="Does AlwaysReady send newsletters on my behalf?" answer="No. AlwaysReady generates a draft for you to copy and paste into your preferred channel — email, WhatsApp, a printed notice, or any other channel. You remain fully in control of what goes out and when." />
          </div>

          <H3>Inspection Day</H3>
          <div className="space-y-4">
            <FAQ question="How does AlwaysReady help on inspection day?" answer="Your Inspection Pack provides a one-click, printable summary of your compliance position for every KLOE, with statuses, priorities, and evidence notes already organised and time-stamped." />
            <FAQ question="What if an inspector disputes our records?" answer="Every entry is time-stamped and linked to a specific KLOE. The audit trail shows exactly who made each change and when, providing a robust basis for any challenge to factual accuracy." />
            <FAQ question="Can AlwaysReady help with factual accuracy challenges?" answer="Yes. You can quickly export relevant records and evidence to support your challenge, allowing you to respond clearly and confidently within tight deadlines." />
          </div>

          <H3>Security and Data</H3>
          <div className="space-y-4">
            <FAQ question="How secure is AlwaysReady?" answer="AlwaysReady uses enterprise-grade infrastructure. All data is encrypted in transit and at rest, hosted on infrastructure compliant with UK GDPR standards, and protected by role-based access controls and multi-factor authentication." />
            <FAQ question="Where is my data stored?" answer="On secure cloud infrastructure that meets the data protection standards required for regulated sectors in the UK." />
            <FAQ question="Is AlwaysReady GDPR compliant?" answer="Yes. AlwaysReady operates in full compliance with UK GDPR. Full details are available in the Privacy Policy at alwaysready.uk/legal." />
            <FAQ question="Who can access my data?" answer="Only the users you authorise. AlwaysReady staff do not access your service data without your permission." />
            <FAQ question="Is our account secure?" answer="Yes. All accounts require two-factor authentication (2FA). Data is stored in an encrypted, access-controlled database." />
            <FAQ question="Which authenticator apps work with AlwaysReady?" answer="AlwaysReady works with any TOTP-compatible authenticator app, including Google Authenticator, Authy, and Microsoft Authenticator. If you do not have a smartphone, you can also use a browser-based authenticator extension for Chrome or Firefox, or the Authy desktop app for Windows and Mac." />
            <FAQ question="Do Visitor accounts need two-factor authentication?" answer="No. Two-factor authentication is required only for Admin and Staff accounts. Visitor accounts, which are read-only and time-limited, are not subject to 2FA." />
            <FAQ question="What if I lose access to my authenticator app?" answer="You can add another authenticator app at any time through the Account section of your dashboard. You do not need to contact us to regain access." />
            <FAQ question="Does AlwaysReady share our data with CQC?" answer="No. The data you enter into AlwaysReady is private and visible only to those you grant access. AlwaysReady does not submit any data to CQC, does not connect to any internal CQC system, and does not share your compliance position with any regulator or third party." />
            <FAQ question="Does AlwaysReady connect to CQC at all?" answer="Yes — but only in one direction and solely to read publicly available information. AlwaysReady connects to the CQC Syndication API to retrieve your service's current CQC rating, registered service name, and last inspection date. This connection is read-only. No data from your AlwaysReady account is sent to CQC. AlwaysReady is neither affiliated with nor endorsed by the Care Quality Commission." />
            <FAQ question="What CQC data does AlwaysReady display, and where does it come from?" answer="AlwaysReady displays your current overall CQC rating, your registered service name as recorded by CQC, and the date of your most recent CQC inspection, along with a direct link to your service's CQC page. This data is sourced from the CQC Syndication API and is refreshed automatically every 24 hours." />
            <FAQ question="Does entering my CQC Location ID at sign-up send any information to CQC?" answer="No. AlwaysReady uses the Location ID to look up your service on the CQC public register and confirm its validity. CQC receives no notification of your sign-up, and no information from your account is shared with them." />
          </div>

          <H3>Pricing and Subscription</H3>
          <div className="space-y-4">
            <FAQ question="Can I cancel my subscription?" answer="Yes, at any time via the Account section. No long-term contracts or cancellation penalties apply. Access continues until the end of the current billing period." />
            <FAQ question="How do I update my payment details?" answer="Go to Account > Billing, then click 'Manage subscription'. This opens the Stripe billing portal, where you can update your payment method, view invoices, and manage your subscription. AlwaysReady does not store any card or financial data — everything is handled securely by Stripe." />
            <FAQ question="What happens if a payment fails?" answer="If a payment fails, you will be notified by email. Go to Account > Billing, then click 'Manage subscription' to update your payment method in the Stripe billing portal. If the payment cannot be collected, access to the platform may be suspended until the issue is resolved." />
            <FAQ question="Can I download my data before I cancel?" answer="Yes. You can download a full export of your compliance records and a ZIP archive of your evidence files at any time from Account > Organisation. Your data is retained for 30 days after cancellation, during which you can still export everything." />
            <FAQ question="Is there a charity discount?" answer="Yes — registered charities receive a discount on every monthly payment for the duration of their subscription. Provide your charity registration number at sign-up, and the discount is applied automatically once your registration is verified." />
            <FAQ question="Can we use AlwaysReady for more than one service?" answer="Each account is for a single CQC-registered service location. If you operate multiple services, each requires its own account. Contact support@alwaysready.uk to discuss multi-site pricing." />
            <FAQ question="What is included in the subscription?" answer="Full platform access, evidence file storage, KLOE tracker, readiness dashboard, daily review report, audit trail, inspection pack, HR module, mock inspection tool, newsletter drafting tool, team access with role-based permissions, and support. Everything is included." />
          </div>

          <H3>Support and Contact</H3>
          <div className="space-y-4">
            <FAQ question="What support is available if we have a problem?" answer="Raise a support ticket from within the platform via the Support link in the navigation bar, or email support@alwaysready.uk." />
            <FAQ question="How do I contact AlwaysReady?" answer="Website visitors can use the contact form at alwaysready.uk/contact. Existing platform users should open a support ticket in the platform or email support@alwaysready.uk." />
            <FAQ question="Can I reply to a support ticket by email?" answer="Yes. When you receive a reply to your support ticket by email, you can reply directly to that email and your response will be automatically threaded back into the ticket. You do not need to log in to the platform to continue the conversation." />
          </div>

          <H3>Free Trial</H3>
          <div className="space-y-4">
            <FAQ question="What is included in the free trial?" answer="Everything — KLOE tracker, readiness dashboard, daily review report, evidence uploads, audit trail, inspection pack, HR module, mock inspection tool, newsletter drafting tool, and team access. Data entered during the trial is retained if you subscribe." />
            <FAQ question="Which service types does AlwaysReady currently support?" answer="Eleven service types: ARBD Specialist Care Homes, Community Drug and Alcohol Services, Dual-Registered Care Homes, Extra Care Housing, Homecare Agencies, Nursing Homes, Residential Care Homes, Residential Rehabilitation Services, Shared Lives Schemes, Specialist Colleges, and Supported Living. Each has a tailored checklist aligned with CQC guidance." />
            <FAQ question="Is my data safe, and what happens to it if I do not subscribe?" answer="Your data is stored securely and never shared with third parties. If you do not subscribe, your data is retained for 30 days and can be downloaded at any time from Account > Organisation. After 30 days, it is permanently deleted. You can also request early deletion by contacting us." />
            <FAQ question="What happens when my free trial ends?" answer="You will be invited to subscribe. There is no automatic charge or obligation to do so." />
            <FAQ question="Can I extend my free trial?" answer="Contact us at support@alwaysready.uk, and we will do our best to help." />
          </div>

        </Section>

      </div>

        {/* ── Data Security ──────────────────────────────────────────────────── */}
        <Section id="data-security" label="Data Security" colour="bg-[#014D4E]">
          <H3>Your data is safe with AlwaysReady</H3>
          <P>We understand that the information you hold about your service is sensitive. This page explains the technical and operational measures we have in place to protect your data.</P>

          <H3>Data isolation</H3>
          <P>Every AlwaysReady account is completely separate from every other. We use Row Level Security (RLS) at the database level — a technical control that means a user from one organisation can never access, view, or modify data belonging to another organisation, even in the unlikely event of a software error. Your data is yours alone.</P>

          <H3>Access controls</H3>
          <P>AlwaysReady gives you full control over who can access your account and what they can do.</P>
          <div className="space-y-1">
            <p><strong>Admin</strong> — full access to view, edit, and manage all KLOEs, assign tasks, and manage your team. Typically the Registered Care Manager.</p>
            <p><strong>Staff</strong> — can view all KLOEs and update the ones assigned to them. Cannot change team settings or access management.</p>
            <p><strong>Visitor</strong> — read-only access, designed for CQC inspectors and external reviewers. Visitor access expires automatically on the date you set, and can be revoked instantly at any time.</p>
          </div>
          <P>No one outside your organisation can access your data unless you explicitly create a login for them.</P>

          <H3>Permanent audit trail</H3>
          <P>Every change made in AlwaysReady is permanently recorded — who made it, what was changed, and when. This record cannot be altered or deleted by anyone, including AlwaysReady staff. This protects both your service and your team.</P>

          <H3>Secure connections</H3>
          <P>All data transmitted between your device and AlwaysReady is encrypted using HTTPS (TLS). This applies to every page, every login, and every data update. There are no unencrypted connections.</P>

          <H3>Hosting and infrastructure</H3>
          <P>AlwaysReady is built on enterprise-grade infrastructure used by thousands of businesses worldwide.</P>
          <div className="space-y-1">
            <p><strong>Application:</strong> hosted on Vercel, a global cloud platform with automatic HTTPS, DDoS protection, and 99.99% uptime SLA.</p>
            <p><strong>Database:</strong> hosted on Supabase, built on PostgreSQL — one of the most trusted and battle-tested database systems available. All data is encrypted at rest and in transit.</p>
            <p>No data is stored on AlwaysReady&apos;s own servers. We rely entirely on these specialist providers whose core business is secure, reliable infrastructure.</p>
          </div>

          <H3>Your credentials</H3>
          <P>Your password is never stored by AlwaysReady in plain text. Authentication is handled by Supabase Auth, which uses industry-standard bcrypt hashing. We never have access to your password.</P>
          <P>Staff members who do not have email addresses use a unique login ID generated by the system — no personal email address is required, reducing the risk of credential reuse from other services.</P>

          <H3>GDPR</H3>
          <P>AlwaysReady acts as a <strong>data processor</strong> on your behalf. You remain the <strong>data controller</strong> for the information you hold about your service and your team. We process your data only to provide the AlwaysReady service and for no other purpose.</P>
          <P>We do not sell your data, share it with third parties, or use it for advertising. A formal Data Processing Agreement (DPA) is available on request.</P>

          <H3>Uploaded file protection</H3>
          <P>All uploaded files pass through a secure processing pipeline before being stored.</P>
          <div className="space-y-1">
            <p><strong>File type validation:</strong> every uploaded file is inspected at the byte level before storage. We check the actual file signature, not just the file name or extension, ensuring that files cannot be disguised as a safe format. Only PDFs, Word (.docx), Excel (.xlsx), and images (JPG and PNG) are accepted. Legacy .doc and .xls formats are blocked because they support macros, which are the most common vector for Office malware.</p>
            <p><strong>Malware scanning:</strong> every uploaded file is scanned for viruses and malicious content by Cloudmersive, an enterprise-grade virus scanning service, before it is stored. Files that fail the scan are rejected immediately and never stored.</p>
            <p><strong>No direct browser-to-storage uploads:</strong> files pass through AlwaysReady&apos;s secure server before reaching storage, so validation and scanning cannot be bypassed.</p>
          </div>

          <H3>What we are working towards</H3>
          <div className="space-y-1">
            <p>• Independent penetration testing by a certified cybersecurity firm.</p>
            <p>• Formal GDPR Data Processing Agreement issued to all customers.</p>
            <p>• This page updated with test reports and certifications as they are completed.</p>
          </div>

          <H3>Questions</H3>
          <P>If you have any questions about data security or how we handle your information, please contact us at <a href="mailto:support@alwaysready.uk" className="text-brand font-medium hover:underline">support@alwaysready.uk</a>.</P>
        </Section>

        {/* ── Data Retention ─────────────────────────────────────────────────── */}
        <Section id="data-retention" label="Data Retention and Export Policy" colour="bg-[#014D4E]">
          <P>AlwaysReady is committed to handling your data responsibly. This policy explains how long we keep your data, what happens to it when your subscription ends, and how you can export it at any time.</P>

          <H3>How long we keep your data</H3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-ink mb-1">While your subscription is active</p>
              <P>Your data is retained for as long as your account is active. This includes all KLOE records, compliance updates, audit trail entries, team member details, and any uploaded evidence files.</P>
            </div>
            <div>
              <p className="font-semibold text-ink mb-1">After your subscription ends</p>
              <P>If your subscription lapses or is cancelled, your data is retained for <strong>90 days</strong> from the date your account closes. This gives you time to export your records before they are permanently deleted. After 90 days, all data associated with your organisation is permanently and irreversibly deleted from our systems. This cannot be undone.</P>
            </div>
            <div>
              <p className="font-semibold text-ink mb-1">Trial accounts</p>
              <P>If you do not subscribe at the end of your free trial, your data is retained for a further <strong>30 days</strong> before being permanently deleted. Please export any records you wish to keep before your trial ends.</P>
            </div>
          </div>

          <H3>Exporting your data</H3>
          <P>You can request a full export of your organisation&apos;s data at any time by emailing <a href="mailto:support@alwaysready.uk" className="text-brand font-medium hover:underline">support@alwaysready.uk</a>. Please include your organisation name and the email address associated with your account.</P>
          <div className="space-y-1">
            <p className="font-medium">What is included in a data export:</p>
            <p>• All KLOE records and compliance updates (CSV format)</p>
            <p>• Full audit trail (CSV format)</p>
            <p>• Team member list (CSV format)</p>
            <p>• Any uploaded evidence files (ZIP archive)</p>
          </div>
          <P>We will deliver your export within <strong>5 working days</strong> of receiving your request. Exports are provided in CSV format, which can be opened in Microsoft Excel, Google Sheets, or any standard spreadsheet application.</P>

          <H3>Your rights under GDPR</H3>
          <P>As a data controller for your organisation&apos;s information, you have the right to:</P>
          <div className="space-y-1">
            <p>• <strong>Access</strong> your data at any time by requesting an export.</p>
            <p>• <strong>Rectify</strong> any inaccurate data by updating it directly in the platform.</p>
            <p>• <strong>Erase</strong> your data by closing your account and allowing the 90-day retention period to elapse, or by requesting immediate deletion.</p>
            <p>• <strong>Portability</strong> — receive your data in a machine-readable format (CSV) on request.</p>
          </div>
          <P>AlwaysReady acts as a <strong>data processor</strong> on your behalf. You remain the <strong>data controller</strong> for all information entered into the platform.</P>

          <H3>Requesting early deletion</H3>
          <P>If you wish your data to be deleted before the 90-day retention period has elapsed, please email <a href="mailto:support@alwaysready.uk" className="text-brand font-medium hover:underline">support@alwaysready.uk</a> with the subject line <strong>&ldquo;Data deletion request&rdquo;</strong>. We will confirm deletion within 5 working days. Please note that once data is deleted it cannot be recovered.</P>

          <H3>Questions</H3>
          <P>If you have any questions about how we handle your data, please contact us at <a href="mailto:support@alwaysready.uk" className="text-brand font-medium hover:underline">support@alwaysready.uk</a>.</P>
        </Section>

      {/* Print footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-line text-xs text-ink-dim text-center">
        AlwaysReady Inspection Readiness Platform — User Guide
      </div>

    </div>
  )
}
