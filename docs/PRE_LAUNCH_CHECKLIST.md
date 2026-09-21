# AlwaysReady Platform: Pre-Launch Checklist and Launch Criteria

Things to action, and the pass/fail bar to meet, before onboarding paying customers.
Last reviewed: 2026-09-21. Update the Status column as each gate is met, and put the evidence (a link, a date, a test run) next to it.

---

## 1. Launch criteria (pass/fail)

Nothing is bug-free. The bar is: no blockers, and a small, known, low-impact remainder.

**What the bug levels mean for this product**

| Level | Meaning | Examples |
|---|---|---|
| P0 | Blocks launch | Wrong compliance status shown; a record lost or silently changed; one organisation able to see another's data; a payment taken without access (or the reverse); sign-up, login or reset broken; site down; data cannot be recovered |
| P1 | Core workflow broken, no workaround | A KLOE cannot be rated; evidence cannot be uploaded; an invite cannot be accepted; an export fails |
| P2 | Major, but a workaround exists | A report filter misbehaves; an email arrives late |
| P3 / P4 | Cosmetic or minor | Alignment or wording on an uncommon screen size |

**Criteria**

| # | Criterion | Pass when | Status |
|---|---|---|---|
| L1 | Open P0 bugs | 0 | Met (none known 2026-09-21) |
| L2 | Open P1 bugs | 0 | Met (none known 2026-09-21) |
| L3 | Open P2 bugs | 5 or fewer, each with a written workaround | Not yet assessed |
| L4 | Automated tests | CI green; full Playwright suite green against a production build, including `subscribe.spec` with the Stripe listener running | In progress |
| L5 | Backups | Supabase Pro with point-in-time recovery, and one backup restored into a scratch project and checked | Not started (AJ, just before launch) |
| L6 | Payments | Test-mode checkout, cancellation and webhook pass; one small live-mode payment made and refunded | Test mode passing; live rehearsal not done |
| L7 | Alerts | Site-down and stopped-scheduled-job alerts each proven to fire once by a deliberate test | Done 2026-09-21 (partly proven). UptimeRobot checks `/api/health` every 5 minutes with email alerts. A deliberately stale `demo-reminder` heartbeat on production gave a 503, a down email and a recovery email. A total outage with no reply at all was not staged. |
| L8 | Browsers | Critical-path specs pass on Chrome, Safari (WebKit) and Firefox; Edge is covered by Chrome (same engine) | Done 2026-09-21. WebKit: 14 of 14 automated essential-path tests. Firefox: checked by hand on the live site, because Playwright's Firefox will not launch on the development Mac. |
| L9 | Accessibility | Automated WCAG 2.1 AA scan reports no serious or critical violations on the main screens; any remainder is logged | Known failures; fixes next |
| L10 | Security | Content-Security-Policy without `unsafe-inline` / `unsafe-eval` for scripts; database privileges and RLS covered by integration tests; secrets rotated; an outside review commissioned and its findings dealt with | CSP done (pending merge); outside review not started |
| L11 | Private beta | At least 3 providers using it for at least 2 weeks, with a crash-free session rate of 99% or better in Sentry and no unresolved unhandled errors from the last 7 days | Not started |
| L12 | Recovery plan | A one-page "something broke" plan: who is alerted, how to roll back a release, how to restore data | Not started |

---

## 2. Gates and owners

| Gate | Owner | Evidence to record |
|---|---|---|
| Upgrade the production Supabase project to Pro and enable point-in-time recovery | AJ | Plan screenshot; restore-test date and result (see docs/backup-and-recovery.md). Deferred to just before launch, which is only safe while production holds test data. |
| Upgrade Vercel to Pro | AJ | Plan screenshot. The Hobby plan is for non-commercial use only. Vercel dashboard, Settings, Billing. |
| Live-mode payment rehearsal | AJ (payment) with Claude (checking the result) | Date; the payment, the resulting activation in the platform, and the refund |
| `subscribe.spec` green with the Stripe listener | Claude | Test run output |
| Alerts (site down, scheduled job stopped) | Claude builds the health check; AJ creates the external monitor account | A deliberate failure that triggered an alert |
| Cross-browser tests | Claude | Run output per browser |
| Accessibility fixes and a permanent automated scan | Claude | Scan output with zero serious/critical violations |
| Outside security review | AJ commissions | Report and how each finding was closed |
| Private beta | AJ | Sentry crash-free rate, list of issues found |
| CQC publishes the new Adult Social Care framework | External | Framework content reviewed against the platform's wording |
| Data processing agreement reviewed by a solicitor (#231) | AJ | Signed-off document |

---

## 3. Infrastructure and hosting

- [ ] **Upgrade the production Supabase project to Pro and enable point-in-time recovery (hard gate).** Production is on the Free plan, which has no automated backups (see docs/backup-and-recovery.md). Do it before any real customer data is loaded, then restore a backup into a scratch project once to prove it works.
- [ ] **Upgrade Vercel to Pro (hard gate).** The current Hobby plan is for non-commercial personal use only. Upgrade to Pro ($20/month) before going live with paying customers.

---

## 4. API keys and external services

- [ ] **Anthropic API key.** Ensure `ANTHROPIC_API_KEY` in Vercel environment variables is set to a valid, active key from console.anthropic.com. AI support ticket drafts depend on this. A bad or missing key causes a silent 401 error for users.
- [ ] **Resend.** The free tier covers 3,000 emails/month (100/day). Monitor usage as the customer base grows; upgrade if approaching limits.
- [ ] **Supabase.** The free tier covers 500MB database and 1GB file storage. Adequate for early customers; review as evidence file uploads grow.

---

## 5. Notes on what breaks if a service lapses

| Service | Impact if it lapses |
|---|---|
| Vercel | Entire platform offline for all customers |
| Supabase | Platform loads but cannot read or write any data |
| Resend | Emails stop (invites, password resets, support notifications) |
| Anthropic | AI support drafts fail; everything else keeps working |
| Stripe | Customer billing fails; platform itself keeps running |

---

## 6. Reminders

- Vercel requires a **redeploy** after any environment variable change before it takes effect in production.
- The Anthropic API key in Vercel must match an active key in console.anthropic.com. If a key is rotated or deleted there, update Vercel immediately.
