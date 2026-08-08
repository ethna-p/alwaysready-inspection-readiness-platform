# Governance Cycle Gap Analysis — Tonight's Work
**Date:** 6 August 2026  
**Status:** All 6 gaps addressed and deployed to production ✅

---

## What we built

We identified and closed six gaps in the governance cycle — areas where the platform didn't fully support CQC's expectation of continuous assessment and continuous improvement.

---

## Gap 1 — Incident / Concern Logging

**Route:** `/dashboard/feedback` *(see also Gap 6 below — incidents are separate)*
**Route:** `/dashboard/incidents`

### What was built
- **`supabase/migrations/20260806000002_incidents.sql`** — `incidents` table with type (`safety`, `safeguarding`, `near_miss`, `complaint`, `other`), status (`open`, `under_review`, `closed`), external reporting flag, learning outcome field, and RLS.
- **`app/dashboard/incidents/incident-actions.ts`** — `createIncident`, `updateIncidentStatus`, `updateIncident`, `deleteIncident` server actions.
- **`app/dashboard/incidents/IncidentsClient.tsx`** — colour-coded cards by incident type, filter by status and type, log/close/edit/delete flows, summary pills.
- **`app/dashboard/incidents/page.tsx`** — server component fetching org incidents.
- Nav link added to `SiteHeader` and `MobileNav` (all roles).

### Things to check
- Log a new incident as a `user` role — verify it appears in the list.
- Try to close it as a `user` — should be blocked (admin only).
- Close it as admin — learning outcome should be required.
- Verify a `viewer` role sees the list but has no "Log incident" button.
- Check the colour strip on cards (safety = red, safeguarding = purple, near miss = amber, complaint = orange, other = grey).

---

## Gap 2 — Action Items Not Connected to Mock Inspection Findings

### What was built
- **`app/dashboard/mock-inspections/[id]/report/CreateActionFromFinding.tsx`** — inline "+ Create action item" button on every Must Address and Strengthen card in the mock inspection report. Pre-fills title and description from the finding. Includes priority (defaults to High) and assigned_to select from team members.
- **`app/dashboard/mock-inspections/[id]/report/page.tsx`** — updated to pass `kloItemId`, `kloTitle`, `suggestedAction`, and `teamMembers` to the new component. Each finding card now surfaces the create-action button.

### Things to check
- Open a completed mock inspection → View Report.
- On any Must Address or Strengthen finding, click "+ Create action item".
- Verify the form pre-fills correctly.
- After saving, navigate to KLOEs → the relevant KLOE's action plan should show the new item.
- Confirm the button is `print:hidden` (doesn't appear when printing the report).

---

## Gap 3 — No Scheduled Review Prompts (Governance Digest)

### What was built
- **`app/api/cron/governance-digest/route.ts`** — weekly cron (Monday 08:30) that emails each org's admins a digest covering: overall readiness %, overdue KLOEs with no assigned owner, KLOEs never started, open incidents, and overdue action items.
- **`supabase/migrations/20260806000003_notification_log_governance.sql`** — extends the `notification_log` table's CHECK constraints to include `weekly_digest` type and `governance_digest` entity type, preventing duplicate sends.
- **`vercel.json`** — cron job registered at `30 8 * * 1` (Monday 08:30 UTC).
- **`app/dashboard/page.tsx`** — governance alert panel added for admins showing live counts of: overdue unassigned KLOEs, KLOEs never started, open incidents, and overdue action items, each with a direct "review now" link.

### Things to check
- Log in as admin and check the main dashboard — the amber alert panel should appear if any governance issues exist.
- Verify the panel is absent for `user` and `viewer` roles.
- To test the cron manually, `GET /api/cron/governance-digest` with header `Authorization: Bearer <CRON_SECRET>` (check Vercel env vars for the value).
- Check `notification_log` in Supabase after the cron runs to confirm the idempotency row was inserted.

---

## Gap 4 — People's Voice Has No History / Trend

### What was built
- **`supabase/migrations/20260806000004_i_statement_evidence_history.sql`** — `i_statement_evidence_history` table that captures a snapshot every time a People's Voice "I" statement evidence record is created or updated (SECURITY DEFINER trigger, append-only, SELECT-only grant to app).
- **`app/dashboard/peoples-voice/page.tsx`** — fetches the full history for each statement, builds a map keyed by statement ID, and passes history to the client.
- **`app/dashboard/peoples-voice/PeoplesVoiceClient.tsx`** — "Show history (N updates)" toggle on each statement card, expanding to a chronological list of past confidence levels, evidence summaries, dates, and recorder names.

### Things to check
- Open People's Voice and update an "I" statement's confidence / evidence.
- Refresh the page — click "Show history" on that statement. The new entry should appear.
- Update it again — history should grow, newest first.
- Verify recorder names display correctly (not UUIDs).
- Check that `viewer` role can see the history toggle (read-only) but cannot edit.

---

## Gap 5 — No Governance Meeting Record

**Route:** `/dashboard/governance`

### What was built
- **`supabase/migrations/20260806000005_governance_meetings.sql`** — `governance_meetings` table with title, date, attendees, agenda, key decisions, actions arising, status (`draft` / `signed_off`), and sign-off metadata.
- **`app/dashboard/governance/governance-actions.ts`** — `createMeeting`, `updateMeeting`, `signOffMeeting`, `deleteMeeting` server actions.
- **`app/dashboard/governance/GovernanceClient.tsx`** — collapsible meeting cards, draft/signed-off badges, edit and sign-off flows, delete confirmation. Once signed off, a meeting is locked from editing.
- **`app/dashboard/governance/page.tsx`** — guidance banner explaining what to record and why CQC asks for it.
- Nav link added to `SiteHeader` and `MobileNav` (admin only).

### Things to check
- Record a governance meeting as admin — verify it saves and appears in the list.
- Try editing it as a `user` who created it — should be allowed (draft only).
- Sign it off as admin — confirm the record locks (no edit button after sign-off).
- Verify `viewer` role sees the list but has no "Record meeting" button.
- Check the signed-off banner shows the correct name and date.

---

## Gap 6 — No Complaints and Compliments Log

**Route:** `/dashboard/feedback`

### What was built
- **`supabase/migrations/20260806000006_feedback_records.sql`** — `feedback_records` table with type (`complaint`, `compliment`, `suggestion`, `concern`), source (`person_using_service`, `family_or_carer`, `professional`, `anonymous`, `other`), status (`open`, `actioned`, `closed`), action taken, outcome, optional CQC key question tag, and `reported_to_cqc` flag.
- **`app/dashboard/feedback/feedback-actions.ts`** — `createFeedback`, `updateFeedback`, `deleteFeedback` server actions. Non-admin staff can edit their own open records; admins can update status and delete.
- **`app/dashboard/feedback/FeedbackClient.tsx`** — colour-coded cards (red = complaint, green = compliment, blue = suggestion, amber = concern), dual filter (type + status), summary pills, inline log/edit forms, CQC key question tagging.
- **`app/dashboard/feedback/page.tsx`** — guidance banner linking the log explicitly to the Caring and Responsive key questions.
- Nav link added to `SiteHeader` and `MobileNav` (all roles).

### Things to check
- Log a compliment as a `user` — verify green card appears.
- Log a complaint as a `user` — verify red card, status shows "Open".
- As admin, edit the complaint, set status to "Actioned" — verify badge updates.
- Try editing a closed record as a non-admin — should be blocked.
- Try adding an anonymous source — source detail field should hide.
- Tag a record to the "Responsive" key question — verify the purple badge appears on the card.
- Check `viewer` role sees records but has no "Log feedback" button.

---

## TypeScript / Vercel Build Notes

All new tables use the `(supabase as any)` cast pattern and `(r: any)` on map callbacks. This is intentional — the Supabase generated types file doesn't know about tables added via SQL migration at runtime. Vercel's strict TypeScript build would otherwise fail. This pattern is consistent across all new modules and is safe to leave as-is until a full `supabase gen types` refresh is done pre-launch.

---

## Navigation Summary

| Link | Roles | Added tonight? |
|---|---|---|
| Incidents | All | ✅ |
| Feedback | All | ✅ |
| Governance | Admin only | ✅ |
| Mock Inspection | Admin only | Existed |
| Reports | Admin only | Existed |

---

Good luck with the checks. 🎉
