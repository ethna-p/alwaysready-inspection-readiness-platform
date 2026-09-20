# Handoff: Preview/Production Supabase Split (2026-09-12)

For Claude Cowork (and anyone else picking up work on this repo). Read this before touching `supabase/migrations/`, Vercel environment variables, or anything CI/preview-related.

## What changed

Until today, every Vercel **preview deployment** (any branch push, any PR) shared the exact same Supabase project as **production** — same URL, same `service_role` key. A half-finished branch, or anyone with a preview link, could read and write real customer data. There was no isolation between "testing something" and "touching live data."

That's fixed. There is now a second, separate Supabase project:

- **Name:** `alwaysready-preview`
- **Region:** Ireland (`eu-west-1`) — deliberately different from production (`alwaysready-production`, Frankfurt/`eu-central-1`), chosen for no reason other than proximity; region has no bearing on which project is which
- **Purpose:** preview builds only. It holds no real customer data — it's schema-only, seeded with test/fake data as needed.

Its schema was brought up to date by running every file in `supabase/migrations/` against it directly (121 migrations at the time, applied in filename order). Verified afterward to match production exactly: same table count, RLS enabled on every table, same function and policy counts.

**Naming note worth remembering:** the production project is now called `alwaysready-production` in the Supabase dashboard. It was previously named `alwaysready-demo` (renamed in the dashboard by AJ), so older notes, emails and commits may still use that name; it is the same project. The preview project is `alwaysready-preview`. If in doubt about which is which, confirm by region (Frankfurt = production) and by the PRODUCTION label shown next to the branch name in the dashboard.

## Vercel environment variables

`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are now each **two separate entries** in Vercel, not one shared value:

| Variable | Environment | Points to |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production | `alwaysready-production` (real production) |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview | `alwaysready-preview` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | `alwaysready-production`'s service_role key |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview | `alwaysready-preview`'s service_role key |

Both are `Type: Config` for the URL and `Type: Secret` for the service_role key, matching Vercel's own guidance (`NEXT_PUBLIC_`-prefixed values are exposed to the browser regardless, so marking them Secret is misleading and Vercel won't even let you save that combination once it's already stored as Secret — had to delete and recreate rather than edit in place. Worth knowing before you hit the same dead end.)

`NEXT_PUBLIC_SUPABASE_ANON_KEY` was **not** split — it's the same in both projects' sense of "safe to expose," but note it still points at whichever project's URL is active for that environment, so it's implicitly project-specific even though the value itself wasn't touched. (Left as-is for now; flag if this becomes a problem.)

## The one rule that matters going forward

**Whenever a new file is added to `supabase/migrations/`, it needs to be applied to `alwaysready-preview` too, not just production.**

Cowork doesn't have credentials for the preview project (it's a cloud agent; the connection details live only in the user's local `.env.local`), so Cowork's job here is to **flag it, not apply it**: when you add a migration, say so explicitly in your summary/PR description, and remind the user that it still needs to be run against `alwaysready-preview` locally. If migrations silently drift between the two projects, preview builds will eventually fail in ways that don't reproduce in production (or vice versa) — exactly the kind of bug Chunk 7 (Schema & Infra Drift) in [Issue #23](https://github.com/ethna-p/alwaysready-inspection-readiness-platform/issues/23) exists to catch, so a monthly audit pass should periodically re-verify the two stay in sync rather than assuming tonight's parity holds forever.

## Where the credentials live (local only, not in this repo)

`.env.local` (git-ignored, never committed) has three local-only variables added for this work, used only for running migration/verification scripts against the preview project — the app itself never reads them:

- `SUPABASE_PREVIEW_URL`
- `SUPABASE_PREVIEW_SERVICE_ROLE_KEY`
- `SUPABASE_PREVIEW_DB_URL` (direct Postgres connection via the Session Pooler — needed for running migrations, since the service_role key alone only allows REST API calls, not schema changes)

None of these are secrets Cowork needs day-to-day — they're for whoever next needs to apply a migration to preview manually.
