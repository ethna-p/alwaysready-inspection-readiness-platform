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
      className="scroll-mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden print:border-gray-400 print:rounded-none print:break-inside-avoid"
    >
      <div className={`px-6 py-4 ${colour}`}>
        <h2 className="text-lg font-bold text-white">{label}</h2>
      </div>
      <div className="px-6 py-6 space-y-6 text-sm text-[#1a1a1a] leading-relaxed">
        {children}
        <div className="pt-2 print:hidden">
          <a
            href="#"
            className="text-xs text-[#014D4E] hover:underline focus:outline-none focus:ring-1 focus:ring-[#014D4E] rounded"
          >
            ↑ Back to top
          </a>
        </div>
      </div>
    </section>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-bold text-[#014D4E] text-base mt-2">{children}</h3>
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
    <div className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
      <p className="font-semibold text-[#014D4E] mb-1">{question}</p>
      <p className="text-gray-700">{answer}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  return (
    <div className="print:max-w-none">

      {/* Page heading */}
      <div className="mb-6 print:mb-4">
        <h1 className="text-2xl font-bold text-[#014D4E]">Help &amp; User Guide</h1>
        <p className="text-sm text-gray-600 mt-1">
          Everything you need to get the most out of AlwaysReady.
        </p>
      </div>

      {/* ── Jump-to navigation ─────────────────────────────────────────────── */}
      <nav
        aria-label="Page sections"
        className="bg-white rounded-xl border border-gray-200 p-5 mb-8 print:hidden"
      >
        <p className="text-xs font-semibold text-[#014D4E] uppercase tracking-wide mb-3">
          Jump to a section
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '#understanding-rag', label: 'Understanding RAG status' },
            { href: '#for-admins',        label: 'For Admins' },
            { href: '#for-staff',         label: 'For Staff' },
            { href: '#for-visitors',      label: 'For Visitors' },
            { href: '#faqs',              label: 'FAQs' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="
                inline-block text-sm font-medium
                bg-[#faf9f6] border border-gray-200 rounded-lg
                px-4 py-2
                text-[#014D4E] hover:bg-[#014D4E] hover:text-white hover:border-[#014D4E]
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

        {/* ── Understanding RAG ──────────────────────────────────────────────── */}
        <Section id="understanding-rag" label="Understanding RAG status" colour="bg-[#014D4E]">
          <P>
            Every KLOE in the system is given a RAG status — Red, Amber, Green, or Grey. This tells you at a glance how well-prepared your service is for each area of inspection.
          </P>
          <div className="space-y-3 my-2">
            <RAGPill colour="bg-green-500"  label="Green"  description="This KLOE has been reviewed, marked as completed, and the next review date has not yet passed. Everything is in order." />
            <RAGPill colour="bg-amber-400"  label="Amber"  description="This KLOE is either in progress, or the next review date is coming up within the next 30 days. It needs your attention soon." />
            <RAGPill colour="bg-red-500"    label="Red"    description="This KLOE is overdue. The next review date has passed, or the KLOE was marked as completed but the review date is now in the past. This needs urgent attention." />
            <RAGPill colour="bg-gray-300"   label="Grey"   description="No review has been recorded for this KLOE yet. It has not been assessed." />
          </div>
          <P>
            The RAG status is calculated automatically every time you view the system. You do not need to set it manually — it updates based on the status and review dates you enter.
          </P>
          <P>
            When an inspector visits, they will see the same RAG colours you see. Green KLOEs show that your team is proactive and organised. A mix of amber and grey is normal for a service just getting started. Red KLOEs should always be prioritised.
          </P>
        </Section>

        {/* ── For Admins ─────────────────────────────────────────────────────── */}
        <Section id="for-admins" label="For Admins" colour="bg-[#00b8a6]">
          <P>
            As an Admin, you have full access to the platform. You can view and edit all KLOEs, manage your team, assign tasks, and create visitor logins for inspectors. You are the person responsible for keeping AlwaysReady up to date and making sure the right people have the right access.
          </P>

          <H3>Setting up your team</H3>
          <P>
            Go to <strong>Team</strong> in the navigation bar. From there you can add staff members, set their role, and generate their login credentials. Staff do not need an email address — the system creates a login ID for them automatically (for example, <code className="bg-gray-100 px-1 rounded text-xs">sarah.jones.f7a2e1</code>). When you add someone, the login ID and a temporary password appear on screen. Write these down or take a photo — they are only shown once.
          </P>

          <H3>Understanding roles</H3>
          <div className="space-y-2">
            <p><strong>Admin</strong> — full access. Can edit all KLOEs, manage the team, assign tasks, and create visitor logins. Usually the Registered Care Manager or a senior manager.</p>
            <p><strong>Staff (User)</strong> — can view all KLOEs and update the ones assigned to them. When they log in, they see their personal &ldquo;My KLOEs&rdquo; list first.</p>
            <p><strong>Visitor</strong> — read-only. Can view everything but cannot change anything. For inspectors and external visitors. Access expires automatically.</p>
          </div>

          <H3>Assigning KLOEs to team members</H3>
          <P>
            Open any KLOE from the KLOE tracker. At the top of the page you will see an <strong>Assign this KLOE</strong> panel. Select a team member from the dropdown and click Save. They will see this KLOE in their personal My KLOEs view when they log in. You can assign a KLOE to yourself as well as to other team members.
          </P>

          <H3>Changing your own password</H3>
          <P>
            Go to <strong>Account</strong> in the navigation bar. Enter your current password, choose a new one (at least 8 characters), and confirm it. Click <strong>Change password</strong>. Your new password takes effect immediately.
          </P>

          <H3>Resetting a team member&apos;s password</H3>
          <P>
            Team members can change their own password at any time by going to <strong>Account</strong> in the navigation bar. If a team member has forgotten their password and cannot log in, go to <strong>Team</strong>, find their name, and click <strong>Reset password</strong>. A new temporary password will be generated and shown on screen — give it to them directly so they can log in and set their own.
          </P>

          <H3>Creating a visitor login before an inspection</H3>
          <div className="space-y-2">
            <Step number={1}>Go to <strong>Team</strong> in the navigation bar.</Step>
            <Step number={2}>Scroll to the <strong>Visitor logins</strong> section at the bottom of the page.</Step>
            <Step number={3}>Click <strong>Create visitor login</strong>. Enter the visitor&apos;s name and decide how many days you want to give them access.</Step>
            <Step number={4}>The login ID and a temporary password will appear on screen. Share these with the inspector so they can log in on their own device.</Step>
            <Step number={5}>Access expires automatically after the number of days you chose. If you need to remove access early, click <strong>Revoke</strong> next to their name in the Visitor logins list.</Step>
          </div>

          <H3>Uploading evidence files</H3>
          <P>
            Open any KLOE and scroll to the <strong>Evidence files</strong> section. Click <strong>Upload file</strong> and select a document from your device. Accepted formats are PDF, Word, Excel, and images (JPG or PNG), up to 10 MB per file. Files are private and can only be accessed by members of your organisation and any visitors you have given access to.
          </P>
          <P>
            <strong>Important:</strong> only upload governance documents — policies, certificates, risk assessments, and similar records. Do not upload anything containing resident-specific clinical information, care plans, or personal health records.
          </P>
          <P>
            Admins can delete uploaded files. Staff and visitors can download files but cannot delete them.
          </P>

          <H3>Reading the dashboard</H3>
          <P>
            The dashboard shows your overall inspection readiness as a percentage, and breaks it down by each key question area (Safe, Effective, Caring, Responsive, Well-led). The Team workload section shows which staff members have assigned KLOEs and how many are overdue, so you can see at a glance if anyone needs support.
          </P>

          <H3>The audit trail</H3>
          <P>
            Every time a KLOE is updated, the system records who made the change, what changed, and when. This record cannot be altered or deleted. During an inspection, this is powerful evidence that your team is actively managing compliance — not just filling in forms on the day.
          </P>
        </Section>

        {/* ── For Staff ──────────────────────────────────────────────────────── */}
        <Section id="for-staff" label="For Staff" colour="bg-[#5b8fa8]">
          <P>
            As a staff member, you have a personal space in AlwaysReady called <strong>My KLOEs</strong>. This shows you the KLOEs your manager has assigned to you. Your job is to keep them up to date so the service is ready for inspection.
          </P>

          <H3>Logging in</H3>
          <P>
            Your manager will give you a login ID (it looks something like <code className="bg-gray-100 px-1 rounded text-xs">sarah.jones.f7a2e1</code>) and a temporary password. Go to the AlwaysReady login page, type your login ID into the box, and enter your password. You do not need an email address to log in. Once you are in, you can change your password at any time by going to <strong>Account</strong> in the navigation bar.
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
            See the <a href="#understanding-rag" className="text-[#014D4E] font-medium hover:underline">Understanding RAG status</a> section above for a full explanation.
          </P>

          <H3>Can I see KLOEs I have not been assigned?</H3>
          <P>
            Yes — you can browse the full KLOE list from the <strong>KLOEs</strong> link in the navigation bar. You can read any KLOE, but you can only save changes to the ones assigned to you.
          </P>
        </Section>

        {/* ── For Visitors ───────────────────────────────────────────────────── */}
        <Section id="for-visitors" label="For Visitors" colour="bg-[#6b7280]">
          <P>
            As a visitor, you have read-only access to the AlwaysReady platform. This means you can view all the information in the system, but you cannot make any changes. Your login has been set up specifically for your visit and will stop working automatically after a set number of days.
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
            See the <a href="#understanding-rag" className="text-[#014D4E] font-medium hover:underline">Understanding RAG status</a> section above for a full explanation. The audit trail beneath each KLOE shows the full history of how the service has been managing that area over time.
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
              question="What happens if I forget my password?"
              answer="If you are logged in, go to Account in the navigation bar and change it there. If you have forgotten your password and cannot log in, ask your admin to reset it from the Team page — they will generate a new temporary password and give it to you directly."
            />
            <FAQ
              question="Can I change my own password?"
              answer="Yes — go to Account in the navigation bar. Enter your current password, choose a new one, and confirm it. Your new password takes effect immediately. If you have forgotten your current password and cannot log in, ask your admin to reset it for you."
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
              question="How long is our data kept, and can we export it?"
              answer="Your data is retained for as long as your subscription is active. If your subscription ends, your data is kept for 90 days before being permanently deleted — giving you time to export everything first. To request a full data export (KLOE records, audit trail, team list, and uploaded evidence), email hello@alwaysready.uk with your organisation name. Exports are delivered in CSV format within 5 working days."
            />
            <FAQ
              question="What should I do if something looks wrong in the system?"
              answer="Contact your admin in the first instance. If the issue appears to be a technical problem with the platform itself, the admin should raise a support ticket using the Support link in the navigation bar."
            />
          </div>
        </Section>

      </div>

      {/* Print footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600 text-center">
        AlwaysReady Inspection Readiness Platform — User Guide
      </div>

    </div>
  )
}
