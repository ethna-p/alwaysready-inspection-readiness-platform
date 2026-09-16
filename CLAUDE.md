# AlwaysReady Inspection Readiness Platform

**Read [PROJECT_BRIEF.md](PROJECT_BRIEF.md) before starting any non-trivial work** — it's the full standing reference (live URLs, what's built, domain rules, design system, footer/legal copy). This file exists so the rules below are loaded automatically at the start of every session, even one that hasn't opened the brief yet; it is not a replacement for it.

## Hard rules

- **`npm run dev` is a blocking process that never exits.** Never chain it with `&&` after other commands. Always run it alone, standalone, in its own terminal step.
- **Every terminal command must start with `cd ~/Sites/[repo-name]`** — AJ works from one terminal window across multiple repos; never assume the working directory.
- **Finish the work in the session.** Never suggest deferring a task to "a later session" — there is no later session.
- **This platform is built on CQC's Adult Social Care sector-differentiated framework (draft) — NOT the Single Assessment Framework (SAF).** The SAF is CQC's cross-sector framework for NHS and other providers. Every piece of content must reference only the Adult Social Care framework.
- **Run migrations immediately after committing them — on BOTH the preview and production Supabase projects.** The deploy workflow applies app code only — Vercel does not run schema changes, and there is no CLI-tracked migration table, so a migration run on only one project is invisible drift until something breaks or a security fix silently doesn't apply everywhere. `.env.local` has direct Postgres connection strings for both (`SUPABASE_PREVIEW_DB_URL`, `SUPABASE_PRODUCTION_DB_URL` — both session-pooler URLs, since this environment can't reach Supabase's direct/IPv6-only host) — run the migration file against both directly (e.g. via `pg`) rather than asking AJ to paste SQL into the Supabase SQL Editor. Order: write migration → run on preview → run on production → verify it applied on both → commit → push to GitHub. Never let migration files accumulate unrun, and never consider a migration "done" after running it on just one project. If `SUPABASE_PRODUCTION_DB_URL` is ever missing (a fresh environment, a rotated password), fall back to asking AJ to run it in the SQL Editor instead of guessing or skipping production.
- **`lib/types.ts` is hand-maintained, not auto-generated.** Any migration that adds, removes, or renames a column needs a matching update to that table's `Row`/`Insert`/`Update` blocks in `lib/types.ts`, in the same commit as the migration. Run `npx tsc --noEmit` afterward to confirm.
- **Writing marketing copy or content about a platform feature?** Read `docs/FEATURE_MAP.md` first, then the relevant code folder. The codebase is the ground truth — not handoff docs, not memory, not assumptions.
- **Asked about a third-party dashboard setting (Supabase, Stripe, Vercel, Cloudflare, Resend, etc.) and don't know its exact current location?** Say so immediately and search for it — never guess a navigation path.

## Debugging schedule

This repo has a living audit schedule tracked in [Issue #23](https://github.com/ethna-p/alwaysready-inspection-readiness-platform/issues/23) — a 7-chunk checklist (auth/session, data flow, uploads, cron, RLS, security, schema drift) plus a standing recommendation to periodically run an open-ended `/code-review` alongside it, since the chunks only catch patterns already seen once before. Read that issue before a scheduled audit pass, and amend it (new chunk, new check, dated update note) whenever a pass finds a category of bug the existing chunks didn't cover.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
