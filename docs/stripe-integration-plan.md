# Stripe Integration Plan

_Last updated: 18 July 2026_

---

## Key decisions

- **Demo IS the trial** — no separate sign-up flow. Visitors use the existing demo, then subscribe when ready. The demo org becomes their live org on payment.
- **14-day free trial** — card collected at checkout, charged on day 14 unless cancelled
- **"End Trial" self-service** — admins can cancel at any time via a button in the platform, without contacting AlwaysReady. Removes sign-up anxiety.
- **"Clear demo data" option** — on upgrade, admins can choose to wipe seeded/example data or keep what they've entered
- **Stripe flips the org, not creates it** — on payment, webhook sets `is_demo = false`, stops the midnight reset, activates the subscription
- **Manual provisioning stays** in the superadmin for edge cases only (complimentary access, beta testers, bespoke deals)
- **Single plan to start** — no tiers

---

## Full customer journey

1. Visitor lands on alwaysready.uk, clicks "Try it free" → goes to the demo
2. Uses the demo for as long as they like (resets nightly)
3. When ready, clicks "Subscribe" → Stripe Checkout (14-day trial, card collected upfront)
4. Checkout session metadata includes: `{ org_id }` — the demo org they've been using
5. Payment confirmed → `checkout.session.completed` webhook fires
6. Platform webhook: sets `is_demo = false`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status = trialing`, `trial_ends_at = now + 14 days`, stops midnight reset
7. Welcome email sent confirming their account is now live
8. Admin logs in — sees option to clear demo seed data or keep everything
9. Nightly cron sends trial reminder emails at 7 days and 3 days remaining
10. On day 14, Stripe charges the card → `invoice.paid` fires → `stripe_subscription_status = active`, trial banner removed
11. If card fails or admin cancels → org suspended, email sent with reactivation/cancellation confirmation

---

## The three moving parts

### 1. Marketing site (alwaysready.uk — separate repo, not touched here)

- "Try it free" CTA → demo
- "Subscribe" button on the demo → Stripe Checkout with 14-day trial
- Checkout session metadata must include `{ org_id }` of the demo org
- Success page: "Your account is now live — check your email"
- **Webhook endpoint to configure in Stripe dashboard:** `https://alwaysready-inspection-readiness-pl-three.vercel.app/api/stripe/webhook`

### 2. This platform — webhook receiver

New route: `POST /api/stripe/webhook`

| Stripe event | Action |
|---|---|
| `checkout.session.completed` | Set `is_demo = false`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status = trialing`, `trial_ends_at = now + 14 days`, stop midnight reset, send welcome email |
| `invoice.paid` | Set `stripe_subscription_status = active`, `is_active = true`, clear `trial_ends_at` |
| `customer.subscription.deleted` | Set `stripe_subscription_status = cancelled`, `is_active = false`, send cancellation confirmation email |
| `invoice.payment_failed` | Send payment failed email with link to update card details |

Webhook must verify the Stripe signature using `STRIPE_WEBHOOK_SECRET` before processing any event.

### 3. Schema changes (this platform)

New columns on `organisations`:

| Column | Type | Notes |
|---|---|---|
| `stripe_customer_id` | `text` | Stripe customer ID (`cus_...`) |
| `stripe_subscription_id` | `text` | Stripe subscription ID (`sub_...`) |
| `stripe_subscription_status` | `text` | `trialing`, `active`, `cancelled`, `past_due` |

`is_demo` already exists — webhook flips it to `false` on payment.

---

## "End Trial" self-service cancellation

An "End Trial" button visible in the platform during the trial period (e.g. in Account settings or the trial banner). Clicking it:
1. Calls Stripe API to cancel the subscription
2. Sets `is_active = false`, `stripe_subscription_status = cancelled`
3. Sends a cancellation confirmation email
4. Shows a confirmation screen with a link to re-subscribe if they change their mind

---

## "Clear demo data" on upgrade

After subscribing, admin sees a one-time prompt:

> "Would you like to clear the example data, or keep what you've already entered?"

- **Clear** — deletes seeded KLOE records, compliance records, and example evidence. Leaves the org, users, and any real data the admin entered during the trial.
- **Keep** — no action. Everything stays as-is.

This is a server action that deletes rows where `is_seed_data = true` (new flag to add to relevant tables, set when demo data is seeded).

---

## Trial expiry emails

Sent via Resend from `hello@alwaysready.uk`. Nightly cron checks `trial_ends_at`:

| Trigger | Email |
|---|---|
| 7 days before expiry | "Your trial ends in 7 days" — reassure them, include "End Trial" link if they want to cancel |
| 3 days before expiry | "Your trial ends in 3 days" — same, more urgent |
| Day of expiry | Stripe handles the charge; `invoice.paid` or `invoice.payment_failed` webhook fires accordingly |

**Dependency: DKIM for `hello@alwaysready.uk` must be live before these emails can send.**

---

## Build order (this platform)

1. **Migration** — add `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status` to `organisations`; add `is_seed_data` flag to KLOE/compliance tables; update `lib/types.ts`
2. **Webhook route** — `POST /api/stripe/webhook`, verify signature, handle the four events
3. **"End Trial" cancellation** — button in trial banner + account settings, calls Stripe cancel API
4. **"Clear demo data" action** — server action + one-time prompt shown after upgrade
5. **Trial expiry emails** — extend nightly cron to send at 7 days / 3 days
6. **Superadmin badge** — show subscription status (Trialing / Active / Cancelled / Past Due) in org list

---

## Environment variables needed

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Both go in `.env.local` and Vercel Environment Variables. Never commit to git.

---

## Dependencies / blockers

- **DKIM setup** must be complete before trial expiry emails send from `hello@alwaysready.uk`
- **Stripe account** must have a product and price configured (with 14-day trial) before end-to-end testing
- **Marketing site** must wire the "Subscribe" button to Stripe Checkout with `org_id` in metadata

---

## Out of scope (for now)

- Multiple pricing tiers
- Stripe Customer Portal link in-platform (nice to have later — lets admins update card details self-service)
- Promo codes / discounts
