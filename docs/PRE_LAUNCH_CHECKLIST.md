# AlwaysReady Platform — Pre-Launch Checklist

Things to action before onboarding paying customers.

---

## Infrastructure & Hosting

- [ ] **Upgrade the production Supabase project to Pro and enable point-in-time recovery (hard gate)** — production is on the Free plan, which has no automated backups (see docs/backup-and-recovery.md). Do it before any real customer data is loaded, then restore a backup into a scratch project once to prove it works. Deferred by AJ to just before launch (2026-09-21), which is only safe while production holds test data.
- [ ] **Upgrade Vercel to Pro** — the current Hobby plan is for non-commercial personal use only. Upgrade to Pro ($20/month) before going live with paying customers. Vercel dashboard → Settings → Billing.

---

## API Keys & External Services

- [ ] **Anthropic API key** — ensure `ANTHROPIC_API_KEY` in Vercel environment variables is set to a valid, active key from console.anthropic.com. AI support ticket drafts depend on this. A bad or missing key causes a silent 401 error for users.
- [ ] **Resend** — free tier covers 3,000 emails/month (100/day). Monitor usage as the customer base grows; upgrade if approaching limits.
- [ ] **Supabase** — free tier covers 500MB database and 1GB file storage. Adequate for early customers; review as evidence file uploads grow.

---

## Notes on What Breaks If a Service Lapses

| Service | Impact if it lapses |
|---|---|
| Vercel | Entire platform offline for all customers |
| Supabase | Platform loads but cannot read or write any data |
| Resend | Emails stop (invites, password resets, support notifications) |
| Anthropic | AI support drafts fail; everything else keeps working |
| Stripe | Customer billing fails; platform itself keeps running |

---

## Reminders

- Vercel requires a **redeploy** after any environment variable change before it takes effect in production.
- The Anthropic API key in Vercel must match an active key in console.anthropic.com. If a key is rotated or deleted there, update Vercel immediately.
