# AlwaysReady Marketing Site — Claude Brief

This document gives Claude the context needed to work on the AlwaysReady marketing site (alwaysready.uk) confidently and consistently.

---

## What AlwaysReady is

AlwaysReady is a web-based inspection readiness platform for adult social care providers in England. It helps care homes and other regulated services stay on top of CQC compliance between inspections — not just scramble to prepare when an inspector is on the way.

The platform tracks Key Lines of Enquiry (KLOEs), shows readiness at a glance using a RAG (Red/Amber/Green) status system, maintains a permanent audit trail of all compliance activity, and produces a printable inspection pack at the click of a button.

---

## Who it is for

**Primary user:** Registered Care Managers (RCMs) — the person legally responsible for a CQC-registered service. They are time-poor, often not tech-savvy, and carry significant personal responsibility for compliance outcomes.

**Secondary users:** Senior managers, deputy managers, and care staff who are assigned specific KLOEs to manage.

**Service types covered:**
- Residential care homes
- Nursing homes
- Dual-registered care homes
- Domiciliary care
- Supported living
- Extra care housing
- Shared lives

All services regulated by CQC in England.

---

## The problem it solves

CQC inspections are high-stakes and unpredictable. Many providers only pull their compliance evidence together when an inspection is imminent — by which point it is often too late to address gaps. Managers spend hours chasing paperwork, creating spreadsheets, and trying to remember what was done and when.

AlwaysReady makes compliance an ongoing, manageable process rather than a last-minute panic. It gives managers a live view of where they stand, who is responsible for what, and what needs attention today.

---

## Key features

- **Readiness dashboard** — overall % readiness score and breakdown by CQC key question (Safe, Effective, Caring, Responsive, Well-led)
- **KLOE tracker** — all 24 KLOEs with RAG status, priority, next review dates, and assigned team members
- **Daily Review Report** — what's overdue and due soon, sorted by urgency
- **Audit trail** — permanent, tamper-proof record of every compliance update
- **Readiness trend** — 8-week chart showing compliance improving over time
- **Inspection Pack** — one-click printable summary to hand to an inspector
- **Role-based access** — Admin, Staff, and Visitor (read-only) roles
- **Visitor logins** — temporary, expiring access for CQC inspectors and external reviewers

---

## Pricing

- **£75 + VAT per month** per CQC-registered location
- **20% discount** for registered charities
- **90-day free trial** — no credit card required, full access from day one
- Founding Member rate: beta customers who join during the trial period lock in **£60 + VAT per month** in return for feedback

---

## Launch context

AlwaysReady is not yet publicly launched. The platform is in beta. Launch is tied to CQC publishing the new Adult Social Care Assessment Framework — expected in late 2026. The demo environment is live now at app.alwaysready.uk/demo and is the primary route for prospects to explore the platform.

KLOEs in the current platform are based on the CQC draft adult social care assessment framework (March 2026). Some structural updates may be needed once the final framework is published.

---

## Tone of voice

- **Plain English** — no jargon, no corporate speak
- **Warm but professional** — this is a tool for people who carry real responsibility; treat them as intelligent adults
- **Reassuring** — compliance is stressful; AlwaysReady should feel like a calm, organised colleague
- **Direct** — say what it does and why it matters; don't oversell
- **Never clinical** — AlwaysReady is a governance tool, not a clinical system. No resident-specific care content, ever.

---

## Brand

- **Primary colour:** deep teal — `#014D4E`
- **Accent:** gold — `#ffd700`
- **Background:** warm off-white — `#faf9f6`
- **Font:** system sans-serif stack (clean, readable)
- **Logo:** AlwaysReady wordmark with gold tick/checkmark device

---

## Key URLs

- **Marketing site:** alwaysready.uk (hosted on Netlify, auto-deploys from GitHub: ethna-p/alwaysready-marketing)
- **Platform / app:** app.alwaysready.uk (hosted on Vercel, auto-deploys from GitHub: ethna-p/alwaysready-inspection-readiness-platform)
- **Demo:** app.alwaysready.uk/demo
- **Legal:** alwaysready.uk/legal

---

## What the marketing site contains

- Home page (index.html)
- About page
- How it works page
- Pricing page
- Blog (~19 published posts on CQC compliance topics, with ~10 more planned)
- Resources page
- Contact page
- Legal page (privacy policy, terms)
- Waitlist page (start-free-trial.html)
- Demo redirect page

---

## Important constraints

- Never edit or touch the platform app (alwaysready-inspection-readiness-platform) from this project
- Never commit secrets or credentials to GitHub
- Never write clinical or resident-specific content
- All copy should be reviewed by AJ before publishing
- A GDPR Data Processing Agreement (DPA) is being drafted — do not make claims about the DPA being in place until confirmed

---

*Brief written July 2026. Update as the platform and launch timeline evolve.*
