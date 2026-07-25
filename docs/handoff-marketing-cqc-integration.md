# Handoff: CQC Integration — Marketing Brief

This document is for the marketing team / Marketing Claude. It covers what the CQC API integration does, what CQC's direction of travel means for the sector, and how AlwaysReady's positioning should be communicated to prospective customers. Do not change the technical details without checking with AJ first.

---

## What the integration does

AlwaysReady connects to the CQC Syndication API — CQC's official, publicly available data feed — to pull live registration and rating data for each provider on the platform. This happens automatically, without the provider having to do anything beyond entering their CQC Location ID when they sign up.

From that single ID, the platform:

- **Validates the provider at sign-up.** When a prospective customer enters their Location ID during the free trial form, AlwaysReady checks it against the live CQC register in real time. If the ID is not found, the user sees a warning. This means AlwaysReady accounts can only be created by CQC-registered providers — it is not open to anyone.
- **Auto-populates their registered service name.** The name held on the CQC register is retrieved and pre-filled in the sign-up form. This both saves time and gives the prospective customer immediate confirmation that their Location ID is correct.
- **Displays their live CQC rating on the dashboard.** Once inside the platform, providers see their current CQC rating — Outstanding, Good, Requires Improvement, or Inadequate — displayed prominently on the dashboard in CQC's official colours (navy, dark green, amber, dark red). This matches what inspectors and the public see on the CQC website.
- **Shows their registered name, last inspection date, and a link to their CQC profile.** All pulled automatically from the public register.
- **Refreshes the data every 24 hours.** The platform checks whether the cached data is more than 24 hours old on each dashboard load; if it is, it fetches fresh data from CQC. Providers always see current information without having to request a refresh.

This data flow is **one-way and read-only.** AlwaysReady reads from the CQC public register. It does not send any provider data to CQC, does not submit compliance information on the provider's behalf, and is not connected to any internal CQC system. The CQC register is public under the Open Government Licence.

---

## CQC's direction of travel — why this matters now

The CQC is in the middle of a significant digital transformation, and understanding it is important context for how AlwaysReady should be positioned.

**KLOE framework review.** CQC paused its inspection programme and is reviewing its regulatory approach. A revised framework — widely expected to retain the five key questions (Safe, Effective, Caring, Responsive, Well-led) and some form of KLOE-style evidence prompts — is expected to be finalised in Autumn 2026. AlwaysReady is built around the KLOE framework and is architected so that any changes to the framework (KLOEs moving between key questions, new prompts being added) can be applied without a system rebuild. Compliance records are not affected by framework updates.

**Continuous assessment.** CQC is moving away from infrequent, announced inspections towards a model of continuous assessment — drawing on ongoing data signals, provider submissions, and public feedback to build a rolling picture of quality. This means providers who can demonstrate active, documented compliance over time will be better positioned than those who prepare only when an inspection is imminent. AlwaysReady's permanent, unalterable audit trail is directly aligned with this direction.

**Provider portal rebuild.** CQC is rebuilding its provider-facing portal, which currently hosts the Syndication API and the Provider Information Return (PIR). The new portal is expected to offer structured data submission and real-time registration management. AlwaysReady is already consuming CQC's public API, which means integration with any future provider-facing data exchange is a natural evolution rather than a ground-up build.

**Syndication API.** The Syndication API AlwaysReady uses is CQC's official data distribution mechanism, updated daily, and available under the Open Government Licence. It is the same source that powers CQC's own public search and third-party tools used by commissioners and the public. AlwaysReady is one of very few inspection readiness products for adult social care that connects to it directly.

---

## Positioning and competitive advantage

**For prospective customers:**

Most inspection readiness tools are static. They provide a framework and a place to store notes, but the provider has to manually update their compliance position and keep track of CQC's published ratings separately. AlwaysReady does this automatically. The provider's current CQC rating is on their dashboard, refreshed daily, in the right colours, with a link to their public profile — without them having to log in to the CQC website or remember to check it.

For Registered Managers who are responsible for communicating the service's regulatory position to owners, boards, or local authorities, having the live rating visible alongside their internal readiness percentage is a meaningful convenience. It reduces the risk of a manager being caught off guard by a rating change they did not notice.

**For the sector context:**

As CQC moves towards continuous assessment, the providers who will fare best are those who can show a documented history of active compliance management — not just a tidy file put together in the week before an inspection. AlwaysReady's audit trail and KLOE tracking are designed exactly for this. The CQC rating integration reinforces this message: this is a platform that treats CQC data as live and ongoing, not something you check when you get a call.

**Against competitors:**

No other adult social care inspection readiness tool in the UK currently surfaces a live CQC rating pulled directly from the Syndication API on the provider's dashboard. Competitors rely on manually entered or self-reported ratings. AlwaysReady's rating is the same one CQC publishes — authoritative, current, and automatically updated.

The Location ID validation at sign-up also matters competitively: AlwaysReady is restricted to CQC-registered providers. This is not just an IP protection measure — it means the customer base is, by definition, CQC-regulated. This is a stronger, more coherent product positioning than a generic compliance tool open to anyone.

---

## Suggested messaging for the marketing website

The following are suggested angles and copy fragments. Marketing Claude should adapt these to fit the tone and format of the existing site.

**Short tag / headline angle:**
"Your live CQC rating, right on your dashboard. Updated daily — automatically."

**Feature description (for a features section or product tour):**
"AlwaysReady connects to the CQC public register so your current rating, registered service name, and last inspection date appear on your dashboard — in CQC's own colours, updated every 24 hours. You do not have to check the CQC website separately, and your rating is never out of date."

**Trust / validation angle:**
"When you sign up, AlwaysReady checks your CQC Location ID against the live register. Only CQC-registered services can create an account. It takes seconds and confirms your registration details before you start."

**Direction of travel angle (for a blog post, email, or 'why now' section):**
"CQC is moving towards continuous assessment — a model where your compliance position is monitored over time, not just on inspection day. AlwaysReady is built for this: a permanent audit trail, active KLOE tracking, and a direct connection to the CQC register. Providers who start building their documented compliance history now will be better placed when the new framework lands in Autumn 2026."

---

## Attribution note (important)

The platform displays the following attribution alongside the CQC rating on the dashboard. This wording must not be changed without legal review:

> "Data sourced from the CQC public register, updated daily. AlwaysReady is not affiliated with or endorsed by the Care Quality Commission."

This language is required to comply with the terms of the Open Government Licence and to make clear AlwaysReady's independence from CQC. Do not remove or alter it in any marketing context either.

---

## What to avoid in marketing copy

- Do not imply AlwaysReady has a special relationship with CQC or that ratings shown on the platform are provided directly by CQC to AlwaysReady. The data is publicly available.
- Do not suggest the platform can influence a provider's CQC rating or that using AlwaysReady guarantees a particular inspection outcome.
- Do not use "endorsed by CQC" or "approved by CQC" in any context.
- Do not claim the platform submits compliance data to CQC on the provider's behalf — it does not.
