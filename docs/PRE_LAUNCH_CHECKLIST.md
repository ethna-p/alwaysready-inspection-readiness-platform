# AlwaysReady Platform — Pre-Launch Checklist

Things to action before onboarding paying customers.

---

## Infrastructure & Hosting

- [ ] **Upgrade Vercel to Pro** — the current Hobby plan is for non-commercial personal use only. Upgrade to Pro ($20/month) before going live with paying customers. Vercel dashboard → Settings → Billing.

---

## API Keys & External Services

- [ ] **Anthropic API key** — ensure `ANTHROPIC_API_KEY` in Vercel environment variables is set to a valid, active key from console.anthropic.com. The newsletter drafting tool and AI support ticket drafts both depend on this. A bad or missing key causes a silent 401 error for users.
- [ ] **Resend** — free tier covers 3,000 emails/month (100/day). Monitor usage as the customer base grows; upgrade if approaching limits.
- [ ] **Supabase** — free tier covers 500MB database and 1GB file storage. Adequate for early customers; review as evidence file uploads grow.

---

## Notes on What Breaks If a Service Lapses

| Service | Impact if it lapses |
|---|---|
| Vercel | Entire platform offline for all customers |
| Supabase | Platform loads but cannot read or write any data |
| Resend | Emails stop (invites, password resets, support notifications) |
| Anthropic | Newsletter drafting tool and AI support drafts fail; everything else keeps working |
| Stripe | Customer billing fails; platform itself keeps running |

---

## Reminders

- Vercel requires a **redeploy** after any environment variable change before it takes effect in production.
- The Anthropic API key in Vercel must match an active key in console.anthropic.com. If a key is rotated or deleted there, update Vercel immediately.
