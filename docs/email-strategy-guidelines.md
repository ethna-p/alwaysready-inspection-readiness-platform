# Email Strategy Guidelines

Source: *Your Email Schedule Is Not a Strategy* — Stripo  
URL: https://stripo.email/blog/your-email-schedule-is-not-a-strategy  
Captured: August 2026

---

## The core argument

A sequence of emails sent on a schedule is not a strategy. A strategy defines what each email is trying to achieve, whether it is achieving it, and how each email relates to the ones before and after it. Without that, a sequence is just noise arriving on a timer.

---

## Four-stage framework

Each email in a sequence should be evaluated against this framework:

1. **Intent** — What is this email trying to do? Not "send week 4 content" but a specific behavioural goal: prompt a login, invite a reply, surface a feature, build trust. If you cannot name the intent in one sentence, the email does not have one.

2. **Sequential logic** — Does this email assume the reader received and acted on the previous one? If yes, does that assumption hold in practice? Emails should work as standalone pieces while still advancing the sequence.

3. **Success defined** — How do you know if this email worked? For marketing emails, replies are a stronger signal than opens. For transactional emails, the absence of a support ticket about the same topic is a signal.

4. **Review cadence** — Sequences should be reviewed as a whole, not one email at a time. A reply to one email often reveals a problem with a different email upstream.

---

## The three core tests

Run each email through these before it goes live:

| Test | Question |
|---|---|
| **Intent** | Can you name the one thing this email wants the reader to do or feel? |
| **Sequential logic** | Does this email make sense if the reader ignored the last one? |
| **Success defined** | What would tell you this email is working? |

---

## Principles applied to AlwaysReady sequences

These principles drove the August 2026 rebuild of all three email sequences:

### Story-led openings
Start with a scenario, observation, or consequence — not a feature description. The reader's situation before they open the email, not a product announcement.

**Before:** "This week we're focusing on the audit trail feature."  
**After:** "Two services. Same care quality. One rated Good, one Outstanding. The difference was what they could prove."

### Remove bullet lists from nurture and onboarding emails
Bullet lists signal "scanning content" rather than "reading a letter." Nurture and onboarding emails should feel like correspondence, not feature documentation. Integrate list content into flowing prose.

**Exception:** The help page, FAQ content, and feature documentation are appropriate places for lists.

### Reply CTAs over link CTAs
Asking for a reply has higher engagement than asking for a click, builds a direct line to users, and surfaces product feedback organically. Every email should have at most one primary CTA; where the purpose is relationship-building, that CTA should be a reply invitation.

**Examples used:**
- "What is the part of CQC compliance that takes up the most of your time right now? Just hit reply."
- "Which of these five areas is your biggest challenge right now? Hit reply and let us know."
- "Is the Trend Report showing progress you're pleased with, or are there areas giving you concern? Hit reply."

### Vary closings across the sequence
Repeating the same sign-off phrase ("find us in the Support tab") across consecutive emails trains readers to skip the final paragraph. Closings should rotate between:
- Reply CTA (asking a specific question)
- Support tab reference (for feature-focused emails where a question is natural)
- Open invitation (for editorial emails where a reply is welcome but not forced)

### Warm, direct tone
Avoid padded language: "incredibly valuable", "proactively", "significantly", "landscape", "tailored", "foster", "embody". These are AI tells and corporate filler. Write the way a helpful, knowledgeable colleague would write.

---

## Sequence-specific notes

### Waitlist nurture (`lib/waitlist-nurture.ts`)
- 8 emails, weekly
- Audience: people who signed up to the waitlist and opted in to nurture
- Purpose: build trust, surface the problem, position AlwaysReady as the answer before a trial begins
- Key emails rebuilt (Aug 2026): 1, 3, 4, 5, 7, 8

### Trial emails (`app/api/cron/trial-emails/route.ts`)
- 9 emails (Days 1, 3, 5, 7, 9, 11, 13 via cron; 14a and 14b via Stripe webhook)
- **Day 14a** fires when a trial converts to a paid subscription — triggered by Stripe `customer.subscription.created` webhook, not the cron
- **Day 14b** fires when a trial lapses without converting — triggered by the cron on day 14 for non-converted orgs
- Audience: active trial users
- Purpose: drive activation and conversion within 14 days
- Key emails rebuilt (Aug 2026): Day 5 (reply invitation), Day 14b (lead with value, not deletion)

### Onboarding emails (`app/api/cron/onboarding-emails/route.ts`)
- 18 emails across 12 months (12-week weekly sequence + 6 monthly check-ins)
- Audience: paying subscribers (admin role, marketing_opt_out: false)
- Purpose: drive deep platform adoption, build inspection readiness habits, retain subscribers
- Full sequence rebuilt (Aug 2026): varied closings, weeks 10–11 replaced with editorial content, month 4–12 check-ins added

---

## What to check before adding a new email to any sequence

1. What is the intent of this email — specifically?
2. Is there already an email in the sequence covering similar ground?
3. What does the reader need to believe or feel after reading this, that they did not before?
4. Does the closing invite a reply, or is it just a sign-off?
5. Is the opening story-led or feature-led? (Should be story-led for nurture/onboarding.)
