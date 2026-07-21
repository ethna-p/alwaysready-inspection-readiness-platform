# Instructions for Marketing Site Claude

**Read this document at the start of every session working on the AlwaysReady marketing website.**

---

## What AlwaysReady is

AlwaysReady is the governance and inspection-readiness platform that helps providers transition smoothly from the Single Assessment Framework to the new 2026 KLOE-based model — keeping evidence organised, mapped, and inspection-ready at all times.

It is built on the **CQC Adult Social Care sector-differentiated assessment framework (draft)** — not the Single Assessment Framework (SAF). The SAF is CQC's cross-sector framework used for NHS and other providers. Do not conflate the two.

The platform covers **5 key questions** (Safe, Effective, Caring, Responsive, Well-Led) underpinned by **24 KLOEs** specific to adult social care.

**Important caveat for all marketing copy:** These KLOEs are in draft form and are subject to refinement following CQC consultation. The final framework may include adjustments based on stakeholder feedback. Do not present the framework as final or fixed.

---

## Files to read at the start of every session

The platform build folder is mounted and available to you. Read these files before writing any marketing copy or making any changes:

1. `FRAMEWORK_CONTEXT.md` — the authoritative reference for the CQC framework, KLOE titles, key questions, and what will/won't change at publication
2. `MARKETING_HANDOFF_PWA.md` — handoff notes from the platform build covering the PWA feature and framework accuracy rules for marketing copy
3. `PROJECT_BRIEF.md` — the full platform build spec (read this to understand what has actually been built before making claims about features)

---

## Framework accuracy rules

- Never refer to the framework as the "Single Assessment Framework" or "SAF"
- Never imply the platform follows the same framework used by NHS trusts
- Always describe it as the CQC Adult Social Care sector-differentiated framework
- The 5 key questions are stable and confirmed. The 24 KLOEs are in draft.
- Do not make claims about specific KLOE titles or content without checking `FRAMEWORK_CONTEXT.md` first

---

## Netlify deploy rules — non-negotiable

**Never commit directly to `main` or any branch configured as the Netlify production branch.**

All work must go to a preview branch and deploy to a Netlify preview URL only. Do not trigger a production deploy under any circumstances unless AJ explicitly says "deploy to production" or "go live". This applies to every session, every commit, without exception.

---

## Access rules for the platform folder

You have read access to the platform build folder for context. You must **never**:

- Edit, modify, or delete any file in the platform build folder
- Commit or push anything to the platform GitHub repository
- Make any change that touches the inspection readiness platform codebase

Your job is to read from the platform folder to stay informed. All your work goes to the marketing site repo only.

---

## Who you are working for

AJ is not a developer. Write clearly, avoid jargon, and explain anything technical in plain English before acting on it. Always confirm what you intend to do before making changes to the marketing site.
