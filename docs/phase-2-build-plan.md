# AlwaysReady — Phase 2 Build Plan

**Status:** Planning
**Last updated:** July 2026
**Context:** Phase 1 delivered the demo, provisioning, trial management, and core compliance tracking. Phase 2 is the real build — hardening the platform for live care home customers.

---

## Overview

Phase 2 focuses on four core areas identified as essential for day-to-day use by Registered Care Managers and their teams:

1. Automated staff notifications
2. Password management (self-service)
3. Evidence file uploads
4. On-page staff guidance and training

Plus supporting infrastructure improvements that the above depend on.

---

## Prerequisites before Phase 2 begins

- [ ] Google Workspace / hello@alwaysready.uk email working (required for notifications)
- [ ] Supabase Storage enabled on the project (required for file uploads)

---

## Feature 1 — Automated Staff Notifications

### What it does
When an admin assigns a KLOE to a staff member and sets a due date, the system automatically sends an email reminder if the KLOE has not been completed by the specified time. A follow-up nudge can be sent if still outstanding.

### Why it matters
Removes the manual burden on managers to chase staff. Makes AlwaysReady an active compliance tool rather than a passive tracker.

### How it works (technical)
- Add `due_date` and `notify_before_days` fields to `compliance_records` (or the assignment relationship)
- Extend the existing Vercel cron job (currently runs nightly at 2am UTC) to also check for upcoming due dates and send reminder emails
- Email sent via Supabase Auth email or a transactional email provider (e.g. Resend or Postmark — to be decided)
- Email content: plain, professional — "You have a KLOE due in X days: [KLOE name]. Log in to complete it."

### Admin UI changes
- When assigning a KLOE, add optional fields: Due date + Enable reminder (yes/no) + Days before to remind
- Assignment panel on KLOE detail page updated accordingly

### Dependencies
- Email working (hello@alwaysready.uk via Google Workspace)
- Decision on transactional email provider

### Schema changes (analysis required before build)
- `compliance_records`: add `due_date DATE`, `reminder_enabled BOOLEAN DEFAULT FALSE`, `reminder_days INT DEFAULT 3`

---

## Feature 2 — Password Management (Self-Service)

### What it does
Staff members and admins can change their own password from within the platform, without needing to ask an admin to reset it for them.

### Why it matters
Currently admins must reset passwords manually from the Team page. This creates a dependency and a management overhead as team size grows.

### How it works (technical)
- New page: `/dashboard/account` — account settings
- Password change form: current password + new password + confirm new password
- Calls Supabase Auth `updateUser()` which handles validation and hashing
- Success/error feedback on the page

### Admin UI changes
- Add "Account settings" link to the nav or user menu (visible to all roles)
- Admin Team page: "Reset password" remains for cases where staff are locked out

### Schema changes
- None — handled entirely by Supabase Auth

---

## Feature 3 — Evidence File Uploads

### What it does
Staff can upload documents, photos, and PDFs directly to a KLOE as evidence. Uploaded files are stored securely and linked to the KLOE record. Admins and visitors can view uploaded evidence.

### Why it matters
Currently staff can only note where evidence is stored (e.g. "Folder B, shelf 2"). Being able to upload evidence directly to the platform is a significant step up — it means everything is in one place, instantly accessible during an inspection.

### How it works (technical)
- Enable Supabase Storage on the project
- Create a storage bucket: `evidence` — private, RLS-protected (only users in the same organisation can access files)
- New table: `kloe_evidence` — stores file metadata (klo_item_id, organisation_id, uploaded_by, file_name, file_path, file_size, uploaded_at)
- File upload UI on KLOE detail page — drag and drop or click to upload
- Accepted file types: PDF, Word (.docx), Excel (.xlsx), images (JPG, PNG)
- File size limit: 10MB per file (to be confirmed)
- Uploaded files listed on the KLOE detail page with download links
- Admins and visitors can view/download; staff can only view files from their assigned KLOEs

### Admin UI changes
- Evidence panel added to KLOE detail page below the update form
- Upload button + file list with name, size, upload date, uploaded by
- Delete button for admins (with confirmation)

### Schema changes (analysis required before build)
- New table: `kloe_evidence`
- New Supabase Storage bucket: `evidence`
- RLS policies for storage bucket

### Important constraint
- Never store clinical or resident-specific documents — the platform is governance only. This should be communicated clearly in the UI near the upload button.

---

## Feature 4 — On-Page Staff Guidance and Training

### What it does
Small contextual help tooltips appear next to key fields and actions throughout the platform, explaining what each thing means and what good looks like. A training video (when produced) is linked from the Help page.

### Why it matters
Staff using the platform for the first time — especially those unfamiliar with CQC compliance — need guidance without having to leave the page or read a separate manual.

### How it works (technical)
- Info icons (ⓘ) placed next to key fields: RAG status, KLOE status dropdown, evidence notes field, next review date
- Clicking the icon opens a small popover with plain-English guidance
- No database changes required — all static content
- Training video: embed a YouTube or Vimeo link in `/dashboard/help` under a new "Training" section

### Content to write (AJ to draft, Claude to format)
- Tooltip for RAG status: what each colour means and when it changes
- Tooltip for Status dropdown: what Completed / In Progress / Not Started means
- Tooltip for Next review date: why it matters and how to choose a sensible date
- Tooltip for Evidence notes: what to write here and what "good" looks like
- Help page training section: intro text + video embed (video to be produced separately)

### Schema changes
- None

---

## Supporting infrastructure

### Account settings page (`/dashboard/account`)
- Password change (Feature 2 above)
- Display name / full name update
- Future: notification preferences

### Email provider decision
- Supabase has basic email capability but is not designed for transactional volume
- Recommended: **Resend** (simple API, generous free tier, good deliverability, works well with Next.js)
- Alternative: Postmark (more established, similar pricing)
- Decision needed before Feature 1 (notifications) can be built

### Supabase Storage setup
- Enable Storage in Supabase dashboard before Feature 3 build begins
- Create `evidence` bucket with private access
- Write RLS policies to restrict access by organisation_id

---

## Build order (recommended)

| Priority | Feature | Blocker |
|---|---|---|
| 1 | Password change | None — build immediately |
| 2 | On-page tooltips | None — build immediately |
| 3 | Evidence file uploads | Supabase Storage enabled |
| 4 | Automated notifications | Email working + provider decision |

---

## Out of scope for Phase 2

These are good ideas but deferred to Phase 3 or later:

- **Multi-site / enterprise accounts** — one login for providers with multiple CQC-registered locations. Significant schema changes required. Revisit at ~50 customers.
- **Stripe billing integration** — currently manual via email. Build when volume justifies it.
- **Superadmin org list page** — view all provisioned customers at a glance. Build at ~20-30 customers.
- **Auto-email on provisioning → OpenCRM** — leads workflow. Build when email is working.
- **Penetration testing** — commission before ~50 customers or any NHS-adjacent work.
- **GDPR Data Processing Agreement** — legal document, needed before first paying customer signs up.

---

## Notes for the build session

- Read `PROJECT_BRIEF.md` before starting any work
- All schema changes require a migration file — no manual edits in Supabase dashboard
- Analysis-first for structural changes: propose plan and get AJ approval before executing
- Never commit secrets to git
- Push to GitHub regularly — it is the authoritative backup

---

---

## Phase 3 — Personnel & Training Module

**Status:** Planned
**Dependency:** Phase 2 complete, email notifications working

### Overview

A Personnel section sits alongside the compliance module and gives managers a live view of staff training compliance. CQC inspectors specifically scrutinise staff training records during inspections — particularly under the "Safe" and "Well-led" key questions. Making training compliance visible and manageable inside AlwaysReady makes the platform significantly more valuable and harder to replace.

---

### Feature 3.1 — Staff Training Records

#### What it does
Each staff member has a training record — a list of required training modules with completion dates, renewal frequencies, and due dates. The system tracks whether each item is current, coming up for renewal, or overdue.

#### Training modules (standard set — configurable per org)
- Moving and handling
- Safeguarding adults
- Fire safety
- Food hygiene (where applicable)
- Infection prevention and control
- First aid
- Medication administration (where applicable)
- Mental Capacity Act / DoLS awareness
- Dementia awareness
- Health and safety
- Data protection / GDPR awareness
- Any org-specific modules added by the admin

#### RAG logic (same as KLOEs)
- **Green** — completed, renewal date not within 30 days
- **Amber** — renewal due within 30 days
- **Red** — overdue (renewal date has passed)
- **Grey** — no completion date recorded

#### Schema changes (analysis required before build)
- New table: `training_modules` — list of required training types (name, renewal_frequency_months, applies_to_service_types)
- New table: `staff_training_records` — one row per staff member per module (user_id, organisation_id, module_id, completed_date, next_due_date, notes)
- RLS policies matching existing pattern

---

### Feature 3.2 — Personnel Dashboard

#### What it does
A compact dashboard showing all staff members and their overall training compliance at a glance. At-a-glance view for the manager — green staff are fully up to date, amber have training coming up, red have overdue training.

#### UI layout
- Summary strip at the top: total staff / fully compliant / have amber items / have red items
- Staff list below: one row per person, showing name, role, and a mini RAG indicator for each training module
- Click on a staff member to open their full training record
- Filter by role, by RAG status, by training module

---

### Feature 3.3 — Automated Training Reminders

#### What it does
Staff receive an automatic email reminder when a training module is coming up for renewal. Managers receive a weekly digest of training compliance across their team.

#### How it works
- Extends the existing nightly cron job to check for upcoming training due dates
- Staff reminder: sent X days before renewal date (configurable — default 30 days)
- Manager digest: sent weekly, lists all staff with amber or red training items
- Uses the same email infrastructure as KLOE notifications (Feature 1, Phase 2)

#### Dependency
- Email working (Phase 2 prerequisite)
- Transactional email provider in place (Resend or Postmark)

---

### Feature 3.4 — Training Evidence Uploads

#### What it does
Staff (or admins) can upload certificates and completion evidence directly against each training record — the same file upload infrastructure as KLOE evidence (Phase 2, Feature 3).

#### Dependency
- Supabase Storage enabled (Phase 2 prerequisite)

---

### Feature 3.5 — CQC Inspection Pack Integration

#### What it does
The existing Inspection Pack (one-click printable summary) is extended to include a training compliance summary — showing overall training compliance percentage per staff member, with a list of any overdue items. Gives the manager a complete picture to hand to an inspector.

---

### Phase 3 — Pricing consideration

The Personnel & Training module adds significant value beyond basic KLOE tracking. Options to consider when Phase 3 is ready:

- **Include in base price** (£75 + VAT) — simpler, stronger value proposition, easier to sell
- **Premium tier** — charge more for the full package including Personnel
- **Recommended:** include in base price at launch to keep things simple, revisit at scale

---

### Phase 3 — Build order (recommended)

| Priority | Feature | Blocker |
|---|---|---|
| 1 | Staff training records + RAG logic | Phase 2 complete |
| 2 | Personnel dashboard | Training records built |
| 3 | Automated training reminders | Email working |
| 4 | Training evidence uploads | Supabase Storage enabled |
| 5 | Inspection Pack integration | Training records built |

---

*Plan written July 2026. Review and update as priorities evolve.*
