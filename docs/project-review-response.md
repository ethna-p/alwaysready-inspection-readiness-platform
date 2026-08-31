# Project Review Response — GitHub Issue #7

**Date:** 31 August 2026  
**Reviewer:** External technical friend  
**Status:** In progress

---

## Overview

A friend conducted a structured review of the AlwaysReady platform codebase and raised GitHub Issue #7 with seven findings covering maintainability, security, and operational resilience. This document records each finding, the response, and current completion status.

---

## Finding #1 — Integration Test Coverage

**Concern:** No integration tests exist to verify cross-tenant data isolation, role-based access, or Stripe webhook behaviour. A regression could expose one care provider's data to another without any automated safety net.

**Specific gaps identified:**
- Migration testing on a clean database (verify each migration runs without error on a blank Supabase instance)
- Cross-org data leak tests (confirm RLS policies prevent one organisation reading another's rows)
- Role permission boundary tests (verify admin/user/viewer restrictions are enforced)
- Stripe webhook integration tests (confirm `checkout.session.completed` correctly provisions an org and that replays are idempotent)
- Onboarding flow end-to-end test (verify a new org lands in the correct provisioned state)

**Response:** The platform uses Supabase Row-Level Security as the authoritative enforcement layer for tenant isolation — every table scoped to `organisation_id` has RLS policies that enforce ownership at the database level, independent of application code. This is a strong architectural baseline. The concern is valid, however: we have no automated tests to continuously verify these policies haven't been inadvertently weakened by a migration. This is on the roadmap.

**Status:** ⏳ Not started. Planned.

---

## Finding #2 — Database Backup and Recovery ✅ COMPLETE

**Concern:** No documented backup strategy or recovery procedure. If the Supabase project were corrupted or accidentally deleted, the recovery path is unclear.

**Specific gaps identified:**
- Supabase PITR (Point-in-Time Recovery) status unknown
- No documented recovery procedure
- No tested restore from backup

**Changes made:**

Created `docs/backup-and-recovery.md` covering:
- What backups exist (daily snapshots + PITR on Supabase Pro)
- A verification checklist to confirm PITR is enabled
- Step-by-step recovery procedures for three scenarios: single row loss, table/bulk loss, and accidental project deletion
- Recovery time objectives (RTO) for each scenario
- An annual test restore procedure with a log table to record results
- Contact and dashboard links

**Context:** The platform has no paying customers yet, so the Free plan is acceptable for now. The runbook includes a launch day checklist (§8) that covers upgrading to Pro, enabling PITR, and completing the first test restore before the first customer signs up.

**Actions required at launch:**
- Upgrade `alwaysready-demo` Supabase project to Pro plan
- Enable PITR under Project Settings → Backups
- Complete first test restore and fill in the log in `docs/backup-and-recovery.md`

**Committed:** see `docs/backup-and-recovery.md`

---

## Finding #3 — Unit and Regression Test Coverage

**Concern:** No unit tests for business logic functions that could silently break without detection.

**Specific gaps identified:**
- RAG (Red/Amber/Green) rating calculation logic
- Date logic (viewer expiry, trial expiry, overdue action items)
- Permission helpers (role checks, superadmin guard)

**Response:** The RAG calculations and date logic are the highest-risk candidates — a silent regression there could cause incorrect compliance ratings to be shown to inspectors. Unit tests for these would be low-cost and high-value.

**Status:** ⏳ Not started. Planned.

---

## Finding #4 — Automated Pull-Request Checks

**Concern:** No CI pipeline. Merges to `main` are not gated by any automated check — type errors, lint failures, or broken builds could be shipped.

**Specific gaps identified:**
- No GitHub Actions workflow
- No `tsc --noEmit` on push
- No ESLint on push
- No build verification before merge

**Response:** This is straightforward to add and relatively high-value given the codebase is TypeScript throughout. A GitHub Actions workflow running `tsc --noEmit` and `next build` on every push to `main` and on every pull request would catch the class of error we've manually caught with `tsc` in this session.

**Status:** ⏳ Not started. Planned.

---

## Finding #4 — Automated Pull-Request Checks ✅ COMPLETE

**Concern:** No CI pipeline. Merges to `main` are not gated by any automated check — type errors, lint failures, or broken builds could be shipped.

**Specific gaps identified:**
- No GitHub Actions workflow
- No `tsc --noEmit` on push
- No ESLint on push
- No build verification before merge

**Changes made:**

Created `.github/workflows/ci.yml` with two jobs:

1. **TypeScript & Lint** — runs `npx tsc --noEmit` then `npm run lint`. No secrets required. Runs on every push to `main` and every pull request targeting `main`.
2. **Next.js Build** — runs `npm run build` with placeholder env vars. Only runs if the first job passes. Placeholder values are sufficient because Next.js App Router server actions do not execute at build time.

Sentry source map uploads will warn (not fail) in CI without a real `SENTRY_AUTH_TOKEN` — this is acceptable; the build check itself succeeds.

To upgrade the build job to use real credentials in future, add the values from `.env.example` as GitHub repository Secrets and reference them with `${{ secrets.SECRET_NAME }}` in the workflow.

**Committed:** `3f96349 — Add GitHub Actions CI workflow (tsc, lint, next build)`

---

## Finding #5 — Centralized Authorization Safeguards ✅ COMPLETE

**Concern:** Authorization checks were duplicated inline across every server action file, using inconsistent patterns (some used `supabase.auth.getUser()` directly, some called `getCurrentUserProfile()`, one file had its own local `requireAdmin()` function). Any file that missed the check would silently be unprotected.

**Specific gaps identified:**
- `hr/actions.ts` had its own local `requireAdmin()` — a duplicate of logic elsewhere
- `account/actions.ts` used raw `supabase.auth.getUser()` without fetching the profile
- `mock-inspections/actions.ts` repeated a full auth + profile fetch + role check block in every action
- `peoples-voice/actions.ts` same pattern, four times
- `support/new/actions.ts` used raw auth then a separate profile fetch

**Changes made:**

### New file: `lib/auth.ts`

Created a shared module with three exported helpers:

- **`requireUser()`** — calls `getCurrentUserProfile()` (which handles expired viewers), asserts `organisation_id` is set, and returns a typed `AuthedProfile`. Returns `null` on any failure.
- **`requireAdmin()`** — calls `requireUser()` then additionally asserts `role === 'admin'`. Returns `null` for non-admins.
- **`requireRole(allowedRoles)`** — calls `requireUser()` then checks the user's role is in the provided list.

All three return `null` on failure — callers decide how to respond (early return with an error object, redirect, etc.). This keeps the helpers composable and avoids hidden redirects in action code.

A generic `requireOrgResource()` helper was intentionally **not** added: ownership checks are table-specific and require the typed Supabase client. A generic version would need a `(supabase as any)` cast, which violates the project rule.

### Updated files

| File | Before | After |
|---|---|---|
| `app/dashboard/kloes/actions.ts` | Raw `getCurrentUserProfile()` + manual role check in each action | `requireRole(['admin', 'user'])` / `requireAdmin()` |
| `app/dashboard/account/actions.ts` | `supabase.auth.getUser()` + manual profile fetch | `requireAdmin()` / `requireUser()` |
| `app/dashboard/hr/actions.ts` | Local `requireAdmin()` function defined in file | Removed local function; imports shared `requireAdmin()` from `lib/auth` |
| `app/dashboard/mock-inspections/actions.ts` | Full auth + profile + role block repeated in 4 actions | `requireAdmin()` / `requireUser()` |
| `app/dashboard/peoples-voice/actions.ts` | Full auth + profile + role block repeated in 4 actions | `requireAdmin()` / `requireRole(['admin', 'user'])` |
| `app/dashboard/support/new/actions.ts` | `supabase.auth.getUser()` + separate profile fetch | `requireUser()` |

**Not changed:** `app/dashboard/welcome/actions.ts` — uses `requireUserProfile()` from `lib/session.ts`, which redirects to `/login` on failure. This is the correct pattern for that action (it's a page-load action that should redirect, not return an error object).

**Not changed:** All superadmin actions — these use `assertSuperadmin()` from `lib/assert-superadmin.ts`, which throws if the caller isn't the superadmin. That remains the correct pattern for that tier.

**TypeScript check:** `npx tsc --noEmit` passes with zero errors after all changes.

**Committed:** `4b41451 — Add shared auth helpers (lib/auth.ts) and update all dashboard server actions`

---

## Finding #6 — Shared Cross-Cutting and Domain Utilities

**Concern:** Some utility logic (date formatting, string helpers, domain calculations) is duplicated across components rather than extracted to a shared `lib/utils/` module.

**Response:** Incremental — extract duplication as we encounter it during normal feature work rather than a big-bang refactor.

**Status:** ⏳ Not started. Incremental / ongoing.

---

## Finding #7 — Large Files and Component Boundaries

**Concern:** Some files have grown large enough that they're difficult to navigate and review. Splitting them into smaller, single-responsibility files would improve maintainability.

**Response:** Agreed in principle. Specific files to target identified as: large server action files with many unrelated actions, and page components that mix data fetching with rendering.

**Status:** ⏳ Not started. Incremental / ongoing.

---

## Summary Table

| # | Finding | Priority | Status |
|---|---|---|---|
| 5 | Centralised authorization safeguards | High | ✅ Complete (commit `4b41451`) |
| 4 | Automated PR checks (GitHub Actions CI) | High | ✅ Complete (commit `3f96349`) |
| 2 | Database backup and recovery documentation | High | ✅ Complete — verify PITR + first test restore outstanding |
| 1 | Integration test coverage | Medium | ⏳ Planned |
| 3 | Unit and regression test coverage | Medium | ⏳ Planned |
| 6 | Shared cross-cutting utilities | Low | ⏳ Incremental |
| 7 | Large file / component boundary refactoring | Low | ⏳ Incremental |

---

## Other in-flight work (unrelated to Issue #7)

For completeness, other open issues at the time of this review:

- **#229** — Purchase Simply Docs Business subscription; download T&Cs + DPA templates
- **#230** — Solicitor review of T&Cs and DPA
- **#231** — Create `/terms` and `/dpa` pages on the platform
- **#302** — DSCR integration
- **#544** — Q4 CSS classes for marketing site (in progress)
- **#549** — Fix 5 marketing site audit items (in progress)
- **#609** — Rebuild onboarding sequence (in progress)
