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

## AI Support — Contextual Assistant (V2)

### Data-aware AI support tier
**Status:** Scoped — not yet scheduled  
**Rationale:** Ara currently matches questions to a fixed set of known answers. A contextual assistant that can read a customer's own platform data would provide genuinely useful out-of-hours support and reduce support ticket volume for common queries.

---

**What it would do**

Instead of answering generic FAQ questions, the assistant would have read-only access to the customer's own organisation data — KLOE statuses, review dates, action items, HR records — and answer questions grounded in what is actually in their account. Examples:

- "Which of my KLOEs are overdue for review?"
- "Who on my team has a DBS expiring in the next 60 days?"
- "What outstanding actions do I have marked Must Address?"
- "Show me my readiness summary across the five key questions."

These responses carry virtually no hallucination risk because they are lookups against structured data, not inferences.

---

**Hard boundaries — what it must never do**

This is the critical design constraint. The assistant must stay firmly on the "read and report" side of the line, never the "advise and interpret" side.

- ✅ Tell a customer what their data says
- ❌ Tell a customer what their data means for their CQC rating
- ❌ Interpret compliance status or predict inspection outcomes
- ❌ Give guidance on clinical, safeguarding, or regulatory decisions
- ❌ Write to any record (read-only at all times)

The reason this boundary is non-negotiable: a care manager acting on a hallucinated compliance answer could make a genuinely harmful decision. No disclaimer fully protects against that liability. The assistant's value is in surfacing information the manager already owns — the professional judgement stays with the manager.

---

**Customer data concerns**

Some customers will ask about AI accessing their data. The standard response:

- Read-only — the assistant cannot create, edit, or delete anything
- Scoped to their organisation only — no cross-customer data access
- Not used for AI training — data sent via the Anthropic API is not used to train models by default
- No clinical data is stored in AlwaysReady — the assistant only sees governance records

This framing will satisfy most customers. Those who push back should be taken seriously — their questions will identify any gaps in the privacy or security documentation.

---

**Technical approach**

The building blocks are largely in place:

- Anthropic SDK already integrated (`lib/ai-draft.ts`)
- Data model is clean and organisation-scoped by design
- Row-level security in Supabase already enforces org isolation

New work required:
- A secure query layer that accepts natural language, translates to scoped Supabase queries, and returns structured results to the model as context
- A tool-use pattern (function calling) so the model requests specific data rather than receiving a full data dump
- Session management so the assistant knows which organisation it is serving
- A new UI surface — likely a chat panel accessible from the dashboard, separate from the marketing site chatbot

**Trigger:** Build when support ticket volume justifies it, or when contextual AI becomes a meaningful differentiator against competitors.

---

*Last updated: August 2026*
