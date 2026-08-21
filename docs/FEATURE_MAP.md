# AlwaysReady Platform — Feature Map

**This file is the authoritative reference for what is built and where it lives.**

Before writing marketing copy, blog content, email copy, help text, or any other content about a platform feature, read the relevant code folder listed below. Do not rely on handoff docs, memory, or assumptions. The codebase is the ground truth.

---

## Dashboard sections (`app/dashboard/`)

| Feature | Folder | What it does |
|---|---|---|
| Dashboard (home) | `app/dashboard/` (`page.tsx`) | Readiness overview, CQC rating card, analytics, getting started wizard |
| KLOE Compliance Tracker | `app/dashboard/kloes/` | 24 KLOEs with RAG status, review dates, priority, notes, evidence checklists, audit trail |
| My KLOEs | `app/dashboard/my-kloes/` | Staff view — only shows KLOEs assigned to the logged-in user |
| Daily Report | `app/dashboard/daily-report/` | KLOEs overdue or due within 30 days; what to focus on today |
| People's Voice | `app/dashboard/peoples-voice/` | 19 CQC "I" statements with confidence ratings, evidence notes, action items, evidence file uploads |
| Mock Inspections | `app/dashboard/mock-inspections/` | Self-assessment tool: full or partial inspection, rate I statements and KLOEs, generates prioritised action plan |
| Post-Inspection | `app/dashboard/post-inspection/` | Log real CQC inspection outcomes, track FAC deadline (10 working days), log FAC items, record outcomes, staff briefing, link to improvement programme |
| Inspection Pack | `app/dashboard/inspection-pack/` | Exportable PDF compliance snapshot for inspectors or boards |
| Reports | `app/dashboard/reports/` | Report Builder with saved views, progress snapshots (deltas vs saved baseline), AI narrative summary, print/PDF |
| HR | `app/dashboard/hr/` | Staff records, DBS, Right to Work, supervision, appraisal, training records, certificate uploads, holiday tracking, absence records, Bradford Factor |
| Incidents | `app/dashboard/incidents/` | Incident recording and tracking |
| Governance | `app/dashboard/governance/` | Governance alerts panel |
| Newsletter | `app/dashboard/newsletter/` | AI-powered newsletter drafting for staff, families, or both |
| Help | `app/dashboard/help/` | Role-specific Help Centre |
| Support | `app/dashboard/support/` | In-platform support ticket submission |
| Account | `app/dashboard/account/` | Organisation settings, team management, billing, logo upload, data export |
| Admin | `app/dashboard/admin/` | Admin-only settings |
| Welcome | `app/dashboard/welcome/` | Getting started wizard for new organisations |

---

## API routes (`app/api/`)

| Route | Purpose |
|---|---|
| `/api/cqc-lookup` | CQC Register lookup by Location ID |
| `/api/evidence-pack` | Generate evidence pack PDF |
| `/api/export-data` | GDPR data export (ZIP) |
| `/api/export-evidence` | Evidence files export |
| `/api/report-snapshot` | Save/retrieve report progress snapshots |
| `/api/report-views` | Saved report view configurations |
| `/api/org-logo` | Organisation logo upload/delete |
| `/api/inbound-*` | Inbound webhooks (waitlist, contact, email, demo, Zeeg) |
| `/api/cron/*` | Scheduled jobs (review reminders, trial emails, onboarding emails, waitlist nurture, governance digest) |
| `/api/superadmin/*` | Superadmin tools |

---

## Superadmin (`app/superadmin/`)

| Section | Purpose |
|---|---|
| `organisations/` | All orgs, charity toggle, delete |
| `leads/` | Waitlist leads, demo leads, Zeeg bookings |
| `support/` | Support ticket desk with AI draft replies |
| `test-emails/` | Send test emails for all email groups |
| `account/` | Superadmin MFA settings |

---

## Key library files (`lib/`)

| File | Purpose |
|---|---|
| `lib/types.ts` | All TypeScript types — single source of truth for data shapes |
| `lib/email.ts` | Email sending infrastructure (Resend + CID attachments) |
| `lib/cqc.ts` | CQC Register API client |
| `lib/ai-draft.ts` | AI draft replies for support desk |
| `lib/waitlist-nurture.ts` | Waitlist nurture email content (emails 1–8) |
| `lib/supabase/` | Supabase client (server and browser) |
| `lib/session.ts` | Current user profile helper |

---

## Rule

**When writing any content about a platform feature: read the code folder first. Then write.**
