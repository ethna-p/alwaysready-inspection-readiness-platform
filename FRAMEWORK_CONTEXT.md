# AlwaysReady — CQC Framework Context

**Status:** Permanent reference document. Do not delete. Update only when the final framework is published.
**Last updated:** 20 July 2026

---

## The framework this platform uses

AlwaysReady is built on the **CQC Adult Social Care sector-differentiated assessment framework (draft)**.

This is **not** the Single Assessment Framework (SAF). The SAF is CQC's cross-sector framework used for NHS and other providers. The adult social care sector has its own differentiated framework, and that is what this platform is built around.

The authoritative reference for all framework content in this build is:

```
REFERENCE/AlwaysReady_CQC_KLOE_KeyQuestion_Mapping.csv
```

The last row of that CSV explicitly states: *"Adult social care assessment framework – draft1"*

No other document, website, or CQC publication should override this file unless AJ explicitly instructs a full framework revision (see Publication Timeline below).

---

## The 5 key questions (STABLE — will not change)

CQC uses the same 5 key questions across all provider types. These are fixed and will remain in the final published framework:

1. **Safe**
2. **Effective**
3. **Caring**
4. **Responsive**
5. **Well-Led**

---

## The 24 KLOEs (DRAFT — subject to change at publication)

The framework contains 24 Key Lines of Enquiry (KLOEs), each sitting under one of the 5 key questions. These are in draft as of July 2026. The titles and their assignment below are taken verbatim from the authoritative CSV.

### Safe (7 KLOEs)
1. Safety culture
2. Managing risks during care and treatment
3. Safe systems, pathways and transitions
4. Safeguarding
5. Safe environments and infection prevention and control
6. Safe staffing
7. Safe medicines and treatments

### Effective (4 KLOEs)
8. Assessing needs
9. Evidence-based care and equitable outcomes
10. Supporting people to live healthier lives
11. Consent to care and treatment

### Caring (3 KLOEs)
12. Kindness, compassion and dignity
13. Person-centred care
14. Independence, choice and control

### Responsive (4 KLOEs)
15. Care provision, integration and continuity
16. Listening to and responding to feedback
17. Timely and equitable access
18. Equity in experiences

### Well-Led (6 KLOEs)
19. Strategic direction
20. Workforce equity and culture
21. Capable and compassionate leaders
22. Governance and management
23. Partnerships and communities
24. Improvement, innovation and learning

---

## 'I' statements

The 'I' statements (service user perspective statements aligned to each KLOE) are held in a separate CSV in the REFERENCE folder. 22 of the 24 KLOEs have 'I' statement text; the Well-Led KLOEs do not yet have 'I' statements in the draft.

'I' statements are stable and will not change between now and publication.

---

## Publication timeline and what happens next

CQC is expected to publish the **final** Adult Social Care sector-differentiated framework in **Autumn 2026**.

**Before the AlwaysReady website and platform go live**, the following must happen:

1. Read the final published framework in full.
2. Compare the final KLOE titles to the 24 titles in the authoritative CSV.
3. Identify any KLOEs that have been renamed, moved between key questions, split, merged, or removed.
4. Write corrective SQL migrations for any klo_items and klo_checklist_items that need updating.
5. Reassess all 11 service type checklists to confirm they remain accurate against the final framework.
6. Update this document with the finalised KLOE list and remove the DRAFT notice.

**What will NOT change:** The 5 key questions and the 'I' statements are confirmed stable.

---

## The 11 service types in this build

All 11 service types have checklist content built against the 24 draft KLOEs above:

1. Residential Care Home
2. Nursing Home
3. Dual-Registered (Residential + Nursing)
4. ARBD Specialist Care Home
5. Homecare Agency
6. Extra Care Housing
7. Shared Lives Scheme
8. Supported Living
9. Specialist College
10. Residential Rehabilitation
11. Community Drug and Alcohol Service

Sub-services with additional checklist items: **Dementia**, **Autism**

---

## Common errors to avoid

These wrong terms have appeared in previous drafts. Never use them in this build:

| Wrong (do not use) | Correct |
|---|---|
| Single Assessment Framework / SAF | Adult Social Care sector-differentiated framework |
| Medicines management | Safe medicines and treatments |
| Assessment and care planning | Assessing needs |
| Training and development | Safe staffing (training content belongs under Safe staffing) |
| Mental capacity and consent | Consent to care and treatment |
| Health and wellbeing | Supporting people to live healthier lives |
| Compassionate care | Kindness, compassion and dignity |
| Responding to people's needs | Care provision, integration and continuity |
| Complaints and feedback | Listening to and responding to feedback |
| Person-centred culture | Person-centred care (under Caring, not Well-Led) |

---

## Platform vs app — terminology

AJ asked: should this be called a *platform* or an *app*?

**Use "platform" for B2B and regulatory contexts** (e.g., "AlwaysReady Inspection Readiness Platform"). This signals a professional tool for organisations, not a consumer product.

**Use "app" informally** when describing it to care staff or in everyday conversation — especially in the context of the PWA (home screen installation), where "app" is the language users understand.

Both are correct. The marketing site and formal documents should say *platform*; user-facing copy (e.g., PWA install guidance) can say *app*.

---

## Notes on the klo_items database table

The `klo_items` table in Supabase is seeded from the authoritative CSV via migration `20260714000005_klo_items.sql`. This migration has been independently verified: all 24 KLOE titles match the CSV exactly.

Each klo_item contains:
- `title` — exact KLOE title from the CSV
- `wording` — the 'I' statement text (where available)
- `scope` — scope note from the CSV (where available)
- `key_question_id` — foreign key to the `key_questions` table
- `rating_outstanding`, `rating_good`, `rating_ri`, `rating_inadequate` — full rating characteristic text verbatim from the CSV

---

*This document must be read at the start of any session involving framework content, checklist items, or KLOE references.*
