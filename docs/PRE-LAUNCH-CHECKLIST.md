# Pre-Launch Checklist — AlwaysReady Platform

Target launch: Autumn 2026

Items here must be resolved before the platform goes live and accepts paying customers.

---

## Legal

- [ ] Purchase Simply Docs Business subscription and download templates (task #229)
- [ ] Complete Web App T&Cs and DPA templates (fill in schedules, choose options)
- [ ] Solicitor review: Web App T&Cs, DPA, Data Security Statement, Data Retention Policy (task #230)
- [ ] Create `/terms` and `/dpa` pages on portal.alwaysready.uk (task #231)
- [ ] Add T&Cs acceptance checkbox to trial signup form (task #232)
- [ ] DPA in place (task #135)

---

## Payments

- [ ] Delete Stripe sandbox product and recreate without tax; update `STRIPE_PRICE_ID` in Vercel
- [ ] Repeat in live Stripe account
- [ ] Create charity coupon (20% off, forever) in sandbox and live; add `STRIPE_CHARITY_COUPON_ID` to Vercel
- [ ] Register live webhook endpoint (`portal.alwaysready.uk/api/stripe-webhook`) in Stripe dashboard; update `STRIPE_WEBHOOK_SECRET` in Vercel

---

## Email

- [ ] Upgrade Resend to Pro plan (task #136)
- [ ] Wire up sales@ inbound email (task #163, blocked on #136)

---

## Platform behaviour

- [ ] Verify what happens when a trial expires: does the user lose access immediately, or is there a grace period?
  - The trial page copy promises users can export data "any time during your trial" — confirm access to the Account page and export button is still available right up to the expiry date, and not cut off before.
  - If users are locked out immediately on expiry, consider a short grace period (e.g. 48 hours) to allow final export.

---

## Business development

- [ ] Apply to be listed on the CQC digital software preferred supplier list

---

## CQC framework

- [ ] CQC new assessment framework expected Autumn 2026 — review KLOE titles against the finalised framework and write corrective migrations if needed.

---

## Final checks

- [ ] End-to-end smoke test: trial signup → welcome email → login → subscribe → billing portal
- [ ] Run Lighthouse on key in-app pages (dashboard, KLOE detail, HR module)
