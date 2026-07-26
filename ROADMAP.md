# AlwaysReady Platform Roadmap

Items here are confirmed future work. They are not yet scheduled or prioritised — that happens when we pick them up for a build session.

---

## Notifications

### WhatsApp notifications via Meta Cloud API
**Status:** Planned  
**Rationale:** Staff are more likely to see a WhatsApp message than an email. Email notifications for KLOE assignment are now live (July 2026); WhatsApp would extend the same notifications to mobile.

**Scope:**
- KLOE assignment alerts — notify staff member when a KLOE is assigned to them
- Review reminders — notify assigned staff when a KLOE review is coming due
- Possible future: weekly digest to admin

**Technical approach:**
- Use Meta Cloud API direct (no third-party middleware — avoids Twilio's $0.005/message markup)
- Requires Meta Business verification and WhatsApp Business Account setup (~1–2 weeks process)
- Message templates must be pre-approved by Meta before sending
- The `mobile_number` field already exists on the `users` table and is exposed in Account → Notifications

**Cost estimate (July 2026 Meta UK utility rate):**
- $0.022 per message (UK recipient)
- Average care home: ~16 messages/month
- 150 customers: ~$53/month total (~£42) — <0.4% of revenue at £75/month per customer

**Trigger:** Build when customers start requesting it, or when notification volume justifies the Meta verification overhead.

---

## Notifications (other)

### Weekly digest email for admins
**Status:** Planned  
**Rationale:** A Monday morning summary email — Red/Amber/Green KLOE breakdown, overdue reviews, outstanding assignments — lets managers track progress without logging in.

### Evidence upload notifications
**Status:** Planned  
**Rationale:** Notify the admin when a team member uploads evidence to a KLOE. Closes the feedback loop on assigned work.

### New team member joined confirmation
**Status:** Planned  
**Rationale:** Confirm to the admin when an invited user completes their account setup.

### Trial expiry reminders
**Status:** Planned  
**Rationale:** Automated emails to the admin at 30, 14, and 7 days before trial ends. Commercial priority.

---

## Legal & compliance

### T&Cs and DPA pages
**Status:** Blocked on solicitor review (tasks #229–#232)  
**Rationale:** Required before commercial launch. Simply Docs Business templates purchased; awaiting solicitor sign-off.

---

## Stripe

### Charity coupon
**Status:** Pending AJ action  
**Rationale:** Create charity coupon in Stripe, add `STRIPE_CHARITY_COUPON_ID` to Vercel env vars.

### Live webhook registration
**Status:** Pending AJ action  
**Rationale:** Register live Stripe webhook endpoint, update `STRIPE_WEBHOOK_SECRET` in Vercel.

---

*Last updated: July 2026*
