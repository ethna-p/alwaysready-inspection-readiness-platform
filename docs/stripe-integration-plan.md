# Stripe Integration Plan

_Last updated: 18 July 2026_

---

## Decisions

- **14-day free trial** — care managers need time to configure the platform and see value before committing
- **Stripe auto-creates the org** — no manual provisioning for paying customers; the webhook handles everything
- **Manual provisioning stays** in the superadmin for edge cases only (complimentary access, beta testers, bespoke deals)
- **Single plan to start** — no tiers

---

## Full customer journey

1. Visitor lands on alwaysready.uk pricing page
2. Clicks "Start free trial" → Stripe Checkout (14-day trial built into the Stripe subscription, card collected upfront)
3. Trial starts → `checkout.session.completed` webhook fires
4. Platform webhook receiver **auto-creates** the org and admin user, sets `trial_ends_at = now + 14 days`
5. Welcome email sent to the new admin with login details and a temporary password
6. Admin logs in, uses the platform for 14 days
7. Nightly cron sends trial expiry reminder emails at 7 days and 3 days remaining
8. On day 14, Stripe charges the card → `invoice.paid` webhook fires → org becomes fully active, trial banner removed
9. If card fails or subscription is cancelled → `customer.subscription.deleted` → org deactivated, email sent

---

## The three moving parts

### 1. Marketing site (alwaysready.uk — separate repo, not touched here)

- Pricing page with "Start free trial" CTA
- Stripe Checkout configured with 14-day trial period and card collection
- Checkout session metadata must include: `{ org_name, admin_name, admin_email }` so the webhook can create the org
- Success page: "Check your email — your account is being set up"
- **Webhook endpoint to configure in Stripe dashboard:** `https://alwaysready-inspection-readiness-pl-three.vercel.app/api/stripe/webhook`

### 2. This platform — webhook receiver

New route: `POST /api/stripe/webhook`

| Stripe event | Action |
|---|---|
| `checkout.session.completed` | Create org row, create Supabase auth user, set `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status = trialing`, `trial_ends_at = now + 14 days`, send welcome email |
| `invoice.paid` | Set `stripe_subscription_status = active`, `is_active = true`, clear `trial_ends_at` |
| `customer.subscription.deleted` | Set `stripe_subscription_status = cancelled`, `is_active = false`, send cancellation email |
| `invoice.payment_failed` | Send payment failed email to admin with link to update card |

Webhook must verify the Stripe signature using `STRIPE_WEBHOOK_SECRET` before processing any event.

### 3. Schema changes (this platform)

New columns on `organisations`:

| Column | Type | Notes |
|---|---|---|
| `stripe_customer_id` | `text` | Stripe customer ID (`cus_...`) |
| `stripe_subscription_id` | `text` | Stripe subscription ID (`sub_...`) |
| `stripe_subscription_status` | `text` | `trialing`, `active`, `cancelled`, `past_due` |

---

## Trial expiry emails (nightly cron extension)

Check `trial_ends_at` each night and send via Resend from `hello@alwaysready.uk`:

| Trigger | Email |
|---|---|
| 7 days before expiry | "Your trial ends in 7 days" — reassure them the card won't be charged until day 14, link to pricing page |
| 3 days before expiry | "Your trial ends in 3 days" — more urgent, highlight key features they may not have tried |
| Day of expiry | Stripe handles the charge; if successful `invoice.paid` fires; if failed send payment failure email |

**Dependency: DKIM for `hello@alwaysready.uk` must be live before any of these emails can send.**

---

## Build order (this platform)

1. **Migration** — add `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status` to `organisations`; update `lib/types.ts`
2. **Webhook route** — `POST /api/stripe/webhook`, verify signature, handle the four events above
3. **Auto-provisioning** — within `checkout.session.completed`: create org, create Supabase auth user, send welcome email via Resend
4. **Trial expiry emails** — extend nightly cron to send at 7 days / 3 days
5. **Superadmin badge** — show subscription status (Trialing / Active / Cancelled / Past Due) in org list

## Environment variables needed

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Both go in `.env.local` and Vercel Environment Variables. Never commit to git.

---

## Dependencies / blockers

- **DKIM setup** must be complete before any transactional emails send from `hello@alwaysready.uk`
- **Stripe account** must have a product and price configured (with 14-day trial) before end-to-end testing
- **Marketing site pricing page** must be built before the checkout flow exists (separate work, separate repo)

---

## Out of scope (for now)

- Multiple pricing tiers
- Stripe Customer Portal link in-platform (so admins can self-manage billing — nice to have later)
- Promo codes / discounts
