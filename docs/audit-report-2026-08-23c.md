# AlwaysReady Platform — Third Security Audit
**Date:** 2026-08-23  
**Scope:** Full platform deep-dive — security, bugs, code quality  
**Auditor:** Claude (Cowork)  
**Status:** Findings only — no automatic fixes applied

---

## Executive Summary

The third audit identified **8 findings** across three categories. The two most impactful are a data injection bug in the HR staff profile action and a second wave of HTML injection in emails that was missed by the previous audit's fix pass. Both are fixable with targeted, low-risk changes.

No new authentication or authorisation bypass vulnerabilities were found in the core session, middleware, or superadmin guard logic. `assertSuperadmin()`, `getCurrentUserProfile()`, and the middleware MFA enforcement all look correct.

---

## Findings

### 1. [HIGH — Security] `saveStaffProfile` — unsafe spread can override `organisation_id`

**File:** `app/dashboard/hr/actions.ts`, lines 38–43

```ts
.upsert({
  organisation_id: profile.organisation_id, // set server-side
  user_id: userId,
  updated_at: new Date().toISOString(),
  ...data,                                   // ← comes last; can override organisation_id
}, { onConflict: 'organisation_id,user_id' })
```

The `data` parameter is typed `Record<string, string | boolean | number | null>` and is spread **after** the server-controlled `organisation_id`. If a malicious admin sends `data: { organisation_id: 'victim-org-uuid' }` in the form payload, it overrides the server-set value. The upsert conflict check would then operate on the attacker-supplied org UUID, either inserting a row into another org or updating an existing one.

The only backstop is RLS on `hr_staff_profiles` via `createClient()`. If RLS is correct it blocks the write — but relying on RLS alone for a row-level ownership check that the application itself creates is a significant defence-in-depth gap.

The same `userId` parameter is also taken from the client without verification that it belongs to the caller's organisation. A malicious admin could target a user from a different org.

**Recommended fix:** Replace the `...data` spread with an explicit allowlist of the fields that this action is permitted to set:

```ts
const { job_title, employment_type, start_date, contract_hours, ... } = data
.upsert({
  organisation_id: profile.organisation_id,
  user_id:         userId,
  updated_at:      new Date().toISOString(),
  job_title,
  employment_type,
  // ... only the specific columns this action should touch
})
```

---

### 2. [MEDIUM — Security] HTML injection in emails — second wave

The previous audit fixed `inbound-contact`, `inbound-email`, and `inbound-demo`. Three additional routes were missed, and the trial signup action was not covered.

**Files and specific injection points:**

**`app/api/blog-subscribe/route.ts`**
- Line 129: `Hi ${displayName}` in subscriber welcome email. `displayName = name || 'there'`; `name` is taken directly from the request body with no escaping.
- Line 154: `${name}` in AJ notification HTML table. If a subscriber submits `name: "<script>alert(1)</script>"`, AJ's email client would render it as HTML.

**`app/api/inbound-optout/route.ts`**
- Lines 100–112: `${locationName}`, `${postcode ?? 'Not provided'}`, `${email ?? 'Not provided'}` in AJ notification email. All three are user-supplied values interpolated directly into HTML. Rate limiting was added in the previous pass but HTML escaping was not.

**`app/api/inbound-zeeg/route.ts`**
- Lines 100–116: `${name ?? '—'}` and `${email}` in AJ notification. The webhook is token-authenticated, so exploitability requires knowledge of `ZEEG_WEBHOOK_TOKEN`, making this lower risk — but if the token is ever rotated or leaked, the attack surface is open.

**`app/trial/actions.ts`**
- Lines 219–228 (AJ notification): `${serviceName.trim()}`, `${managerName.trim()}`, `${managerEmail.trim()}`, `${serviceType}`, `${cqcLocationId.trim()}`, `${charityNumber}` — all user-supplied, none escaped.
- Lines 240–242 (user welcome email): `${firstName}` (derived from `managerName`) and `${serviceName.trim()}` — unescaped in the email sent to the new user.

**Recommended fix:** Add the `escapeHtml()` helper (already used in the previously patched files) to each of these files and apply it to all user-supplied values before interpolation into `bodyHtml`.

---

### 3. [MEDIUM — Security] Mock inspection actions — no app-layer org ownership check

**File:** `app/dashboard/mock-inspections/actions.ts`

`saveMockFinding(mockInspectionId, ...)`, `saveMockChecklistResponse(mockInspectionId, ...)`, and `completeMockInspection(mockInspectionId)` all accept a `mockInspectionId` from the client and verify only that the user is authenticated — they do not check that the given inspection belongs to the caller's organisation.

`startMockInspection` correctly writes `organisation_id: profile.organisation_id` into the new record, and all three subsequent actions use `createClient()` which applies RLS. Whether RLS on `mock_inspections`, `mock_inspection_findings`, and `mock_inspection_checklist_responses` enforces org scoping is the critical question.

Of the three, `completeMockInspection` is the most exposed:

```ts
await supabase
  .from('mock_inspections')
  .update({ status: 'completed', completed_at: new Date().toISOString() })
  .eq('id', mockInspectionId)   // ← no .eq('organisation_id', profile.organisation_id)
```

If RLS on `mock_inspections` does not enforce `organisation_id` on UPDATE, an authenticated user from org A who learns org B's mock inspection UUID could mark it as complete.

**Recommended fix:**
1. Add `.eq('organisation_id', profile.organisation_id)` to the update in `completeMockInspection`.
2. For `saveMockFinding` and `saveMockChecklistResponse`, pre-fetch the inspection and verify its `organisation_id` matches the caller's before writing findings, or confirm this is fully enforced by RLS.

---

### 4. [LOW — Security] `upload-i-statement-evidence` — `iStatementId` not verified against org

**File:** `app/api/upload-i-statement-evidence/route.ts`, line 135

```ts
const storagePath = `${profile.organisation_id}/i-statements/${iStatementId}/${Date.now()}-${safeName}`
```

The storage path always uses `profile.organisation_id` (server-controlled), so there is no cross-org storage leak — files always land in the authenticated org's folder. However, `iStatementId` is user-supplied and is never verified to belong to the caller's org. A user from org A could upload files referencing org B's statement UUIDs, creating inconsistent path metadata (though they cannot read org B's existing files).

**Recommended fix:** Before uploading, verify that the `iStatementId` belongs to the caller's `organisation_id` via a `i_statement_evidence` table lookup, or confirm this is enforced downstream when the client calls `saveIStatementEvidenceFile` to persist the metadata.

---

### 5. [MEDIUM — Code Quality] Debug `console.log` calls in production code

**File:** `app/api/blog-subscribe/route.ts`, lines 70–73

```ts
console.log('[blog-subscribe] TURNSTILE_SECRET_KEY present:', !!secretKey)
console.log('[blog-subscribe] token present:', !!token, token ? `(${token.slice(0, 10)}...)` : '')
```

These are verbose debug logs that were clearly added during development of the Turnstile integration and were never cleaned up. In production they emit on every blog subscriber request, generating noise in Vercel logs and potentially leaking information about whether Turnstile is configured.

**Recommended fix:** Remove both `console.log` lines. The `console.warn` on soft-pass (line 76) is legitimate and should be kept.

---

### 6. [MEDIUM — Code Quality] `trial/actions.ts` — partial rollback on compliance seed failure

**File:** `app/trial/actions.ts`, lines 188–195

```ts
// ── 7. Seed compliance_records ───────────────────────────────────────────────
const { data: klos } = await supabase.from('klo_items').select('id')
if (klos && klos.length > 0) {
  const { error: crError } = await supabase.from('compliance_records').insert(
    klos.map(klo => ({ organisation_id: org.id, klo_item_id: klo.id }))
  )
  if (crError) console.error('[trial-signup] compliance_records seed error:', crError.message)
}
```

If the compliance records seed fails (e.g. a database constraint or timeout), the function silently logs the error and continues. The org and user are fully created but have no compliance records seeded — the user sees a success response but their dashboard will show an empty KLOE tracker with no data to act on.

The same issue exists if `klos` comes back empty (edge case if `klo_items` has no rows). In that case no error is raised, but the account is equally broken.

**Recommended fix:** Treat a seed failure as a signup failure and include a rollback. Alternatively, add a startup check in the dashboard that detects an empty compliance record set and triggers a re-seed.

---

### 7. [LOW — Code Quality] HR actions — `userId` parameter not validated as same-org

**File:** `app/dashboard/hr/actions.ts`

`saveStaffProfile`, `saveTrainingRecord`, `saveHolidayAllowance`, and `uploadTrainingCertificate` all accept a `userId` argument from the client. None verify that this `userId` belongs to the caller's organisation.

For `saveTrainingRecord` and `saveHolidayAllowance`, the upsert explicitly sets `organisation_id: profile.organisation_id`, so cross-org data corruption is not possible — the worst outcome is an admin writing a training record for a foreign user_id that lands in their own org (creating an orphan row). RLS at the DB layer is the effective guard.

The issue is more acute in finding #1 (`saveStaffProfile`'s spread). This finding covers the remaining functions as a lower-priority defence-in-depth gap.

**Recommended fix:** At the top of each HR action that accepts `userId`, add a check that the referenced user belongs to the admin's org:

```ts
const { count } = await supabase
  .from('users')
  .select('id', { count: 'exact', head: true })
  .eq('id', userId)
  .eq('organisation_id', profile.organisation_id)
if (!count) return { success: false, error: 'User not found.' }
```

---

### 8. [LOW — Code Quality] `mock-inspections/actions.ts` — missing explicit org filter on `completeMockInspection`

**File:** `app/dashboard/mock-inspections/actions.ts`, lines 113–118

As noted in finding #3, the update query has no `.eq('organisation_id', ...)` filter. This is already covered there as a security concern. Even if RLS provides full protection, adding the explicit filter is defensive good practice and makes the code's intent unambiguous.

---

## Files Confirmed Clean

The following files were read in full and had no significant issues:

- `lib/assert-superadmin.ts` — correct; uses `SUPERADMIN_EMAIL` env var, fails closed
- `lib/session.ts` — correct; expired viewer sessions are explicitly blocked at app layer
- `app/login/actions.ts` — correct; always returns success to prevent email enumeration
- `app/dashboard/welcome/actions.ts` — correct; updates only the authenticated user's own row
- `app/dashboard/account/actions.ts` — correct; `changePassword` re-authenticates before update; admin client used safely
- `app/dashboard/kloes/actions.ts` — correct; role and org checks on all paths; non-admin priority/frequency locked server-side
- `app/dashboard/peoples-voice/actions.ts` — correct; org-scoped writes throughout; viewer role blocked consistently
- `app/api/upload-i-statement-evidence/route.ts` — upload pipeline is solid (auth, magic-byte MIME check, virus scan, size limit); only the iStatementId ownership check is missing (finding #4)
- `app/api/export-evidence/route.ts` — admin-only, org-scoped, uses admin client correctly
- `app/api/report-snapshot/route.ts` — admin-only, org-scoped via `profile.organisation_id`
- `app/api/org-logo/route.ts` — admin-only, org-scoped, SVG already excluded, size and MIME type checked
- `app/trial/actions.ts` — signup flow logic is sound (CQC validation, service type allowlist, Turnstile, rollback on auth failure); finding #2 (HTML injection) and #6 (seed rollback) are the only issues

---

## Summary Table

| # | Severity | File | Finding |
|---|----------|------|---------|
| 1 | HIGH | `hr/actions.ts` | `...data` spread overrides `organisation_id` in `saveStaffProfile` |
| 2 | MEDIUM | `blog-subscribe`, `inbound-optout`, `inbound-zeeg`, `trial/actions.ts` | HTML injection in emails — second wave |
| 3 | MEDIUM | `mock-inspections/actions.ts` | No app-layer org ownership check on inspection ID |
| 4 | LOW | `upload-i-statement-evidence/route.ts` | `iStatementId` not verified against caller's org |
| 5 | MEDIUM | `blog-subscribe/route.ts` | Debug `console.log` in production |
| 6 | MEDIUM | `trial/actions.ts` | Silent failure and no rollback if compliance seed fails |
| 7 | LOW | `hr/actions.ts` | `userId` param not validated as same-org across HR actions |
| 8 | LOW | `mock-inspections/actions.ts` | Missing explicit org filter on `completeMockInspection` update |
