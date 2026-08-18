'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import HelpWidget from '@/components/HelpWidget'

// ── Types ─────────────────────────────────────────────────────────────────────

type FAQItem = { q: string; a: string }
type Topic = {
  id: string
  label: string
  desc: string
  icon: React.ReactNode
  faqs: FAQItem[]
}

// ── Icon helpers ──────────────────────────────────────────────────────────────

const sz = (s: number) => ({ width: s, height: s })

const IconPlay = (s: number) => (
  <svg {...sz(s)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s === 36 ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>
)
const IconActivity = (s: number) => (
  <svg {...sz(s)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s === 36 ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
)
const IconFile = (s: number) => (
  <svg {...sz(s)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s === 36 ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
)
const IconBriefcase = (s: number) => (
  <svg {...sz(s)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s === 36 ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
)
const IconUsers = (s: number) => (
  <svg {...sz(s)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s === 36 ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)
const IconBarChart = (s: number) => (
  <svg {...sz(s)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s === 36 ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
)
const IconClipboard = (s: number) => (
  <svg {...sz(s)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s === 36 ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
)
const IconShield = (s: number) => (
  <svg {...sz(s)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s === 36 ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
)
const IconChat = (s: number) => (
  <svg {...sz(s)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s === 36 ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
)
const IconHome = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
)
const IconChevronRight = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
)
const IconSearch = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
)

// ── FAQ data ──────────────────────────────────────────────────────────────────

const TOPICS: Topic[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    desc: 'Platform overview, daily routine, and first steps',
    icon: IconPlay(36),
    faqs: [
      { q: 'What is AlwaysReady and how does it work?', a: 'AlwaysReady is a governance and inspection-readiness platform structured around the five CQC key questions and their linked KLOEs. For each KLOE you record a status, set a review date, add notes, and upload evidence. Your dashboard gives a live view of your compliance position, and your Daily Review Report highlights what needs attention today.' },
      { q: 'What does a daily routine with AlwaysReady look like?', a: 'You log in to your dashboard and review the Daily Review Report, which highlights the KLOEs most overdue and those rated Red or Amber. You update statuses, add notes, upload evidence, and set next review dates. Over time this builds a live, accurate picture of your compliance health.' },
      { q: 'How long does it take to set up?', a: 'Signing up takes less than a minute. The platform is fully configured — the CQC framework is already loaded. Your main task is to populate it with your data: statuses, review dates, evidence, and HR records.' },
      { q: 'Does AlwaysReady work on a tablet or mobile?', a: 'Yes. AlwaysReady is a web-based platform optimised to run in any browser — on desktops, laptops, tablets, or smartphones. No app download is required.' },
      { q: 'Does AlwaysReady work offline?', a: 'No. AlwaysReady requires an internet connection. All data is securely stored in the cloud so you can access it from any device with a web browser.' },
      { q: 'Is there a dark mode?', a: 'Yes. Click the sun/moon icon in the navigation bar to switch between light and dark modes. The platform also respects your device\'s system preference by default.' },
      { q: 'Why am I signed out when I close my browser tab?', a: 'AlwaysReady automatically signs you out when you close the browser tab. This is a deliberate security feature that protects compliance and staff data on shared devices — it ensures nobody can access your account simply by reopening the browser after you have finished.' },
      { q: 'Will AlwaysReady work alongside my existing systems?', a: 'Yes. AlwaysReady works alongside your existing care planning, medication, and rostering software. It does not store any resident or clinical information — it focuses solely on compliance and inspection preparedness.' },
      { q: 'Can staff complete daily care notes in AlwaysReady?', a: 'No. AlwaysReady is not a care-planning or daily-notes system. It focuses on governance, oversight, and inspection-readiness, not on recording care.' },
      { q: 'Does AlwaysReady guarantee a good CQC rating?', a: 'No — and it\'s important to be clear about this. AlwaysReady helps you organise your evidence, track compliance, and prepare for inspection. CQC outcomes depend on a wide range of factors entirely outside our knowledge or control. What AlwaysReady does is help you arrive at inspection better organised and with your evidence ready — that is a real advantage, but not a guarantee.' },
    ],
  },
  {
    id: 'kloe-tracker',
    label: 'KLOE Tracker',
    desc: 'RAG status, review dates, priorities, and evidence',
    icon: IconActivity(36),
    faqs: [
      { q: 'What is the RAG status system?', a: 'RAG stands for Red, Amber, Green — a colour-coded system showing inspection readiness at a glance. Green: reviewed and up to date. Amber: in progress or due within 30 days. Red: overdue — the next review date has passed. Grey: no review yet recorded. The RAG status updates automatically based on the dates and statuses you enter — you never have to set it manually.' },
      { q: 'How does review frequency work?', a: 'For each KLOE you can set how often it needs reviewing — monthly, quarterly, annually, or a custom number of days. When you record a review date, the platform automatically calculates the next due date. This determines the RAG status and your Daily Review Report.' },
      { q: 'What is the priority level for?', a: 'The priority level (1 to 5, with 1 highest) reflects how serious non-compliance in that area would be for your service. You set it yourself based on your knowledge of your service. Priority is used to sort your Daily Review Report so the most critical overdue KLOEs always appear first.' },
      { q: 'What is the difference between evidence location notes and uploading a file?', a: 'Evidence location notes are a free-text field where you specify where a document is stored — for example, a shared drive folder, a filing cabinet, or a policy management system. Uploading a file attaches the document to the KLOE in AlwaysReady. You can use one, the other, or both.' },
      { q: 'Can I add my own KLOEs or customise the list?', a: 'No. The 24 KLOEs are fixed within the CQC framework and cannot be added to or removed. This ensures your records always map accurately to the framework used by inspectors. You can add your own notes and evidence to each KLOE.' },
      { q: 'Can I assign the same KLOE to more than one person?', a: 'No — each KLOE can be assigned to one team member at a time. If ownership needs to change, an Admin can reassign it at any time from the KLOE detail page.' },
      { q: 'Can two people update the same KLOE at the same time?', a: 'Yes, but the last person to save will overwrite the previous save. To avoid confusion, use the assignment feature to make clear who is responsible for each KLOE.' },
      { q: 'Can I delete a record or undo a change?', a: 'No. The audit trail is permanent and cannot be altered or deleted. This is by design — it protects the service by proving that records are genuine and have not been tampered with. If you make a mistake, simply save a corrected update and it will appear as the latest entry.' },
      { q: 'How do I know when a KLOE is coming up for review?', a: 'The KLOE tracker shows the next review date for every KLOE. KLOEs due within 30 days show as Amber. The Daily Review Report also lists upcoming reviews. Check the dashboard regularly — it takes less than a minute to scan.' },
      { q: 'What happens to our KLOEs if the CQC framework changes?', a: 'AlwaysReady is designed so that any updates to the framework can be applied with a simple data change, not a rebuild. Your existing compliance records remain unaffected by framework updates.' },
    ],
  },
  {
    id: 'evidence-files',
    label: 'Evidence & Files',
    desc: 'Uploads, file types, audit trail, and data export',
    icon: IconFile(36),
    faqs: [
      { q: 'What types of documents can I upload?', a: 'Policies, audits, meeting minutes, training records, anonymised incident reviews, and action plans. Supported file types: PDF, Word (.docx), Excel (.xlsx), JPG, and PNG. The maximum file size is 10 MB per file. Legacy .doc and .xls formats are not accepted — please save files in the current format before uploading.' },
      { q: 'Is there a limit on file size?', a: 'Each file can be up to 10 MB. There is no limit on the number of files you can upload.' },
      { q: 'Are uploaded files scanned for viruses?', a: 'Yes. Every uploaded file is virus-scanned before storage. Safe files display a "Scanned" badge. Files that fail the scan are rejected immediately and never stored. AlwaysReady also validates the file\'s actual type at the byte level, not just the extension, so files cannot be disguised as a safe format.' },
      { q: 'Can I delete files I have uploaded?', a: 'Yes. Uploaded evidence files can be deleted directly from the KLOE by clicking the delete icon next to the file.' },
      { q: 'Can I attach evidence files to People\'s Voice statements?', a: 'Yes. Open any \'I\' statement in the People\'s Voice module, expand the evidence record, and scroll to the Evidence files section. You can upload PDFs, Word documents, Excel files, and images up to 10 MB each, in the same way as evidence files on KLOE records.' },
      { q: 'Does AlwaysReady provide an audit trail?', a: 'Yes. AlwaysReady maintains a secure, time-stamped record of every change — including who made it, what changed, and when. This record cannot be altered or deleted by anyone. Uploaded file events appear alongside compliance updates in a single unified timeline for each KLOE.' },
      { q: 'Only upload governance documents — what does that mean?', a: 'Upload policies, certificates, risk assessments, audit reports, training records, meeting minutes, and similar governance documents. Do not upload anything containing resident-specific clinical information, care plans, personal health records, or medication charts. AlwaysReady is a governance platform, not a care records system.' },
      { q: 'Can I export data from AlwaysReady?', a: 'Yes. Go to Account → Organisation. Two exports are available: a CSV of all your compliance records, audit trail, and team data; and a ZIP archive of all your uploaded evidence files. Both are available at any time without needing to contact support.' },
      { q: 'Can I export my evidence files separately?', a: 'Yes. Go to Account → Organisation and click Download evidence archive. This creates a ZIP file containing all documents your team has uploaded across all KLOEs. The CSV records export on the same page covers your compliance data, audit trail, and team information.' },
    ],
  },
  {
    id: 'hr-records',
    label: 'HR Records',
    desc: 'Training, DBS, supervision, appraisals, and absence',
    icon: IconBriefcase(36),
    faqs: [
      { q: 'What is the HR module?', a: 'The HR module enables Admin users to manage staff records in one place. For each team member you can record employment details, DBS check dates, supervision and appraisal due dates, training completions, holiday allowances, and absence episodes. An overview dashboard shows compliance status across the whole team at a glance.' },
      { q: 'Does AlwaysReady track mandatory training?', a: 'Yes. The HR module includes a training records section for each staff member. You can record completion dates, set renewal frequencies, upload certificates, and view automatically calculated next-due dates.' },
      { q: 'Can I upload training certificates?', a: 'Yes. You can upload a certificate against any training record. Certificates are stored securely, virus-scanned, and linked to the relevant training type.' },
      { q: 'Does AlwaysReady track DBS renewal dates?', a: 'Yes. The HR module records each staff member\'s most recent DBS check date and calculates the next renewal due date automatically. Renewal status is visible for all staff on the HR overview page.' },
      { q: 'Does AlwaysReady track supervision and appraisal dates?', a: 'Yes. The HR module records each staff member\'s last supervision and appraisal dates, the frequency for each, and automatically calculates the next due dates. CQC inspects these records under the Effective and Well-led domains.' },
      { q: 'Can holiday be tracked in hours rather than days?', a: 'Yes. Holiday allowances can be tracked in days or hours. You can change the unit for your whole organisation by going to HR and clicking Change next to the holiday unit setting.' },
      { q: 'Does AlwaysReady track sick leave and absences?', a: 'Yes. The HR module includes an Absence Records section on each staff member\'s profile. You log each absence episode individually — recording start and end dates, days absent, a reason category, and notes. This builds a complete absence history over time.' },
      { q: 'What types of absence can I record?', a: 'You can record sick leave and other absences. For each episode you select a reason category: Musculoskeletal, Respiratory or Cold and Flu, Mental Health and Stress, Gastrointestinal, Injury, or Other. The number of days absent is calculated automatically from the dates but can be edited manually.' },
      { q: 'Does AlwaysReady calculate the Bradford Factor?', a: 'Yes. The Bradford Factor (S² × D, where S is the number of separate sickness absences and D is total days absent in a rolling 52-week period) is calculated automatically from logged absence records and displayed as Low, Medium, or High. You do not need to calculate it manually.' },
      { q: 'Does AlwaysReady track return-to-work interviews?', a: 'Yes. Each absence record includes fields to record whether a return-to-work interview was completed, the date it took place, and any notes. Return-to-work interviews are a standard HR expectation in the care sector and a CQC inspection point under Safe and Well-led.' },
      { q: 'What is special category data and why does AlwaysReady hold it?', a: 'Special category data includes fields such as date of birth, gender, ethnicity, disability status, and marital status. AlwaysReady stores this in staff HR records for equality monitoring, as required by the Equality Act 2010 for employers. This data is visible only to Admin users within your organisation and is never shared with CQC or any third party.' },
      { q: 'Who can see absence records?', a: 'Absence records are visible to Admin users and to Viewer accounts you invite (such as CQC inspectors or board members). Standard User accounts cannot access HR data, including absence records.' },
    ],
  },
  {
    id: 'team-access',
    label: 'Team & Access',
    desc: 'Roles, inviting staff, visitor logins, and 2FA',
    icon: IconUsers(36),
    faqs: [
      { q: 'What roles are available?', a: 'Three roles: Admin (full access — can edit all KLOEs, manage the team, run mock inspections, maintain HR records, and create visitor logins), User/Staff (can view all KLOEs and update the ones assigned to them), and Viewer (read-only — can view everything but cannot make any changes; access expires automatically).' },
      { q: 'Who should have the Admin role?', a: 'We recommend that only the Registered Manager holds the Admin role. Admin users have full access including HR records, staff employment data, training records, absence history, and team management settings. Most team members should be given the Staff role, which allows them to work on their assigned KLOEs without seeing HR records or management settings.' },
      { q: 'How do staff members get access?', a: 'Go to Team in the navigation bar, scroll to Invite team member, and enter their full name, email address, and role, then click Send invite. They receive an email with a link to set their own password and activate their account. You do not need to share any credentials manually.' },
      { q: 'What can a Viewer see?', a: 'Viewers have read-only access to the KLOE tracker, audit trail, readiness trend, daily review report, inspection pack, incident log, feedback log, governance meetings, People\'s Voice, post-inspection reviews, and HR records. They cannot make any changes, and you can revoke access at any time before expiry.' },
      { q: 'Can I give a CQC inspector read-only access during a visit?', a: 'Yes. Create a Viewer login on the Team page and set the access duration — it expires automatically. The visitor can view all compliance records and the inspection pack. They cannot make any changes.' },
      { q: 'How do I reset a team member\'s password?', a: 'Go to Team, find their name, and click Reset password. A new temporary password will be shown on screen — give it to them directly so they can log in and set their own. Team members can also reset their own password from the login page using Forgot password.' },
      { q: 'What is two-factor authentication and why is it required?', a: 'Two-factor authentication (2FA) means logging in requires both your password and a six-digit code from an authenticator app. It is required for all Admin and Staff accounts because they have access to sensitive compliance data. It significantly reduces the risk of unauthorised access even if a password is compromised.' },
      { q: 'Do Visitor accounts need two-factor authentication?', a: 'No. Two-factor authentication is required only for Admin and Staff accounts. Visitor accounts, which are read-only and time-limited, are not subject to 2FA.' },
      { q: 'Which authenticator apps work with AlwaysReady?', a: 'Any TOTP-compatible authenticator app, including Google Authenticator, Authy, and Microsoft Authenticator. If you do not have a smartphone, you can also use the Authy desktop app (Windows/Mac), the Authenticator browser extension for Chrome or Firefox, or Microsoft Authenticator from the Windows desktop app store — all work with the setup QR code.' },
      { q: 'What if I lose access to my authenticator app?', a: 'You can add another authenticator app at any time via the Account section. If you are locked out, contact support@alwaysready.uk for assistance.' },
      { q: 'Can I see KLOEs I have not been assigned?', a: 'Yes — you can browse the full KLOE list from the KLOEs link in the navigation bar. You can read any KLOE, but you can only save changes to the ones assigned to you.' },
    ],
  },
  {
    id: 'reports-analytics',
    label: 'Reports & Analytics',
    desc: 'Dashboard, Report Builder, snapshots, and mock inspections',
    icon: IconBarChart(36),
    faqs: [
      { q: 'What does the dashboard show?', a: 'Your overall inspection readiness as a percentage, broken down by each key question area (Safe, Effective, Caring, Responsive, Well-led). RAG status indicators across all KLOEs. Team workload showing assigned KLOEs and overdue items per staff member. Your live CQC rating card, pulled from the public CQC register.' },
      { q: 'What is the Daily Review Report?', a: 'A single screen showing everything that needs attention — overdue KLOEs first, then due soon, sorted by priority. Designed to be scanned in under five minutes each morning.' },
      { q: 'What is the Report Builder?', a: 'The Report Builder is in the Reports section of the navigation bar. It shows your full KLOE compliance data in a filterable table with columns for status, RAG, priority, review dates, and evidence notes. You can save custom views, take progress snapshots to track improvement over time, and generate an AI-written narrative summary of your compliance position.' },
      { q: 'What are saved views in the Report Builder?', a: 'Saved views store your preferred filter and sort settings as a named view so you can switch between them without reconfiguring each time. AlwaysReady includes built-in system views (All KLOEs, Pre-Inspection, by key question area) and you can save your own. Views persist between sessions.' },
      { q: 'What is a progress snapshot?', a: 'A progress snapshot records your compliance position at a point in time — how many KLOEs are complete, in progress, or not started, and your overall readiness percentage. When you take a new snapshot, the Report Builder shows the change since the previous one. Take a snapshot before a significant piece of improvement work and again after to demonstrate progress clearly.' },
      { q: 'What is the AI summary in the Report Builder?', a: 'The AI summary generates a short narrative description of your current compliance position based on your live KLOE data — which key question areas are strongest, which need attention, and an overall assessment of readiness. It is for internal use only and is generated fresh from your data each time you request it.' },
      { q: 'What is the Pre-Inspection view?', a: 'The Pre-Inspection view in the Report Builder surfaces KLOEs most likely to need attention before an inspection — those with Red or Amber RAG status, lower evidence coverage, or open action items. It is designed to help you prioritise improvement work in the weeks before a visit.' },
      { q: 'What does the analytics section on the dashboard show?', a: 'The analytics section covers: KLOE evidence coverage and action plan health, People\'s Voice evidence and action plan progress, mock inspection self-assessed ratings by key question area, HR compliance (return-to-work rate, absence patterns, Bradford Factor), and operational records including incidents in the last 90 days, complaints and feedback by category, and governance meeting activity in the last 12 months.' },
      { q: 'What is a mock inspection?', a: 'A mock inspection is a self-assessment tool that walks you through each KLOE and asks you to rate your evidence as Outstanding, Good, Requires Improvement, or Inadequate. At the end it produces a report showing a self-assessed rating for each key question area. Previous sessions are saved so you can track improvement over time. Ratings are for internal use only — they do not represent the views of CQC.' },
      { q: 'What is the Inspection Pack?', a: 'A one-click printable summary of your full compliance position — current RAG status, review dates, priority, and evidence location for every KLOE. Designed to be handed to an inspector or presented to a board.' },
      { q: 'What does KLOE evidence coverage mean?', a: 'Evidence coverage shows what percentage of your 24 KLOEs have evidence documented against them — either an evidence location note or an uploaded file. It gives a quick view of how much of your evidence base is recorded in the platform.' },
    ],
  },
  {
    id: 'governance-ops',
    label: 'Governance & Operations',
    desc: 'Action plans, incidents, feedback, meetings, and People\'s Voice',
    icon: IconClipboard(36),
    faqs: [
      { q: 'What is the Action Plan?', a: 'The Action Plan is a task management tool built into the platform. You can create action items against any KLOE, People\'s Voice statement, or post-inspection finding. Each action includes a title, description, due date, priority (High, Medium, or Low), and an assignee. Admins and Users can create, update, and sign off on action items.' },
      { q: 'How do I close an action item?', a: 'Open the KLOE detail page and locate the action item in the Action Plan panel. Click Sign Off, add any completion notes, then confirm. The item is marked as Completed, and the completion date and name of the person who signed it off are recorded permanently.' },
      { q: 'What is the Incident Log?', a: 'The Incident Log lets you record and track incidents within your service. Each record captures the incident type, date, description, immediate actions taken, people involved, whether it was reported externally, and current status. CQC inspectors expect to see incidents recorded and reviewed with documented learning.' },
      { q: 'What types of incidents can I record?', a: 'You can categorise incidents as: Safety, Safeguarding, Near Miss, Complaint, or Other. This helps you identify patterns over time and provides the structure inspectors expect when reviewing incident management records.' },
      { q: 'Can I record the learning outcome of an incident?', a: 'Yes. Each incident record includes a Learning Outcome field. Recording what changed as a result of an incident — whether a process was updated, training delivered, or a risk mitigated — is a key element in demonstrating a learning culture under the Well-led key question.' },
      { q: 'What is the Feedback Log?', a: 'The Feedback Log is a structured register for all feedback your service receives — complaints, compliments, suggestions, and concerns. You can capture the source, a summary, action taken, and outcome, and link each record to the most relevant CQC key question.' },
      { q: 'What is the Governance Meetings log?', a: 'The Governance Meetings log helps you record minutes, key decisions, and actions from management meetings. CQC inspectors routinely request evidence of governance activity for the Well-led key question. A weekly digest summarising recent meeting activity is sent to Admins every Monday morning.' },
      { q: 'Who can sign off on a governance meeting record?', a: 'Only Admins can sign off a meeting record. Once signed off, the record is marked as completed and the sign-off is timestamped. Users can view and contribute to meeting records but cannot sign them off.' },
      { q: 'What is the People\'s Voice module?', a: 'The People\'s Voice module includes the 19 \'I\' statements from the CQC assessment framework, drawn from the TLAP standards. Each statement has a free-text evidence field, a confidence rating (Green, Amber, Red), a review date, and the ability to upload supporting files and create action items. A summary dashboard shows coverage across all five key questions.' },
      { q: 'Can I track actions within People\'s Voice statements?', a: 'Yes. You can create a structured action item directly against any statement — with a title, description, due date, priority, and an assigned team member. Actions are tracked through to sign-off, with completion notes permanently recorded in the audit trail.' },
      { q: 'What is the Post-Inspection module?', a: 'The Post-Inspection module helps you manage the period following a CQC inspection. You can record the inspection date, draft report received date, and final report published date. For each inspection you log the CQC ratings awarded across all five key questions and track the progress of any Factual Accuracy Check submissions.' },
      { q: 'What is a Factual Accuracy Check (FAC)?', a: 'A FAC is the formal process by which a registered provider can challenge factual errors in a draft CQC inspection report before publication. AlwaysReady lets you log each FAC item, categorise it, record your position and supporting evidence, and track whether CQC upheld or rejected the challenge.' },
      { q: 'What is the newsletter drafting tool and who can use it?', a: 'An AI-assisted feature available to Admin users. Choose your audience (staff, families and residents, or both), a topic, key points, and a tone — the platform generates a ready-to-copy draft in seconds. AlwaysReady never sends newsletters on your behalf, and all output should be reviewed before use. Do not include personal details of residents, patients, families, or individual staff in your prompts. Each organisation can generate up to 10 drafts per calendar month.' },
    ],
  },
  {
    id: 'security-data',
    label: 'Security & Data',
    desc: 'Encryption, GDPR, CQC data sharing, and data retention',
    icon: IconShield(36),
    faqs: [
      { q: 'How secure is AlwaysReady?', a: 'All data is encrypted in transit (TLS) and at rest. All Admin and Staff accounts require two-factor authentication. Every change is recorded in a tamper-proof, time-stamped audit trail. Uploaded files are virus-scanned before storage. Each organisation\'s data is fully isolated at the database level using Row Level Security — no other organisation can ever access your records.' },
      { q: 'Where is my data stored?', a: 'On secure cloud infrastructure within the European Economic Area. The application is hosted on Vercel; the database on Supabase (built on PostgreSQL). All data is encrypted at rest and in transit. No data is stored on AlwaysReady\'s own servers — we rely entirely on these specialist providers whose core business is secure, reliable infrastructure.' },
      { q: 'Is AlwaysReady GDPR compliant?', a: 'Yes. AlwaysReady operates in full compliance with UK GDPR. AlwaysReady acts as a data processor on your behalf — you remain the data controller for the information you hold about your service and your team. We process your data only to provide the AlwaysReady service and for no other purpose. We do not sell your data or share it with third parties.' },
      { q: 'Does AlwaysReady share our data with CQC?', a: 'No. The data you enter into AlwaysReady is private and visible only to those you grant access. AlwaysReady does not submit any data to CQC, does not connect to any internal CQC system, and does not share your compliance position with any regulator or third party.' },
      { q: 'Does AlwaysReady connect to CQC at all?', a: 'Yes — but only in one direction, reading publicly available information. AlwaysReady connects to the CQC Syndication API to retrieve your service\'s current rating, registered name, and last inspection date. This is read-only. Nothing from your AlwaysReady account is ever sent to CQC.' },
      { q: 'How long is our data kept?', a: 'Your data is retained for as long as your subscription is active. If your subscription lapses or is cancelled, data is retained for 90 days from the date your account closes. Trial accounts: data is retained for 30 days if you do not subscribe. After the retention period, all data is permanently and irreversibly deleted.' },
      { q: 'Can I export my data at any time?', a: 'Yes. Go to Account → Organisation. Two exports are available at any time: a CSV of all your compliance records, audit trail, and team data; and a ZIP archive of all your uploaded evidence files. No need to contact support.' },
      { q: 'Can I request early deletion of my data?', a: 'Yes. Email support@alwaysready.uk with the subject line "Data deletion request". We will confirm deletion within 5 working days. Once data is deleted it cannot be recovered.' },
      { q: 'What are my rights under GDPR?', a: 'As data controller for your organisation\'s information you have the right to: access your data at any time by requesting an export; rectify any inaccurate data by updating it directly in the platform; erase your data by closing your account or requesting early deletion; and portability — receive your data in CSV format on request.' },
      { q: 'Is there a Data Processing Agreement?', a: 'Yes. A formal Data Processing Agreement (DPA) is available. Contact support@alwaysready.uk to request a copy.' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    desc: 'Raising tickets, contacting the team, and response times',
    icon: IconChat(36),
    faqs: [
      { q: 'How do I raise a support ticket?', a: 'Click Support in the main navigation bar. You can raise a new support request directly from there, view the status of any open tickets, and read replies — all without leaving the platform.' },
      { q: 'Can I contact support by email?', a: 'Yes. Email support@alwaysready.uk at any time and a real person will respond. Every request is handled personally — you will never receive an automated non-reply.' },
      { q: 'Can I reply to a support ticket by email?', a: 'Yes. When you receive a reply to your support ticket, you can reply directly to that email and your response will be threaded back into the ticket automatically. You do not need to log in to continue the conversation.' },
      { q: 'What are the support hours?', a: 'Support is available Monday to Friday, 9.00–17.00. We aim to respond to all requests within three working days.' },
      { q: 'What should I do if something looks wrong in the platform?', a: 'Contact your Admin in the first instance. If the issue appears to be a technical problem with the platform itself, the Admin should raise a support ticket using the Support link in the navigation bar, or email support@alwaysready.uk.' },
      { q: 'Can I suggest a new feature?', a: 'Yes — and we genuinely want to hear your ideas. Go to Support → New request and choose "Feature suggestion" as the type, or email support@alwaysready.uk. If your suggestion is something many services would benefit from, there is a good chance it will make it in.' },
      { q: 'Who runs AlwaysReady?', a: 'AlwaysReady is built and run by Ethna Parker, PhD, who holds a doctorate and has a professional background in health and adult social care. All support requests are handled personally.' },
    ],
  },
]

// ── Accordion item ────────────────────────────────────────────────────────────

function AccordionItem({ faq, isOpen, onToggle }: { faq: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-line last:border-0">
      <button
        className="flex w-full items-center justify-between gap-4 py-[1.125rem] text-left text-[0.9375rem] font-semibold text-ink hover:text-[#014D4E] transition-colors"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{faq.q}</span>
        {/* Gold circle with + / × */}
        <span
          className="shrink-0 flex items-center justify-center rounded-full border-2 border-[#d4aa3c] transition-transform"
          style={{ width: 20, height: 20 }}
          aria-hidden="true"
        >
          <span
            className="relative flex items-center justify-center"
            style={{ width: 10, height: 10 }}
          >
            <span className="absolute h-px w-[10px] bg-[#d4aa3c] rounded" />
            <span
              className="absolute w-px h-[10px] bg-[#d4aa3c] rounded transition-transform duration-200"
              style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            />
          </span>
        </span>
      </button>
      {isOpen && (
        <p className="pb-5 text-[0.975rem] leading-[1.75] text-ink-muted">
          {faq.a}
        </p>
      )}
    </div>
  )
}

// ── Topic view ────────────────────────────────────────────────────────────────

function TopicView({ topic, openFaqs, onToggle }: {
  topic: Topic
  openFaqs: Set<string>
  onToggle: (key: string) => void
}) {
  return (
    <div className="px-8 py-10">
      <h2 className="text-[1.625rem] font-extrabold text-ink mb-10 pb-4 border-b-2 border-[#014D4E] inline-block leading-tight">
        {topic.label}
      </h2>
      <div>
        {topic.faqs.map((faq, i) => {
          const key = `${topic.id}-${i}`
          return (
            <AccordionItem
              key={key}
              faq={faq}
              isOpen={openFaqs.has(key)}
              onToggle={() => onToggle(key)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Search results ────────────────────────────────────────────────────────────

function SearchResults({ query, allFaqs, openFaqs, onToggle }: {
  query: string
  allFaqs: { key: string; topicLabel: string; faq: FAQItem }[]
  openFaqs: Set<string>
  onToggle: (key: string) => void
}) {
  const q = query.toLowerCase()
  const results = allFaqs.filter(
    ({ faq }) => faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)
  )

  return (
    <div className="px-8 py-10">
      <p className="text-sm text-ink-dim mb-6">
        {results.length === 0
          ? `No results for "${query}"`
          : `${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`}
      </p>
      {results.length === 0 ? (
        <p className="text-sm text-ink-dim">
          Try different words, or{' '}
          <Link href="/dashboard/support/new" className="text-[#014D4E] underline hover:text-[#00b8a6] transition-colors">
            contact support
          </Link>
          .
        </p>
      ) : (
        <div>
          {results.map(({ key, topicLabel, faq }) => (
            <div key={key}>
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-ink-dim mb-1 mt-4 first:mt-0">
                {topicLabel}
              </p>
              <AccordionItem
                faq={faq}
                isOpen={openFaqs.has(key)}
                onToggle={() => onToggle(key)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Home view ─────────────────────────────────────────────────────────────────

function HomeView({
  onSelectTopic,
  search,
  onSearchChange,
}: {
  onSelectTopic: (id: string) => void
  search: string
  onSearchChange: (v: string) => void
}) {
  return (
    <div className="px-8 py-10">
      {/* Hero search */}
      <div className="mb-10">
        {/* Particles animation keyframes */}
        <style>{`
          @keyframes ar-float-up {
            0%   { opacity: 0; transform: translateY(0) scale(1); }
            15%  { opacity: 0.65; }
            80%  { opacity: 0; transform: translateY(-42px) scale(0.6); }
            100% { opacity: 0; transform: translateY(-42px) scale(0.6); }
          }
        `}</style>
        <div className="relative mb-5" style={{ overflow: 'visible' }}>
          <h1 className="text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold tracking-tight text-ink leading-tight">
            How can we <em className="not-italic text-[#014D4E]">help you?</em>
          </h1>
          {/* Floating particles */}
          {([
            { left: '29%', bottom: '2px',  size: 5, color: '#014D4E', delay: '0s',    dur: '2.4s' },
            { left: '36%', bottom: '6px',  size: 7, color: '#00b8a6', delay: '0.7s',  dur: '2.9s' },
            { left: '44%', bottom: '0px',  size: 5, color: '#d4aa3c', delay: '1.3s',  dur: '2.3s' },
            { left: '52%', bottom: '8px',  size: 6, color: '#014D4E', delay: '0.4s',  dur: '2.7s' },
            { left: '40%', bottom: '3px',  size: 5, color: '#e8c547', delay: '1.9s',  dur: '2.5s' },
            { left: '60%', bottom: '5px',  size: 7, color: '#00b8a6', delay: '1.0s',  dur: '3.1s' },
            { left: '33%', bottom: '1px',  size: 5, color: '#d4aa3c', delay: '1.6s',  dur: '2.2s' },
          ] as const).map((dot, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: dot.left,
                bottom: dot.bottom,
                width: dot.size,
                height: dot.size,
                borderRadius: '50%',
                background: dot.color,
                animation: `ar-float-up ${dot.dur} ease-in-out ${dot.delay} infinite`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
        <div className="relative flex items-center max-w-[560px]">
          <span className="absolute left-4 text-ink-muted pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="search"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search all questions…"
            autoComplete="off"
            aria-label="Search questions"
            className="
              w-full py-[0.875rem] pl-11 pr-10 text-base
              border-2 border-line rounded-xl
              bg-card text-ink
              focus:outline-none focus:border-[#014D4E]
              placeholder:text-ink-muted
              transition-colors
            "
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 text-ink-muted hover:text-ink transition-colors text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Topic cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink-muted mb-5">
          All topics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICS.map(topic => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className="
                text-left flex flex-col gap-3 p-6
                bg-card border border-line rounded-2xl
                hover:border-[#014D4E] hover:shadow-md
                transition-all duration-150
                cursor-pointer
              "
            >
              <span className="text-[#d4aa3c]">{topic.icon}</span>
              <strong className="text-base font-bold text-ink leading-snug">{topic.label}</strong>
              <span className="text-[0.8125rem] text-ink-dim leading-relaxed">{topic.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Suggestion callout */}
      <div className="mt-12 rounded-xl border border-[#014D4E]/20 bg-[#014D4E]/5 px-6 py-5">
        <p className="font-semibold text-[#014D4E] mb-1">Got an idea for something new?</p>
        <p className="text-sm text-ink-dim mb-3">
          If there is a feature you would find useful that is not listed here, we would love to hear about it. Your suggestions help shape the platform.
        </p>
        <Link
          href="/dashboard/support/new"
          className="inline-block text-sm font-medium bg-[#014D4E] text-white px-4 py-2 rounded-lg hover:bg-[#013838] transition-colors"
        >
          Share a suggestion →
        </Link>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function HelpCentre() {
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null)
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const activeTopic = TOPICS.find(t => t.id === activeTopicId) ?? null

  // Scroll to top whenever the active topic changes
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeTopicId, search])

  // Flat list of all FAQs for search
  const allFaqs = useMemo(
    () =>
      TOPICS.flatMap(topic =>
        topic.faqs.map((faq, i) => ({
          key: `${topic.id}-${i}`,
          topicLabel: topic.label,
          faq,
        }))
      ),
    []
  )

  function toggleFaq(key: string) {
    setOpenFaqs(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function selectTopic(id: string) {
    setActiveTopicId(id)
    setSearch('')
  }

  function goHome() {
    setActiveTopicId(null)
    setSearch('')
  }

  const isSearching = search.trim().length > 0

  return (
    <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 border-t border-line">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex md:flex-col w-56 lg:w-64 shrink-0 border-r border-line bg-canvas">
        <div className="sticky top-0 pt-6 pb-4 overflow-y-auto" style={{ maxHeight: '100vh' }}>
          {/* Home button */}
          <button
            onClick={goHome}
            aria-current={!activeTopicId ? 'true' : undefined}
            className={`
              flex items-center gap-2.5 w-full px-5 py-2.5 mb-2 text-left
              text-[0.9375rem] font-bold transition-colors
              ${!activeTopicId
                ? 'text-[#014D4E]'
                : 'text-[#014D4E] hover:text-[#013838]'
              }
            `}
          >
            <IconHome />
            Help Centre
          </button>

          {/* Nav items */}
          <nav aria-label="Topic navigation">
            <ul role="list" className="list-none m-0 p-0">
              {TOPICS.map(topic => {
                const isActive = activeTopicId === topic.id
                return (
                  <li key={topic.id}>
                    <button
                      onClick={() => selectTopic(topic.id)}
                      className={`
                        flex items-center gap-2.5 w-full px-5 py-2.5 text-left
                        text-sm font-medium transition-all
                        border-l-[3px]
                        ${isActive
                          ? 'border-[#014D4E] bg-[#014D4E]/[0.08] text-[#014D4E] font-bold'
                          : 'border-transparent text-ink hover:bg-[#014D4E]/[0.07] hover:text-[#014D4E]'
                        }
                      `}
                    >
                      <span className={isActive ? 'text-[#014D4E]' : 'text-ink-muted'}>
                        {/* sidebar uses 16px icons */}
                        {topic.id === 'getting-started' && IconPlay(16)}
                        {topic.id === 'kloe-tracker' && IconActivity(16)}
                        {topic.id === 'evidence-files' && IconFile(16)}
                        {topic.id === 'hr-records' && IconBriefcase(16)}
                        {topic.id === 'team-access' && IconUsers(16)}
                        {topic.id === 'reports-analytics' && IconBarChart(16)}
                        {topic.id === 'governance-ops' && IconClipboard(16)}
                        {topic.id === 'security-data' && IconShield(16)}
                        {topic.id === 'support' && IconChat(16)}
                      </span>
                      <span className="flex-1">{topic.label}</span>
                      <span className="text-ink-muted">
                        <IconChevronRight />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* ── Content ── */}
      <div ref={contentRef} className="flex-1 min-w-0 bg-card">
        {/* Mobile topic strip */}
        <div className="md:hidden border-b border-line bg-canvas overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-3 whitespace-nowrap">
            <button
              onClick={goHome}
              className="text-[0.8125rem] font-bold text-[#014D4E] px-3 py-2 shrink-0"
            >
              Help Centre
            </button>
            {TOPICS.map(topic => (
              <button
                key={topic.id}
                onClick={() => selectTopic(topic.id)}
                className={`
                  text-[0.8125rem] font-medium px-3 py-2 shrink-0 border-b-2 transition-colors
                  ${activeTopicId === topic.id
                    ? 'border-[#014D4E] text-[#014D4E]'
                    : 'border-transparent text-ink hover:text-[#014D4E]'
                  }
                `}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {isSearching ? (
          <SearchResults
            query={search}
            allFaqs={allFaqs}
            openFaqs={openFaqs}
            onToggle={toggleFaq}
          />
        ) : activeTopic ? (
          <TopicView
            topic={activeTopic}
            openFaqs={openFaqs}
            onToggle={toggleFaq}
          />
        ) : (
          <HomeView
            onSelectTopic={selectTopic}
            search={search}
            onSearchChange={setSearch}
          />
        )}
      </div>
      <HelpWidget />
    </div>
  )
}
