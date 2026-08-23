# AlwaysReady Platform — Security, Bug & Code Quality Audit
**Date:** 23 August 2026  
**Scope:** Full codebase review — security, bugs, code quality  
**Result:** TypeScript passes clean (zero errors). No hardcoded secrets. Several real issues found — two are critical/high and need fixing before any wider launch.

---

## Summary

| Severity | Count | Area |
|---|---|---|
| 🔴 Critical | 1 | Server actions with no auth at all |
| 🟠 High | 1 | Missing auth on a delete action |
| 🟡 Medium | 3 | Fail-open webhook, SVG upload, missing DB GRANTs |
| 🔵 Low | 2 | No rate limiting on public endpoints; stale code comment |

---

## Security Findings

---

### 🔴 CRITICAL — `campaigns/actions.ts`: All 8 server actions have zero auth

**File:** `app/superadmin/campaigns/actions.ts`

Every function in this file — `createCampaign`, `updateCampaignStatus`, `deleteCampaign`, `addContact`, `markContacted`, `deleteContact`, `addSuppression`, `deleteSuppression` — uses the admin (service-role) Supabase client with **no call to `assertSuperadmin()`**. 

This means any authenticated platform user (a trial user, a staff member, anyone with a valid session) can invoke these actions and read or mutate your campaigns, contacts, and suppression data. The service-role client bypasses Row-Level Security entirely, compounding the exposure.

The file has a comment: *"New tables not yet in generated DB types — use any cast until migration is applied."* The migration was applied months ago. The `as any` workaround was never removed, and the auth guard was apparently never added either.

**Fix (8 lines of change):** Add `await assertSuperadmin()` as the first line of every exported function. The import is already used in sibling files.

---

### 🟠 HIGH — `leads/actions.ts`: `deleteLead()` missing `assertSuperadmin()`

**File:** `app/superadmin/leads/actions.ts`

`deleteLead()` (line 9) deletes a waitlist lead without any auth check. Every other function in the same file — `addZeegBooking`, `sendBulkLaunchEmail` — does call `assertSuperadmin()`. This one was missed.

Any authenticated user who can guess or intercept a lead UUID could delete it.

**Fix (1 line):** Add `await assertSuperadmin()` at the top of `deleteLead()`.

---

### 🟡 MEDIUM — `inbound-zeeg/route.ts`: Fail-open auth check

**File:** `app/api/inbound-zeeg/route.ts`, line 31

```ts
if (ZEEG_WEBHOOK_TOKEN && token !== ZEEG_WEBHOOK_TOKEN) {
```

This logic fails open: if `ZEEG_WEBHOOK_TOKEN` is empty or not set in the environment, the `&&` short-circuits and any request passes. The webhook accepts arbitrary POST payloads and writes to your `zeeg_bookings` table.

**Fix (1 character):** Change to fail-closed:
```ts
if (!ZEEG_WEBHOOK_TOKEN || token !== ZEEG_WEBHOOK_TOKEN) {
```

---

### 🟡 MEDIUM — SVG uploads accepted for org logos

**File:** `app/api/org-logo/route.ts`, line 16

`image/svg+xml` is in `ALLOWED_TYPES`. SVG files can contain embedded `<script>` tags and JS event handlers. While the logo is currently rendered via an `<img>` tag (which suppresses script execution in most browsers), Supabase Storage serves files with the stored `Content-Type: image/svg+xml` — so if someone opens the raw storage URL directly, the JavaScript executes. An attacker with admin access to one org could use this to exfiltrate session data if the URL was opened by another admin.

**Fix:** Remove `'image/svg+xml'` from `ALLOWED_TYPES` and update the user-facing error to "PNG, JPG, or WebP". The logo is an `<img>` element so SVG offers no meaningful benefit.

---

### 🟡 MEDIUM — `marketing_campaigns` migration has no GRANT statements

**File:** `supabase/migrations/20260822000001_marketing_campaigns.sql`

The migration creates `marketing_campaigns`, `campaign_contacts`, and `marketing_suppressions` tables with no `GRANT` statements. Per the PROJECT_BRIEF: *"Every table migration must include explicit GRANT statements alongside RLS policies"* — a Supabase requirement since May 2026.

Currently this doesn't break anything because the campaigns code uses `createAdminClient()` (service role, bypasses GRANTs). But it's inconsistent, leaves the authenticated role with no defined permissions on these tables, and would break if the code is ever refactored to use the standard user client.

**Fix:** Add the missing GRANTs via SQL in the Supabase dashboard:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_contacts     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_suppressions TO authenticated;
```

---

## Low Priority

### 🔵 LOW — No rate limiting on public inbound endpoints

`/api/blog-subscribe`, `/api/inbound-waitlist`, and `/api/cqc-lookup` are fully public with no rate limiting. They could be flooded to fill your Resend quota, spam your waitlist table, or exhaust Supabase connections. The login endpoint does have rate limiting (in middleware). These don't.

This is lower risk while the platform is pre-launch with low traffic. Before go-live, consider adding Vercel's built-in rate limiting (available on Pro) or a lightweight in-memory guard similar to the login one.

### 🔵 LOW — Stale comment in `campaigns/actions.ts`

The file-level comment says *"New tables not yet in generated DB types — use any cast until migration is applied."* The migration has been applied. The comment is misleading and should be removed.

---

## What's Good

A lot of the platform is well-built. Things that explicitly checked out:

- **TypeScript** passes with zero errors across the entire codebase ✓
- **No hardcoded secrets** anywhere — all API keys and tokens read from `process.env` ✓
- **`getCurrentUserProfile()`** calls `supabase.auth.getUser()` server-side — org ID and role are never trusted from the client ✓
- **File upload MIME validation** uses magic-byte inspection (not just the browser-provided `Content-Type` header) — proper server-side defence ✓
- **Unsubscribe tokens** use HMAC-SHA256 (timing-safe comparison) ✓
- **All cron routes in `vercel.json`** have matching files — no dead references ✓
- **Stripe webhook** uses signature verification ✓
- **All dashboard queries scope to `organisation_id`** from the server-side session — no cross-org data leakage ✓
- **No `<a href>` tags inside the dashboard** — all internal links use `<Link>` (prevents beacon-triggered sign-outs) ✓
- **Newsletter AI limit** (10/month) is enforced server-side against the DB — not just client-side ✓
- **MFA enforced for admin users** ✓
- **Login rate limiting** in middleware ✓
- **`.env.local` covered by `.gitignore`** ✓

---

## Code Quality Notes (no action required unless you want to)

**47 `as any` casts** — mostly in the campaigns, governance, incidents, feedback, and post-inspection modules. These exist because the Supabase client isn't parameterised with the `Database` type from `lib/types.ts`, so `.from('new_table')` loses type inference. The types are correctly defined in `lib/types.ts`; the fix would be to pass `createClient<Database>()` so the client knows about all tables. This is a refactor, not a bug — TypeScript passes clean because of the explicit casts, and org-scoping is enforced by RLS regardless.

---

## Recommended Action Order

1. **Fix `campaigns/actions.ts`** — add `assertSuperadmin()` to all 8 functions. (30 mins)
2. **Fix `leads/actions.ts`** — add `assertSuperadmin()` to `deleteLead()`. (5 mins)
3. **Fix `inbound-zeeg/route.ts`** — flip the condition to fail-closed. (5 mins)
4. **Remove SVG from org logo uploads.** (5 mins)
5. **Apply missing GRANTs** for campaign tables in Supabase SQL Editor. (5 mins)
6. Rate limiting on public endpoints — defer until pre-launch.
