# AlwaysReady Inspection Readiness Platform — Project Brief

This file is standing context for this project. Read it at the start of every session before writing any code. Do not delete or restructure this file without AJ's explicit approval.

---

## What This Is

A subscription-based, coded inspection-readiness platform for CQC-regulated adult social care providers (care homes, nursing homes, homecare agencies, supported living providers, and more). It replaces the domain logic previously held in Excel-based compliance trackers with a proper multi-tenant, audited web application.

**The platform is built and deployed.** It is live on Vercel at the URLs below, connected to a Supabase production database. This is not a planning document for a future build — it is the standing reference for an active, deployed product.

This is a **separate, independently deployable product** from the existing AlwaysReady marketing site (static HTML/CSS on Netlify). That site is untouched by this project — different repo, different hosting, no shared codebase.

---

## Live URLs

| Environment | URL |
|---|---|
| Platform (production) | https://alwaysready-inspection-readiness-pl-three.vercel.app |
| Login page | https://alwaysready-inspection-readiness-pl-three.vercel.app/login |
| Superadmin | https://alwaysready-inspection-readiness-pl-three.vercel.app/superadmin |
| Superadmin email | hello@alwaysready.uk |

---

## Platform Status — What Has Been Built

The following modules and features are fully built and deployed:

**Core platform**
- Multi-tenant Next.js + Supabase app with Row-Level Security
- Auth: login (username or email), password reset, MFA (TOTP), idle timeout (15 min)
- Role system: `admin`, `user`, `viewer` with role-based UI and RLS enforcement
- KLOE list, detail, and edit pages
- Compliance records with append-only audit trail
- RAG status (calculated, never manually set)
- Priority (editable per org per KLOE, with history)
- Review frequency (editable per org per KLOE, with history)
- Readiness Dashboard (overall % + per-key-question breakdown)
- Daily Review Report
- KLOE Audit Trail Timeline
- Readiness Trend Over Time
- Exportable Inspection Pack (print-friendly)
- Pre-inspection checklist (per service type, per KLOE)
- Rating characteristics (Outstanding / Good / Requires Improvement / Inadequate per KLOE)
- Evidence file upload with server-side MIME validation and Cloudmersive virus scanning
- On-page tooltips
- People's Voice module
- HR module (staff records, per-org)
- PWA support (installable on iPhone/Android home screen)
- Mobile-responsive layout

**Team management**
- Admin can create staff accounts (no real email required — auto-generated placeholder)
- Username-based login for staff
- KLOE assignment (one assignee per KLOE)
- "My KLOEs" landing page for `user` role
- Inspector/visitor login creation (time-limited `viewer` accounts, configurable duration)
- Visitor login revocation

**Subscription and trial**
- Self-service trial signup flow
- Trial banners and welcome screen
- Demo leads capture with marketing consent
- Nightly cron to reset demo expiry
- Trial email sequence (Days 3, 5, 7, 9, 11, 13) via Resend
- Unsubscribe system (HMAC tokens, /unsubscribe page, marketing_opt_out flag)
- Superadmin provisioning tool (provision Beta users, impersonate orgs)
- Superadmin broadcast messaging
- Support ticket system (user and superadmin views, including external/website enquiries)
- /api/contact-inbound webhook for marketing site contact form

**Sub-services**
- Dementia sub-service checklist items (for applicable service types)
- Autism sub-service checklist items (for applicable service types)
- Sub-services enabled/disabled per org from Account page

**Email infrastructure**
- Resend integration with opt-out check on all outgoing mail
- 12 onboarding emails saved to codebase
- Central email utility (lib/email.ts)
- Unsubscribe token utility (lib/unsubscribe-token.ts)

**Content**
- All 11 service types fully seeded with checklist items
- All 24 KLOE rating characteristics loaded verbatim from the CQC draft framework .docx and verified bullet-by-bullet

**Pending (not yet built)**
- Stripe integration (#132)
- Cancel Subscription button on Account page (#133)
- Dark/light theme toggle (#131)
- Auto-email to superadmin on Beta user provision (#137)
- Data Security Statement and Data Retention Policy added to Help page (#110)

---

## Hard Constraints — Must Never Be Violated

1. **Governance only, never clinical.** No resident-specific care/clinical content, ever. No care plans, no individual health information. Check any new field or module against this boundary before building it.
2. **Append-only audit trail.** Current-state rows are never edited directly — only updated as a side effect of inserting a new history row. `date_reviewed` (the asserted date) and `system_recorded_at` (the actual write time) are always kept as separate fields.
3. **Multi-tenancy enforced at the database layer** via Row-Level Security — never rely on application code alone to separate one organisation's data from another's.
4. **The existing AlwaysReady static site is untouched.** No changes to its hosting, deploy process, or codebase from this project.
5. **Analysis-first workflow.** Propose changes and explain your plan before writing or executing code that makes structural decisions (schema changes, new tables, new dependencies). Routine fixes within an already-agreed plan don't need re-approval each time — but changes to schema, architecture, or the demo-isolation mechanism do.
6. **Accessibility baseline (WCAG 2.1 AA).** Build to this standard — not an optional extra.
7. **Never commit secrets to git.** Supabase URL, anon key, service role key, and all API keys live in `.env.local` only. Never paste credentials into chat.
8. **SUPERADMIN_EMAIL = hello@alwaysready.uk**
9. **Never edit or touch the marketing site repo from this folder.**

---

## KLOE Structure — Framework Identity and Draft Status

**CRITICAL: This platform is built on the CQC Adult Social Care sector-differentiated assessment framework (draft). It is NOT built on the Single Assessment Framework (SAF).** The SAF is CQC's cross-sector framework used for NHS and other providers. Adult social care has its own differentiated framework, and every piece of content in this build must reference only that framework.

The authoritative document is: `REFERENCE/CQC_Draft_Assessment_Framework_ASC_v9.docx` — the full, unabridged CQC draft framework (v9) containing all KLOE questions, scope notes, and rating characteristics. This is the final word on any point of framework content. The CSV file in the REFERENCE folder is a useful derived summary for database seeding, but the .docx overrides it if they ever conflict.

For the full correct list of 24 KLOE titles, the 5 key questions, publication timeline, and common error terms to avoid, see `FRAMEWORK_CONTEXT.md` in the project root. That document must be read at the start of any session involving framework content.

CQC's framework is still in draft as of July 2026 and will not be finalised until Autumn 2026. The 5 key questions (Safe, Effective, Caring, Responsive, Well-led) are stable. The 24 KLOE titles are in draft and may be subject to minor adjustment at publication. **Before the platform goes live to real customers, the final published framework must be reviewed and any changed KLOE titles corrected via migration.**

---

## The 11 Service Types

All 11 service types are fully seeded with checklist content:

1. Residential Care Home
2. Nursing Home
3. Dual-Registered Care Home
4. ARBD Specialist Care Home
5. Homecare Agency
6. Extra Care Housing
7. Shared Lives Scheme
8. Supported Living
9. Specialist College
10. Residential Rehabilitation Service
11. Community Drug and Alcohol Service

Sub-services with additional checklist items: **Dementia**, **Autism**

---

## Accessibility Baseline (WCAG 2.1 AA)

1. **Colour contrast** — text/background contrast should meet WCAG AA ratios (4.5:1 for normal text).
2. **Full keyboard navigation** — every interactive element must work via keyboard alone.
3. **Screen reader support for RAG** — RAG needs a real text equivalent a screen reader can announce, not just a coloured element.
4. **Visible focus indicators** — clear visual indication of which element is focused when tabbing.
5. **Plain, jargon-light UI copy** — form labels and instructions in plain English.

---

## Brand Colours

| Name | Hex |
|---|---|
| Teal | `#00b8a6` |
| Dark Teal | `#014D4E` |
| Gold | `#ffd700` |
| Off-white (background) | `#faf9f6` |
| Body text | `#1a1a1a` |

**Contrast-checked usage rules (verified against WCAG AA):**

- ✅ **Body text on off-white** — 16.53:1. Primary content pairing.
- ✅ **Dark Teal on off-white** — 9.18:1. Safe for headings, links, body text.
- ✅ **White text on Dark Teal** — 9.66:1. Safe for buttons/badges using Dark Teal as background.
- ✅ **Body text on Teal** — 6.97:1. Teal works as a background block with dark text on top.
- ✅ **Gold as highlight only** — with dark text on top. Not a general-purpose background colour.
- ❌ **Teal as text colour on off-white** — 2.37:1. Fails, do not use.
- ❌ **White text on Teal** — 2.50:1. Fails. A Teal button must use dark text, not white.
- ❌ **Gold as text colour on off-white** — 1.33:1. Fails badly — never use Gold as text colour.

**RAG status stays independent of this palette.** Red/Amber/Green keep their standard meaning — do not substitute Gold for Amber.

**Footer content — required on every page:**

```
© 2026 AlwaysReady is a brand of Parker Digital & Print Services Ltd. | Registered Office: 82A James Carter Road, Mildenhall, IP28 7DE
Our tools are designed to support providers in preparing for CQC inspection. They do not constitute official CQC guidance and do not guarantee any particular inspection outcome.
```

---

## Decisions Already Made (do not revisit without asking)

| Area | Decision |
|---|---|
| Frontend framework | Next.js App Router |
| Backend | Supabase (Postgres, Auth, Row-Level Security) |
| Hosting | Vercel |
| Email | Resend |
| Billing | Stripe (integration pending) |
| Repo | GitHub — authoritative backup |
| Demo environment | Per-session shadow org isolation — same RLS mechanism as production |
| Multi-service-type support | Single Supabase project handles all 11 service types |
| Staff login | Username-based, no real email required for `user` role accounts |
| Support protocol | Screen share (Teams / Google Meet) — AJ observes, changes go through Claude |

---

## Demo Reset Approach

**Per-session isolated demo** — each visitor gets their own private, temporary "shadow organisation" created on the fly, isolated from every other visitor using the same RLS mechanism as real tenant isolation. Shadow organisations expire and are cleaned up nightly via cron. This is not a parallel system — it reuses the production multi-tenancy mechanism with a "demo" flag and expiry field.

---

## RAG Status — Calculated, Never Manual

- **Grey / Unassessed** — no review ever completed (`status` = `not_started`, no `date_reviewed`)
- **Red** — review is overdue (`next_review_due` has passed)
- **Amber** — due soon (within 7–14 days), or `status` = `in_progress` but not complete
- **Green** — `status` = `completed` and next review not due soon

RAG is always calculated from underlying data — never a manually editable field. Colour is always paired with a text label for accessibility.

---

## Team Roles

| Role | Access |
|---|---|
| `admin` | Full access — view and edit all KLOEs, assign to team members, manage team, create inspector logins |
| `user` | View all KLOEs; can only edit KLOEs assigned to them. Lands on "My KLOEs" after login. |
| `viewer` | Read-only. Dashboard, KLOE list, KLOE detail + audit trail, Readiness Trend. No edit forms. |

Multiple admins supported. All changes attributed to the individual who made them.

---

## Customer Support Protocol

All customer support is conducted via screen share (Teams or Google Meet). AJ joins the call, observes the customer's screen, diagnoses the issue, then makes any required changes through Claude — not directly in the customer's session.

Never make changes to a customer's data while impersonating their admin account. Use `/superadmin/organisations` to verify what their dashboard looks like. Data corrections go through Claude (tested, version-controlled) or directly via the Supabase dashboard with a clear note.

---

## Pre-Launch Checklist

Before the platform is opened to real paying customers:

1. Review the final CQC ASC framework when published (Autumn 2026)
2. Compare KLOE titles against the 24 in the platform — write corrective migrations if needed
3. Reassess all 11 service type checklists against the final framework
4. Update FRAMEWORK_CONTEXT.md with finalised KLOE list
5. Complete Stripe integration and test end-to-end billing flow
6. Obtain DPA from solicitor
7. Upgrade Resend to Pro plan
8. Point a real domain at the Vercel deployment (DNS at FastHosts)
9. Configure Supabase custom domain (Pro plan)
10. Set up Cloudflare in front of the domain (free plan) — DDoS protection, CDN, hides Vercel origin

---

## Infrastructure Notes

- **Domain registrar:** FastHosts. Existing site DNS points to Netlify and must not be disturbed.
- **Supabase Data API grants:** Every table migration must include explicit `GRANT` statements (e.g. `GRANT SELECT ON public.table TO authenticated;`) alongside RLS policies. This has been a Supabase requirement for new projects since 30 May 2026.
- **Free-tier Supabase** pauses after 7 days of inactivity (20–30 second cold start). A keep-alive ping mitigates this during the pre-launch period if traffic is infrequent.

---

## Schema Reference

- `key_questions` — 5 CQC key questions (Safe, Effective, Caring, Responsive, Well-led), static
- `service_types` — 11 Adult Social Care service types, static
- `organisations` (id, name, cqc_location_id, service_type, subscription_tier, is_demo, demo_expires_at)
- `users` (id, organisation_id, email, full_name, username, role [`admin`|`user`|`viewer`], viewer_expires_at, assigned_to, marketing_opt_out, personal_email, mobile_number)
- `klo_items` — 24 KLOEs with title, wording, scope, key_question_id, rating_outstanding, rating_good, rating_ri, rating_inadequate, display_order
- `klo_checklist_items` — per service type checklist items linked to klo_items
- `organisation_sub_services` — which sub-services (Dementia, Autism) are enabled per org
- `compliance_records` — current state, one row per org per KLOE
- `compliance_record_history` — append-only audit trail
- `review_frequency_history` — append-only log of frequency changes
- `priority_history` — append-only log of priority changes
- `kloe_evidence` — uploaded evidence files (with scan_status for virus scanning)
- `support_tickets` — customer support and website enquiries
- `demo_leads` — trial signup captures
- `peoples_voice` — People's Voice module records
- `hr_records` — HR module staff records

---

## Deploy Workflow

Push to GitHub → Vercel auto-deploys to production. Database schema changes are migration files committed to this repo and applied manually via Supabase SQL Editor by AJ.

Never use `supabase db push` against the production database. Always use the SQL Editor for production migrations — it gives AJ control over what runs and when.

---

## To Do / Backlog

| # | Item | Owner |
|---|---|---|
| 110 | Add Data Security Statement and Data Retention Policy to Help page | Claude |
| 131 | Add dark/light theme toggle | Claude |
| 132 | Set up Stripe integration | Claude |
| 133 | Add Cancel Subscription button to Account page | Claude |
| 135 | Obtain DPA from solicitor | AJ |
| 136 | Upgrade Resend to Pro plan before go-live | AJ |
| 137 | Add auto-email to superadmin provision flow for Beta users | Claude |
| 163 | Complete sales@ inbound email wiring (Resend inbound domain + webhook secret in Vercel + Gmail forward) — deferred until Resend Pro upgrade | AJ + Claude |

---

*This brief is the source of truth for this project's decisions and constraints. If something here conflicts with a new instruction from AJ, ask for clarification rather than silently choosing one over the other.*
