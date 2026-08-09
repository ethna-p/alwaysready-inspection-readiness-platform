# Enterprise Handling — Structural Draft

> Status: Draft for review. Not yet approved or actioned. Revisit in ~2 weeks.

---

## What "Enterprise" means for AlwaysReady

In this market, the most likely enterprise customer is a **care group** — an organisation that operates multiple CQC-registered locations (e.g., a group running 8 care homes under one company). Right now, each home would need its own separate trial and subscription. That's friction at the commercial relationship level and creates no group-level visibility.

Enterprise handling breaks into three distinct problems: **inbound query capture**, **account structure**, and **billing**.

---

## 1. Inbound query capture

The current contact form on the marketing site already routes into `support_tickets`. The simplest extension is a dedicated "Group/Multi-site enquiry" option on that form (or a separate `/enterprise` page on the marketing site) that flags the ticket type so it can be seen clearly in the superadmin support view without getting lost among standard support requests. No schema change needed for this — the `support_tickets` table already has enough room.

---

## 2. Account structure

The current model is flat: one `organisation` = one CQC location = one subscription. An enterprise group needs a parent layer above that.

The cleanest approach is a new `enterprise_accounts` table:

```
enterprise_accounts
  id
  name                 -- "Sunrise Care Group Ltd"
  contact_name
  contact_email
  seats                -- number of locations covered by the contract
  contract_start
  contract_end
  annual_fee
  stripe_customer_id   -- optional, if invoiced via Stripe
  created_at
```

Each `organisation` then gets an optional `enterprise_account_id` FK. Enterprise-linked orgs would have `subscription_tier = 'enterprise'` rather than going through the standard Stripe checkout.

An `enterprise_admin` role (or a separate view) could give the group a read-only cross-location dashboard — seeing readiness scores across all their homes in one place. That's commercially compelling and something individual subscriptions can't offer.

---

## 3. Billing

Enterprise would be sales-led, not self-service. The likely flow:

- AJ speaks to the group, agrees a per-location annual fee (discounted vs. the individual monthly rate)
- AJ manually provisions the enterprise account in superadmin, sets `seats` and contract dates
- Each location gets a `subscription_tier = 'enterprise'` org — no Stripe checkout
- Invoicing happens outside the platform (or via Stripe Invoicing manually) until volume justifies automating it

The standard Stripe self-service checkout stays untouched for individual providers. Enterprise bypasses it entirely.

---

## What needs building (when ready)

In rough priority order:

1. `enterprise_accounts` migration + `lib/types.ts` update + `enterprise_account_id` on `organisations`
2. Superadmin enterprise management page (create account, assign orgs, set seats/contract dates)
3. `'enterprise'` added to the `subscription_tier` type — affects trial expiry logic and billing guards
4. Group dashboard for enterprise admins (cross-location readiness overview)
5. Marketing site "Group enquiry" form or dedicated enterprise page

---

## Open decision

Whether the group dashboard lives inside the main platform (enterprise admin logs in and sees a special view) or as a completely separate view. Recommended: keep it inside the platform — reuses existing auth and RLS, and enterprise admins can still drill into individual location detail.

RLS policy approach: enterprise account admins can read `compliance_records` for any org linked to their `enterprise_account_id`.
