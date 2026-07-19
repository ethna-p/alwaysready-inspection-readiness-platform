# Stripe Cancellation Workflow

Internal reference for when Stripe integration is built. Covers the end-to-end self-service cancellation flow triggered from the customer's Account dashboard.

---

## Trigger

The admin user clicks **Cancel Subscription** on `/dashboard/account`. This is only visible to users with `role = 'admin'` on a paid subscription tier (i.e. `subscription_tier = 'active'` or similar — not `'trial'`).

---

## Schema prerequisites (to add when Stripe is built)

The following columns are needed on `public.organisations` (add via migration):

```sql
stripe_customer_id       text UNIQUE,
stripe_subscription_id   text UNIQUE,
subscription_tier        text NOT NULL DEFAULT 'trial',
-- already exists, but will need values: 'trial' | 'active' | 'cancelled'
billing_period_end       timestamptz,   -- populated from Stripe subscription current_period_end
cancels_at_period_end    boolean NOT NULL DEFAULT false
```

---

## UI flow (account page)

1. Admin sees a **Subscription** section showing their current plan and next billing date.
2. A **Cancel subscription** button (styled as a secondary/destructive action, not prominent) is visible.
3. Clicking it opens a confirmation modal:
   - "Are you sure you want to cancel? Your access will continue until [billing_period_end]. After that date your account will be closed and your data will be retained for 30 days before permanent deletion."
   - Two buttons: **Keep my subscription** (default focus) and **Yes, cancel**.
4. On confirm, the server action runs (see below).
5. The page refreshes showing a "Cancellation confirmed" banner with the access end date. The cancel button is replaced with a "Reactivate subscription" option.

---

## Server action: `cancelSubscription(orgId)`

Located at `app/dashboard/account/actions.ts`.

Steps:
1. Verify the calling user is an admin for this organisation (RLS + role check).
2. Fetch `stripe_subscription_id` from `organisations`.
3. Call Stripe API:
   ```typescript
   await stripe.subscriptions.update(stripeSubscriptionId, {
     cancel_at_period_end: true,
   })
   ```
   This schedules cancellation at the end of the current billing period — the customer keeps access until then.
4. Update `organisations` table:
   ```sql
   UPDATE organisations
   SET cancels_at_period_end = true
   WHERE id = orgId;
   ```
5. Send a transactional confirmation email to the admin:
   - Subject: "Your AlwaysReady subscription has been cancelled"
   - Body: confirms cancellation, states access end date, reminds them they can download data, links to reactivation.
6. Send an internal notification to superadmin (support ticket or email) so AJ is aware.

---

## Stripe webhook: `customer.subscription.deleted`

When Stripe confirms the subscription has ended (after the billing period), the webhook at `/api/webhooks/stripe` should:

1. Match `stripe_subscription_id` to the organisation.
2. Update `organisations`:
   ```sql
   UPDATE organisations
   SET subscription_tier = 'cancelled',
       cancels_at_period_end = false
   WHERE stripe_subscription_id = [id];
   ```
3. Revoke all user sessions for that organisation (Supabase admin `signOut` by user ID, or set a `suspended` flag).
4. Send a final email to the admin confirming access has ended and reminding them their data is retained for 30 days.

---

## Reactivation

If the customer reactivates before the billing period ends, call:
```typescript
await stripe.subscriptions.update(stripeSubscriptionId, {
  cancel_at_period_end: false,
})
```
And reset `cancels_at_period_end = false` on the organisation.

If they return after the subscription has fully lapsed, treat them as a new signup via the `/trial` flow but with `subscription_tier = 'active'` and a new Stripe subscription.

---

## Data retention after cancellation

Per the data retention policy:
- Data is retained for 30 days after access ends.
- The nightly cron job (`/api/cron/reset-demo`) should be extended (or a separate cron written) to permanently delete organisations where `subscription_tier = 'cancelled'` and `updated_at < now() - interval '30 days'`.
- The customer can download their data at any time during the 30-day retention window (download feature to be built as part of the Stripe integration).

---

## Notes

- Never cancel immediately — always use `cancel_at_period_end: true`. Immediate cancellation is not offered.
- The DPA from the solicitor should be in place before the first paying customer cancels, as deletion is a data subject right under UK GDPR.
- Upgrade to Resend Pro before go-live to ensure cancellation and access-end emails deliver reliably.
