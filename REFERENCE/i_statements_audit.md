# AlwaysReady People's Voice — "I" Statements Audit

**Date:** 2026-07-25  
**Source document:** `REFERENCE/CQC_Draft_Assessment_Framework_ASC_v9.docx`  
**Migration file:** `supabase/migrations/20260719000002_peoples_voice.sql`

---

## Methodology

The Word document was converted to Markdown via `pandoc` and the raw text was also
extracted using `python-docx` to verify exact Unicode characters (particularly dashes).
Every database statement was compared word-for-word against the corresponding paragraph
in the framework.

---

## Safe — 5 statements (framework has 6; #4 excluded)

| # | Status | Database text |
|---|--------|---------------|
| 1 | **MATCH** | "I feel safe and am supported to understand and manage any risks." |
| 2 | **MATCH** | "I know what to do and who I can contact when I realise that things might be at risk of going wrong or my health condition may be worsening." |
| 3 | **MATCH** | "I can plan ahead and stay in control in emergencies. I know who to contact and how to contact them and people follow my advance wishes and decisions as much as possible." |
| 4 | **EXCLUDED** — see verdict below | — |
| 5 | **MATCH** | "When I move between services, settings or areas, there is a plan for what happens next and who will do what, and all the practical arrangements are in place." |
| 6 | **MATCH** | "I have considerate support delivered by competent people." |

---

## Effective — 4 statements (all in framework)

| # | Status | Database text |
|---|--------|---------------|
| 1 | **MATCH** | "I can get information and advice about my health, care and support and how I can be as well as possible – physically, mentally and emotionally." |
| 2 | **MATCH** | "I have care and support that is co-ordinated, and everyone works well together and with me." |
| 3 | **MATCH** | "I am supported by people who listen carefully, so they know what matters to me and how to support me to live the life I want." |
| 4 | **MATCH** | "I can live the life I want and do the things that are important to me as independently as possible." |

**Note on Effective #1:** `pandoc` renders the en dash as `--` in Markdown. Direct extraction
from the Word document confirms the original character is `–` (U+2013 EN DASH), which is
exactly what the database stores. The wording is verbatim.

---

## Caring — 7 statements (all in framework)

| # | Status | Database text |
|---|--------|---------------|
| 1 | **MATCH** | "I am treated with respect and dignity." |
| 2 | **MATCH** | "I am supported to manage my health in a way that makes sense to me." |
| 3 | **MATCH** | "I am in control of planning my care and support. If I need help with this, people who know and care about me are involved." |
| 4 | **MATCH** | "I can keep in touch and meet up with people who are important to me, including family, friends and people who share my interests, identity and culture." |
| 5 | **MATCH** | "I can live the life I want and do the things that are important to me as independently as possible." |
| 6 | **MATCH** | "I am supported to plan ahead for important changes in life that I can anticipate." |
| 7 | **MATCH** | "I am supported to make decisions by people who see things from my point of view, with concern for what matters to me, my wellbeing and health." |

---

## Responsive — 3 statements (framework has 4; #3 excluded)

| # | Status | Database text |
|---|--------|---------------|
| 1 | **MATCH** | "I have care and support that is co-ordinated, and everyone works well together and with me." |
| 2 | **MATCH** | "I can get information and advice that is accurate, up to date and provided in a way that I can understand." |
| 3 | **EXCLUDED** — see verdict below | — |
| 4 | **MATCH** | "I can get information and advice that helps me think about and plan my life." |

---

## Framework statements missing from the database

**None.** Every authentic TLAP statement present in the framework is accounted for in the
database. The only statements absent from the database are the two that the framework
itself annotates as non-authentic.

---

## Verdict on the two excluded statements

### Safe #4 — excluded from database

Framework text (verbatim from Word document):

> "If my treatment, including medication, must change, I know why and am involved in the
> decision."

The framework labels this inline: **(Not authentic TLAP statement)**

**Verdict: The exclusion is CORRECT and properly justified by the source document itself.**

### Responsive #3 — excluded from database

Framework text (verbatim from Word document):

> "I am encouraged and enabled to feed back about my care in ways that work for me and I
> know how it was acted on."

The framework labels this inline: **(Not authentic TLAP statement)**

**Verdict: The exclusion is CORRECT and properly justified by the source document itself.**

---

## Overall verdict

**All 19 database statements PASS.**

- Wording: Every statement is verbatim against the Word document source, including the
  en dash in Effective #1.
- Key question assignment: All statements are assigned to the correct key question
  (Safe / Effective / Caring / Responsive).
- Statement order: The `statement_order` values correctly reflect the ordinal position
  within the framework, with gaps at Safe #4 and Responsive #3 exactly where the
  non-authentic statements sit.
- Coverage: No authentic TLAP statement from the framework is missing from the database.
- Exclusions: Both excluded statements (Safe #4 and Responsive #3) are annotated as
  "Not authentic TLAP statement" directly in the CQC framework document, confirming the
  migration comment is accurate.

The People's Voice module's "I" statements are a faithful, complete, and correctly
attributed representation of the TLAP statements published in the CQC Draft Assessment
Framework ASC v9.
