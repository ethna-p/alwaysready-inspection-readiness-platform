# AlwaysReady Inspection Readiness Platform — Project Brief

This file is standing context for this project. Read it at the start of every session before writing any code. Do not delete or restructure this file without AJ's explicit approval.

---

## What This Is

A subscription-based, coded inspection-readiness platform for CQC-regulated adult social care providers (care homes, nursing homes, homecare agencies, supported living providers). It replaces the domain logic currently held in Excel-based compliance trackers with a proper multi-tenant, audited web application.

This is a **separate, independently deployable product** from the existing AlwaysReady marketing site (static HTML/CSS on Netlify). That site is untouched by this project — different repo, different hosting, no shared codebase.

---

## Hard Constraints — Must Never Be Violated

1. **Governance only, never clinical.** No resident-specific care/clinical content, ever. No care plans, no individual health information. Check any new field or module against this boundary before building it.
2. **Append-only audit trail.** Current-state rows are never edited directly — only updated as a side effect of inserting a new history row. `date_reviewed` (the asserted date) and `system_recorded_at` (the actual write time) are always kept as separate fields.
3. **Multi-tenancy enforced at the database layer** via Row-Level Security — never rely on application code alone to separate one organisation's data from another's.
4. **The existing AlwaysReady static site is untouched.** No changes to its hosting, deploy process, or codebase from this project.
5. **Analysis-first workflow.** Propose changes and explain your plan before writing or executing code that makes structural decisions (schema changes, new tables, new dependencies). Routine fixes within an already-agreed plan don't need re-approval each time — but changes to schema, architecture, or the demo-isolation mechanism do.
6. **Accessibility baseline (WCAG 2.1 AA).** Build to this standard from the start — see "Accessibility Baseline" section below. Not an optional extra to bolt on later.

---

## Accessibility Baseline (WCAG 2.1 AA)

Build to this from the start — retrofitting accessibility is far more expensive than designing for it, and this platform's buyers (often public-sector-adjacent, local-authority-commissioned care providers) and users (care sector staff across a wide range of ages and abilities) both make this worth doing properly, not as an afterthought.

1. **Colour contrast** — text/background contrast should meet WCAG AA ratios (commonly 4.5:1 for normal text).
2. **Full keyboard navigation** — every interactive element (status updates, priority edits, evidence location fields) must work via keyboard alone, not mouse-only.
3. **Screen reader support for RAG** — extends the colour-blindness fix already specified in the RAG Status section: RAG needs a real text equivalent a screen reader can announce, not just a coloured element.
4. **Visible focus indicators** — clear visual indication of which element is focused when tabbing through the interface via keyboard.
5. **Session timeout warning for the demo** — since shadow organisations expire after inactivity, warn the visitor before expiry (e.g. "Your demo session will expire in 2 minutes") rather than silently logging them out mid-session.
6. **Plain, jargon-light UI copy** — form labels and instructions in plain English, consistent with how this brief itself is written for AJ.

---

## Brand Colours

| Name | Hex |
|---|---|
| Teal | `#00b8a6` |
| Dark Teal | `#014D4E` |
| Gold | `#ffd700` |
| Off-white (background) | `#faf9f6` |
| Body text | `#1a1a1a` |

**Contrast-checked usage rules (verified against WCAG AA, 4.5:1 normal text / 3:1 large text):**

- ✅ **Body text on off-white** — 16.53:1. Primary content pairing.
- ✅ **Dark Teal on off-white** — 9.18:1. Safe for headings, links, body text.
- ✅ **White text on Dark Teal** — 9.66:1. Safe for buttons/badges using Dark Teal as background.
- ✅ **Body text on Teal** — 6.97:1. Teal works as a background block with dark text on top.
- ✅ **Body text on Gold** — 12.41:1, and **Dark Teal on Gold** — 6.89:1. **Gold is highlight-only** — small accents, badges, or callouts with dark text on top. Not a general-purpose background colour.
- ❌ **Teal as text colour on off-white** — 2.37:1. Fails, do not use.
- ❌ **White text on Teal** — 2.50:1. Fails, do not use — a Teal button must use dark text, not white text, or use Dark Teal instead.
- ❌ **Gold as text colour on off-white** — 1.33:1. Fails badly, near-invisible — never use Gold as text colour directly on the background.

**In short:** Teal is an accent/background colour (with dark text on top, never white text). Gold is highlight-only — not a general background. Dark Teal is the most flexible colour — safe as text, as a background with white text, and on light backgrounds generally.

**RAG status stays independent of this palette.** Red/Amber/Green keep their standard, universally-recognisable meaning — do not substitute Gold for Amber or otherwise reinterpret RAG using brand colours, since RAG's value depends on instant, unambiguous recognition, not brand consistency.

**Logo placement:** the AlwaysReady logo (gold circle with white checkmark + teal "AlwaysReady" wordmark) must appear in the top-left corner on every page of this platform, consistent with the existing site's header. **Asset ready:** `alwaysready-logo.svg` in `/reference`. Note: the wordmark's Teal text colour is exempt from the contrast rules above — logos/brand marks are excluded from WCAG contrast requirements, this is not an error to fix.

**Footer content — required on every page, including the demo:**

```
© 2026 AlwaysReady is a brand of Parker Digital & Print Services Ltd. | Registered Office: 82A James Carter Road, Mildenhall, IP28 7DE
Our tools are designed to support providers in preparing for CQC inspection. They do not constitute official CQC guidance and do not guarantee any particular inspection outcome.
```

The disclaimer (second line) matters most for the demo specifically — the platform's structure closely mirrors CQC's own framework (same key questions, KLOEs, RAG-style rating), so it needs to be clear this isn't official CQC guidance or an endorsed tool. Style the footer consistently with the existing marketing site's footer treatment where practical.

---

## Decisions Already Made (do not revisit without asking)

| Area | Decision |
|---|---|
| Frontend framework | Next.js |
| Backend | Supabase (Postgres, Auth, Row-Level Security, Edge Functions) |
| Billing | Stripe, handled entirely separately from Supabase's own billing |
| Repo persistence | Full project + git history kept locally and indefinitely; pushed to GitHub as the authoritative backup (not the local folder, not Claude's memory) |
| Demo environment | Completely separate Supabase project from production, never shared/flagged data within one project |
| Demo reset approach | **Per-session isolation** — see reasoning below |
| Excel trackers | Used only as a domain-logic reference (KLOE structure, review-cycle rules, terminology) — not a live system this integrates with |
| Brand | Stays under the AlwaysReady brand and domain |
| Subdomain naming | Not yet decided — not needed until public launch; use default host URLs during the demo build |
| Multi-service-type support | Single Supabase project handles all 11 Adult Social Care service types — see "Service Types" section below |

---

## Demo Reset Approach — Reasoning (important, don't second-guess this)

**Decision: per-session isolated demo**, not a shared scheduled-reset dataset.

The platform's buyers are CQC-regulated providers whose core concern is data governance and evidence integrity. If a demo visitor saw another concurrent visitor's data appear in their own sandbox — even briefly — they would reasonably read that as reflecting the real platform's data-handling capability, not dismiss it as a demo quirk. Given the product's entire pitch rests on trustworthy, auditable, properly separated record-keeping, that risk is disqualifying rather than minor.

**Implementation:** each visitor gets their own private, temporary "shadow organisation" created on the fly when they start the demo, isolated from every other concurrent visitor using the same Row-Level Security mechanism used for real tenant isolation. Shadow organisations expire and are cleaned up after a period of inactivity via a scheduled job. This reuses the production multi-tenancy mechanism — it's an incremental addition (a "demo" flag on an organisation plus an expiry/cleanup job), not a parallel system.

---

## Service Types — Architecture Decision

There are 11 Adult Social Care service types the platform will eventually support (care homes, nursing homes, homecare agencies, supported living, etc.). The demo build covers **one service type only**, but the schema should support all 11 from the start.

**Decision: one Supabase project handles all 11 service types.** Service type is a data attribute, not an infrastructure boundary — it does not require separate projects, separate databases, or extra Supabase cost. The demo/production project split is solely about environment isolation (resettable sandbox vs. real data) and is unrelated to service type.

**Confirmed:** the CQC KLOE standards are the same ~24 KLOEs across all service types — only the evidence/detail expected under each KLOE varies by service type. This means:

- `klo_items` stays a single universal, static reference table exactly as originally scoped — no per-service-type mapping needed for *which* KLOEs apply.
- Add a `service_types` reference table (id, name) listing all 11 types, seeded once, not subscriber-editable — same pattern as `klo_items`.
- `organisations.service_type` references this table.
- Optional, later (not needed for the demo): a service-type-specific evidence guidance table or field, if AJ wants tailored guidance text per service type under each KLOE. Build this only if/when needed — the core schema doesn't require it upfront.

Real data separation between organisations continues to be handled entirely by Row-Level Security scoped to `organisation_id`, regardless of service type — two organisations of the same service type are isolated from each other exactly as strictly as two of different types.

**The 11 service types to seed into `service_types`:**

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

The demo build only needs one of these active/selectable — **confirmed: Residential Care Home** — but all 11 should be seeded into the reference table from the start, since it costs nothing extra and avoids a schema change later.

---

## KLOE Structure — Draft Framework Note

CQC's KLOE framework is still in draft as of mid-2026 and won't be finalised until Autumn 2026. The 5 key questions (Safe, Effective, Caring, Responsive, Well-led) are stable; what may still shift is which key question some of the ~24 KLOEs fall under.

**Decision:** build the mapping as a proper relationship, not hardcoded:
- `key_questions` table — the 5 fixed key questions
- `klo_items.key_question_id` — foreign key pointing to the current key question for each KLOE

This means when the final mapping lands, updating it is a simple data change (a few `UPDATE` statements), not a schema change or rebuild.

**No audit-trail snapshotting needed for this.** AJ does not intend to launch the platform to real subscribers until after CQC finalises the framework, so there is no live customer data that could be recorded under a draft mapping and later need reinterpreting against a changed one. Demo data is also ephemeral (per-session isolation), so it carries no risk here either. Build the simpler version — a live foreign key reference, no historical snapshot of the key question needed at write time. Revisit only if the launch timeline ever moves earlier than CQC's finalisation date.

---

## Review Frequency & Evidence Type — Design Decisions

CQC has not yet specified what evidence types will be expected per KLOE, or a fixed review frequency. Both are handled as flexible, provider-controlled settings rather than hardcoded assumptions:

**Evidence type:** kept generic, not a fixed taxonomy. `compliance_records.evidence_location` remains a flexible text/URL field, and `evidence_files` allows optional uploads. Do not build a rigid evidence-category dropdown (e.g. "policy document" vs "training certificate") until CQC's final guidance clarifies what's expected — a guessed taxonomy is expensive to unwind later.

**Review frequency:** set **per KLOE, per organisation** — a Registered Care Manager can set different frequencies for different KLOEs (e.g. safeguarding training every 3 months, fire risk assessment annually), and different organisations can set different frequencies for the same KLOE. **Changeable anytime.**

Because a frequency change is itself something an inspector could reasonably question ("why did this change, and when?"), it gets the same append-only audit treatment as compliance reviews themselves:

- `compliance_records.review_frequency_days` — the current, active frequency for that organisation's KLOE
- `review_frequency_history` — append-only log of every frequency change (organisation_id, klo_item_id, old_frequency, new_frequency, changed_by, changed_at)

`next_review_due` continues to be calculated from `date_reviewed` + the frequency active at that time, per KLOE per organisation — this doesn't change the review-completion logic already planned, it adds a separate audit trail around the frequency setting itself.

---

## Future Feature — Evidence Retrieval Readiness (not in demo scope)

**Origin:** a CQC report on a 'Good'-rated provider noted as a failing that the RCM could not *immediately* locate/show evidence for a KLOE during inspection — despite eventually producing everything after a pause. The gap CQC flagged is speed and demonstrable readiness, not whether evidence exists.

**Not part of the demo build.** Noted here so the schema and product roadmap account for it later without needing rework:

1. **Structured Evidence Index** — replace the current freeform `evidence_location` with a short, mandatory, human-readable locator (e.g. "Digital: SharePoint > Fire Safety > 2026" or "Physical: Blue folder, office cabinet, top shelf") rather than just an optional link. The point is a precise pointer, not the evidence itself.
2. **Evidence Map screen** — a single view showing every KLOE and its locator at a glance, designed to be pulled up live in front of an inspector. Cheap to build once the Evidence Index field exists.
3. **Readiness drills** — a practice mode where the system picks a random KLOE and times how quickly the RCM locates and confirms the evidence, logging results (KLOE, time taken, pass/fail against a target). Builds a track record of demonstrable readiness over time and surfaces weak spots before a real inspection. A genuine differentiator given the "Inspection Readiness" positioning, but a larger build — a phase 2 candidate, not demo scope.
4. **Re-confirmation folded into the existing review cycle** — rather than a separate task, add a lightweight "confirm evidence location is still accurate" step to the review action that already happens, so the record builds naturally without extra admin burden.

When this is scoped for a future phase, revisit the `evidence_location` field design (item 1) first, since the other three features build on it.

---

## Readiness Dashboard — In Demo Scope From the Start

The existing Excel trackers show a % readiness dashboard, and this needs to carry over into the coded platform from the demo build onward — **not deferred to a later phase**.

**What it measures:**
- **Overall %** — the proportion of KLOEs currently up to date (i.e. `next_review_due` in the future, not overdue) out of all applicable KLOEs for that organisation
- **Breakdown by key question** — the same % calculation, grouped by each of the 5 key questions (Safe, Effective, Caring, Responsive, Well-led), using the `key_question_id` relationship on `klo_items`

**How it's built:** this is a computed view over existing data, not new core schema — it reads from `compliance_records` (current state, including `next_review_due`) joined to `klo_items` and `key_questions`, and aggregates. No new tables needed beyond what's already planned; this is a dashboard/reporting layer on top of the schema already scoped.

**Definition of "up to date":** the Excel trackers are a prototype, not a definitive source of truth for evidence logic — do not treat their exact formulas as binding. The actual rule: a KLOE counts as compliant if **`status` = `completed`** (see Status Field below) **AND** `next_review_due` has not yet passed. If a review becomes overdue, it no longer counts as compliant on the dashboard even if `status` was previously set to `completed` — the overdue check overrides a stale completed status.

**KLOE reference source — updated:** the authoritative reference for KLOE content is now `AlwaysReady_CQC_KLOE_KeyQuestion_Mapping.csv` in `/reference` (24 KLOE rows, all 5 key questions, includes full rating-characteristic wording for Outstanding/Good/Requires Improvement/Inadequate) — **not** the original Excel tracker. The Excel tracker predates this and used a different, since-superseded workflow (manually-editable RAG, single fixed priority) — retain it only if useful as example seed data, but do not build against its logic.

## I Statements — CQC Draft Content, Not Yet Actionable

CQC's new inspection format introduces "I statements" per key question (person-centred framing text, e.g. *"I feel safe and am supported to understand and manage any risks"*), provided in `AlwaysReady_CQC_KeyQuestion_I_Statements.csv` in `/reference`. 22 of 24 expected rows have statement text; Well-Led has none yet — CQC's own draft v9 has not published any for that key question, this is not a gap in AJ's data.

**Decision: do not build tracking or scoring logic around I statements yet.** CQC has not specified how these will be used, tracked, or rated — building a structure now would mean guessing at a mechanism that may not match what CQC eventually specifies, the same reasoning already applied to evidence type and the draft KLOE-to-key-question mapping. Hold the CSV as reference material in `/reference` only. Revisit once CQC clarifies intended use — likely after the framework is finalised in Autumn 2026, alongside the KLOE mapping itself.

## Status Field — Not Started / In Progress / Completed

As evidence is collated, an RCM needs to track progress, not just a final completion date. Add:

- `compliance_records.status` — one of `not_started`, `in_progress`, `completed`. Set manually by the RCM as they work (e.g. flip to `in_progress` once they've started gathering evidence, `completed` once a review is actually recorded).
- `compliance_record_history` also needs a `status` column, so status changes are captured in the append-only trail the same way review completions are — the history should show the full progression (e.g. marked in progress on one date, completed on another), not just the final state.

This status field is independent of, but combined with, the overdue check above for the readiness dashboard calculation.

## RAG Status — Single Authoritative Signal (Calculated, Not Manually Set)

The platform uses a single RAG (Red/Amber/Green/Unassessed) indicator as the authoritative "how urgent is this" signal, appearing consistently everywhere (KLOE list, readiness dashboard, daily report). To preserve its authority, **RAG is always calculated automatically from underlying data — never a manually editable field** (unlike AJ's earlier OpenCRM tracker, where RAG had its own edit link). This keeps it consistent and prevents drift.

**Calculation logic:**
- **Grey / Unassessed** — no review has ever been completed for this KLOE yet (`status` = `not_started` and no `date_reviewed` recorded)
- **Red** — review is overdue (`next_review_due` has passed)
- **Amber** — due soon (e.g. within the next 7–14 days), or `status` = `in_progress` but not yet complete
- **Green** — `status` = `completed` and the next review isn't due soon

**UI rendering:** RAG must display as an actual visual colour indicator (e.g. a coloured dot or badge) everywhere it appears — not text alone ("Red"/"Amber"/"Green" as plain words defeats the purpose of at-a-glance scanning, which is the entire premise behind the Daily Review Report). **Accessibility requirement:** colour must not be the only signal — pair the colour swatch with a text label and/or distinct icon/shape per status, since colour-blindness (red/green confusion in particular) affects a meaningful share of users and this is a compliance/safety-relevant product.

## Priority — Editable Per Organisation, Per KLOE

Priority (1–5) reflects how serious the consequences are if a KLOE is non-compliant — a different axis from urgency/RAG. It is **not** a fixed universal property: RCMs must be able to view and change the priority of any KLOE for their own provider setting.

- `compliance_records.priority` — the current, active priority for that organisation's KLOE, editable anytime by the RCM
- Optional: `klo_items.default_priority` — a suggested starting value so RCMs aren't setting all ~24 priorities from scratch, but each organisation's actual value is fully theirs to override
- `priority_history` — append-only log of every priority change (organisation_id, klo_item_id, old_priority, new_priority, changed_by, changed_at), same audit reasoning as `review_frequency_history` — an inspector or incoming manager could reasonably ask why a priority changed and when

---

## Daily Review Report — In Demo Scope

**Purpose:** a single screen an RCM can scan in about 5 minutes each morning to spot outstanding reviews, designed so urgency is unmissable rather than requiring the RCM to scroll and mentally filter a full KLOE list.

**Contents, in priority order:**
1. **Overdue items** (Red) first
2. **Due soon** (Amber, e.g. within 7–14 days) next
3. Within each group, sorted by **priority** (1 = most serious consequence) so a Red + Priority 1 item is clearly more prominent than a Red + Priority 5 item, even though both are "overdue"

**Each row shows:** KLOE code, key question, short description, RAG colour, priority, due date, status.

**Build note:** this is a filtered, sorted view over `compliance_records` joined to `klo_items` and `key_questions` — no new core tables beyond what's already scoped (RAG is calculated, not stored; priority and status already live on `compliance_records`).

---

## KLOE Audit Trail Timeline — In Demo Scope

**Purpose:** make the platform's core trust promise visible, not just structurally present. Clicking any KLOE reveals its full history — every status change, evidence update, priority change, and frequency change, with who made it and when — as a single chronological timeline.

**Why this matters:** the append-only audit trail already exists across `compliance_record_history`, `review_frequency_history`, and `priority_history`. Without a view surfacing it, a demo visitor never actually sees the thing that differentiates this platform from a spreadsheet. This is likely the single most persuasive screen in the demo — it turns "we track everything properly" from a claim into something a prospect clicks and verifies themselves.

**Build note:** a read-only view merging entries from the three history tables for a given `organisation_id` + `klo_item_id`, sorted chronologically. No new tables — this is a presentation layer over data already being captured.

---

## Readiness Trend Over Time — In Demo Scope

**Purpose:** show overall % readiness (and the per-key-question breakdown from the Readiness Dashboard) changing over recent weeks, not just a single current snapshot. This directly demonstrates continuous improvement — a core theme of CQC's Well-led domain — and reinforces the same trust-building idea as the audit trail timeline: nothing shown is fabricated after the fact, it's a real history.

**Build note:** derived from the same history tables already being captured (specifically `compliance_record_history`, since status/completion changes over time drive the % calculation). For the demo, this can be computed on the fly from history rather than requiring a separate snapshot table — revisit as a materialised/scheduled snapshot only if performance becomes a concern with real customer data volumes later.

---

## Exportable "Inspection Pack" Summary — In Demo Scope

**Purpose:** a one-click, printable snapshot — current readiness %, RAG breakdown, priority flags — formatted as something an RCM could genuinely hand to an inspector or a board member. This is the most literal expression of "Inspection Readiness" as a product: not just software checked privately, but a physical artifact produced with confidence when asked.

**Build note:** more build effort than the two above — needs a formatted export (PDF or clean print-friendly view) rather than just an on-screen report. Reuses the same underlying data as the Readiness Dashboard and Daily Review Report; the new work here is presentation/formatting rather than new data logic.

---

## Team Roles & Task Delegation — Post-Demo Feature

**Purpose:** RCMs cannot personally gather evidence for all 24 KLOEs. Delegation lets them assign specific KLOEs to named team members — Deputy Manager, Senior Carer, Activities Coordinator — who each log in, see their assignments, and update evidence and status. The RCM retains full visibility and can override anything.

### Roles

Three roles on `users.role` (finalized — do not rename):

| Role | Who | Access |
|---|---|---|
| `admin` | RCM / Registered Manager / Deputy (when covering) | Full access — view and edit all KLOEs, assign to team members, manage team, create inspector logins |
| `user` | Care staff, deputies, coordinators | View all KLOEs; can only edit KLOEs assigned to them |
| `viewer` | Board members, owners, CQC inspectors | Read-only — sees Dashboard, KLOE list, KLOE detail + audit trail, Readiness Trend; cannot see edit forms, Daily Report, or Inspection Pack generator |

Multiple admins are supported. The RCM is admin by default at setup; they can promote others to admin (e.g. deputy covering during leave or inspection). All changes are attributed to the individual who made them — the audit trail gives full accountability regardless of how many admins exist.

### Access model

All org members can see all KLOEs — siloed "only see yours" access is inappropriate for a compliance culture where CQC expects whole-team awareness. The distinction between `admin` and `user` is edit access, not view access. `viewer` accounts are purely read-only.

### Assignment model

Simple v1 approach: `assigned_to UUID REFERENCES users(id)` on `compliance_records`. One assignee per KLOE. The sync trigger does NOT touch `assigned_to` — admin assignments persist across compliance record updates.

Do not build a separate tasks table for v1 — this would be over-engineering before real users clarify what they actually need. Revisit only if providers ask for multiple assignees per KLOE, task-level granularity within a KLOE, or a separate task status independent of the KLOE's compliance status.

### "My KLOEs" personal space (Step 13)

Role-based landing pages after login:

- **`admin`** → full Inspection Readiness dashboard (overall %, key question breakdown, team workload card)
- **`user`** → "My KLOEs" — a personal landing page showing only KLOEs assigned to them, with RAG status, next due date, and a direct update link. If nothing is assigned yet, shows a clear message ("Nothing assigned to you yet — speak to your admin"). No noise, no distraction.
- **`viewer`** → full dashboard in read-only mode

The KLOE list page shows an "Assigned to" column (admins see who owns what). The team workload card on the dashboard shows each assignee's RAG breakdown so admins can see at a glance who is behind.

### User management & login (Step 13 — key decisions)

**Staff in small care homes typically do not have work email addresses.** Personal email addresses are unsuitable — data handling risks, and family members sometimes share accounts. The platform therefore generates a placeholder login credential internally and does not require a real email address for staff accounts.

**How it works:**
- The RCM creates a staff account via the team management page — enters a name and (optionally) a role
- The platform auto-generates a placeholder login identifier (e.g. `sarah.jones.{shortOrgId}@staff.alwaysready.uk`) for use by Supabase Auth internally — the staff member never sees or uses this
- The RCM sets an initial password and tells the staff member directly (in person, via handover book, or WhatsApp)
- The login screen asks for **username** (not "email address") + password
- The staff member's name (not email) is what appears in the UI and in the audit trail

**Password resets:** since there is no real email behind staff accounts, self-service reset is not possible. The RCM resets passwords on behalf of staff via the team management page. This is acceptable for the target setting — small homes where the RCM knows everyone and manages day-to-day access decisions.

**Admin accounts** (RCM and deputies) may optionally have a real email address for login — this enables self-service password reset and is appropriate since they are more likely to have a work or personal business email.

**`full_name` field:** add `full_name TEXT` to the `users` table (Step 13 migration). Display name in the UI, assignment dropdowns, and audit trail. Fall back to the username portion of the generated email if no name is set.

### Notifications (Step 13 — in-app only for staff)

Since staff accounts have no real email address, email notifications to staff are not viable. Notifications are **in-app only** for `user` role accounts — staff see their assigned KLOEs when they log in to their "My KLOEs" page. The admin is responsible for alerting staff via existing channels (verbal, WhatsApp, handover book) that something new has been assigned.

For `admin` accounts (who may have a real email), email notifications on overdue KLOEs remain a future option via Supabase Edge Functions + a transactional email provider (e.g. Resend). Do not block Step 13 on this — it is a follow-on.

---

## Inspector Access — Viewer Role in Practice

**Context:** CQC inspections run for 2–3 days. Shorter inspections (2 days) typically indicate a provider performing well — inspectors have seen what they need quickly. Longer inspections (3+ days, sometimes with return visits) indicate concern or active investigation of a failing provider. The providers who most need AlwaysReady to be thorough and evidenced are exactly the ones whose inspectors will use viewer access most intensively.

**The proposition:** instead of handing an inspector a printed PDF, the RCM hands them a tablet or laptop with a read-only login. The inspector sees live data, real audit trails, real timestamps — nothing that could have been prepared in the hour before they arrived. This is a direct, visible expression of the platform's trust proposition.

### What inspectors can see (viewer role)

- Readiness Dashboard — overall % and per-key-question breakdown
- Full KLOE list with RAG statuses
- Individual KLOE detail pages including the full audit trail
- Readiness Trend — demonstrates continuous improvement over time, a core Well-led theme

### What inspectors cannot see (viewer role)

- Edit forms (read-only enforced at RLS level, not just UI)
- Daily Report (internal triage — not relevant to an inspector)
- Inspection Pack generator (internal tool)
- Team management

### Creating inspector access

The RCM needs to create an inspector login in under a minute, on the spot, under pressure — CQC can arrive unannounced. The UI must be a single action: one button, generates a time-limited login, displays credentials clearly for immediate handover.

### Access duration

Inspector logins are temporary. Duration is set by the RCM when creating the login, not hardcoded — suggested default is 3 days (covers a standard 3-day inspection), with a simple "extend by 1 day" option visible to managers. This allows the RCM to respond if an inspection runs longer than expected, which is itself a stress signal — they should not be scrambling to renew credentials mid-inspection.

### Multiple inspectors

CQC typically sends a small team for anything beyond a brief visit (lead inspector + specialist inspectors, e.g. a nurse inspector for a nursing home). Each inspector should have a separate login — CQC's own governance requires individual accountability. The inspector access UI should support creating multiple viewer accounts per inspection event, each clearly labelled.

### Account labelling

Inspector logins should display the org name prominently ("Sunrise Care Home — Inspector Access") so there is no ambiguity about which provider's data they are viewing. Inspectors see multiple providers; a generic dashboard with no org-level framing is a risk.

### Expiry and cleanup

Inspector accounts expire automatically when their duration window closes. The same expiry/cleanup mechanism used for demo shadow orgs (Step 10) applies here — a `viewer_expires_at` field on `users`, checked at login or via a scheduled cleanup job. Expired inspector accounts are deactivated, not deleted, preserving the audit record of who accessed what.

---

## Recommended Build Order

1. `organisations` + `users` + auth
2. `klo_items` seeded from the existing tracker structure (see `/reference` folder)
3. `compliance_records` + `compliance_record_history` + the write-trigger between them
4. Single end-to-end flow: log in → view KLOEs → update one → see history
5. **Readiness dashboard: overall % + breakdown by key question** (see "Readiness Dashboard" section above) — in demo scope, not deferred
6. **Daily Review Report** (see "Daily Review Report" section above) — in demo scope, not deferred
7. **KLOE Audit Trail Timeline** (see section above) — in demo scope, not deferred
8. **Readiness Trend Over Time** (see section above) — in demo scope, not deferred
9. **Exportable Inspection Pack summary** (see section above) — in demo scope, not deferred ✅ Done
10. Demo-specific: shadow organisation creation on demo start (service type: Residential Care Home) + expiry/cleanup job
11. **Team roles** — enforce `manager` / `member` / `viewer` via RLS; role-based UI gating
12. **Task delegation** — `assigned_to` on `compliance_records`, captured in history, "My Tasks" filter on KLOE list, manager-facing assignment UI
13. **Team management page** — manager can view team members, assign roles; simple add-member form (Supabase invite)
14. **Inspector access** — manager can create temporary `viewer` accounts with configurable duration (default 3 days), extend-by-1-day option, multiple accounts per inspection, auto-expiry via cleanup job (shared mechanism with Step 10)
15. **Email notifications** (follow-on) — assignment notifications and overdue reminders via Edge Functions + Resend

---

## Schema Reference (as sketched during scoping)

- `key_questions` — static reference table, the 5 CQC key questions (Safe, Effective, Caring, Responsive, Well-led), seeded once, stable
- `service_types` — static reference table, all 11 Adult Social Care service types, seeded once, not subscriber-editable
- `organisations` (id, name, cqc_location_id, service_type, subscription_tier)
- `users` (id, organisation_id, email, full_name [nullable — added Step 13], role [`admin` | `user` | `viewer`], viewer_expires_at [nullable — set on temporary inspector/board accounts, null for permanent team members])
- `klo_items` — static reference table, ~24 KLOEs, seeded once, not subscriber-editable, with a `key_question_id` foreign key linking each KLOE to its current key question
- `compliance_records` — current state only, one row per organisation per KLOE (includes status, priority, date_reviewed, next_review_due, review_frequency_days, evidence_location, assigned_to [nullable FK → users.id], pointer to latest history row)
- `compliance_record_history` — append-only audit trail (who changed what, status at time of change, date_reviewed as asserted, system_recorded_at as actual write time, note field for context)
- `review_frequency_history` — append-only log of review frequency changes (organisation_id, klo_item_id, old_frequency, new_frequency, changed_by, changed_at)
- `priority_history` — append-only log of priority changes (organisation_id, klo_item_id, old_priority, new_priority, changed_by, changed_at)
- `evidence_files` — optional, for file uploads rather than just links

Note: `next_review_due` is always calculated from `date_reviewed` at write time, never from "today," and captured per history row so the calculation can be proven correct after the fact.

---

## Live URLs

| Environment | URL |
|---|---|
| Platform (production) | https://alwaysready-inspection-readiness-pl-three.vercel.app |
| Login page | https://alwaysready-inspection-readiness-pl-three.vercel.app/login |
| Superadmin | https://alwaysready-inspection-readiness-pl-three.vercel.app/superadmin |

---

## Deploy Workflow (differs from the AlwaysReady website)

Supabase deploys are **three separate things**, not one zip-and-go:
- Database schema (migrations) — `supabase db push`
- Edge Functions — deployed via CLI once linked to a project
- Environment secrets — set via CLI from an env file (separate files for demo vs. production)

Recommended automation: GitHub Actions deploying on push — staging branch → demo project, main branch → production — from this same repository.

Environment/API credentials (Supabase URL, anon key, database password) must live only in `.env` files, never committed to git. Confirm `.gitignore` excludes them before the first commit.

**Data API grants — new Supabase requirement, don't skip this.** Supabase is phasing in a requirement for explicit `GRANT` statements on new tables, separate from and in addition to RLS policies. Previously, tables were automatically exposed to the API by default; from 30 May 2026 for new projects (enforced on existing projects from 30 October 2026), a table with correct RLS policies but no explicit grant will still be inaccessible via the API. Since this Supabase project was created after that date, it likely already requires this.

**What this means in practice:** every table migration must include explicit `GRANT` statements (e.g. `GRANT SELECT ON public.compliance_records TO authenticated;`) alongside its RLS policies — treat "create table → enable RLS → write RLS policies → grant privileges to the relevant role" as one complete unit, not three separate steps done at different times. If a table seems to have correct RLS but the app still can't read/write it, the missing grant is the first thing to check, not a RLS policy bug.

---

## Infrastructure Notes (for later — not needed to build the demo)

- Domain registrar: FastHosts. Existing site DNS points to Netlify and must not be disturbed.
- A new subdomain will need a new DNS record at FastHosts once ready for public launch, pointing to wherever the Next.js frontend is hosted (e.g. Vercel).
- Supabase's custom domain add-on (Pro plan) will also be used so the platform's API/auth runs on the AlwaysReady domain rather than a Supabase-branded one — this is a separate DNS record from the frontend's.
- Free-tier Supabase projects pause after 7 days of inactivity (20–30 second cold start on next request) — a relevant risk for a public demo if traffic is infrequent; a lightweight keep-alive ping is a cheap mitigation if this becomes a problem.

---

## To Discuss — Parked Topics

- **Enterprise pricing** — care groups managing multiple locations could be a significant revenue opportunity. Need to discuss pricing model (per-location? per-seat? flat group rate?) and whether the platform needs any additional features to serve a group/HQ use case (e.g. cross-location reporting, centralised admin).

---

*This brief is the source of truth for this project's decisions and constraints. If something here seems to conflict with a new instruction from AJ, ask for clarification rather than silently choosing one over the other.*
