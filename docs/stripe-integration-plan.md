# Stripe Integration Plan

_Last updated: 18 July 2026_

## Overview

Stripe handles payment conversion for organisations moving from trial to paid. Manual provisioning via the superadmin stays in place — Stripe is purely the conversion mechanism, not the org creation mechanism.

---

## What we already have

- `trial_ends_at`, `is_active`, `plan` on every `organisations` row
- Superadmin provisions orgs manually
- Nightly cron job running at `/api/cron/nightly`
- Resend email infrastructure (pending DKIM for `hello@alwaysready.uk`)

---

## The three moving parts

### 1. Marketing site (alwaysready.uk — separate repo)

- Pricing page → Stripe Checkout
- Checkout URL includes `org_id` as Stripe metadata so the webhook knows which org to activate
- Success page after payment
- **This repo does not touch the marketing site**

### 2. This platform — webhook receiver

New route: `POST /api/stripe/webhook`

Stripe events to handle:

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status = active`, `is_active = true`, clear `trial_ends_at` |
| `invoice.paid` | Confirm `stripe_subscription_status = active`, ensure `is_active = true` |
| `customer.subscription.deleted` | Set `stripe_subscription_status = cancelled`, `is_active = false` |

### 3. The Stripe ↔ org link

- Stripe Checkout includes `org_id` in session metadata
- Webhook reads `metadata.org_id` and looks up the org
- Three new columns needed on `organisations`: `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`

---

## Trial expiry emails (nightly cron extension)

Check `trial_ends_at` each night and send via Resend to the org's admin email:

| Trigger | Email |
|---|---|
| 7 days before expiry | "Your trial ends in 7 days" — include pricing page link |
| 3 days before expiry | "Your trial ends in 3 days" — more urgent CTA |
| Day of expiry | "Your trial has ended" — set `is_active = false`, send payment link |

**Dependency: DKIM for `hello@alwaysready.uk` must be live before these emails can send.**

---

## Build order (this platform)

1. **Migration** — add `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status` to `organisations`; update `lib/types.ts`
2. **Webhook route** — `/api/stripe/webhook`, verify Stripe signature, handle the three events
3. **Trial expiry emails** — extend nightly cron, send Resend emails at 7 days / 3 days / 0 days
4. **Superadmin badge** — show subscription status (Trial / Active / Cancelled / Lapsed) in org list

## Environment variables needed

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Both go in `.env.local` and Vercel Environment Variables. Never commit to git.

---

## Dependencies / blockers

- **DKIM setup** must be complete before trial expiry emails can send (Resend sending from `hello@alwaysready.uk`)
- **Marketing site pricing page** must be built before the checkout flow exists (separate work)
- **Stripe account** must have a product and price configured before the webhook can be tested end-to-end

---

## Out of scope (for now)

- Auto-provisioning orgs from Stripe (keep manual provisioning via superadmin)
- Multiple pricing tiers (single plan to start)
- Stripe Customer Portal link in-platform (nice to have, later)
