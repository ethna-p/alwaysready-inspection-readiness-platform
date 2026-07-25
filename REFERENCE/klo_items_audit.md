# klo_items Audit Report
# Cross-reference: Database seed vs CQC Draft Assessment Framework ASC v9
# Date: 2026-07-25

## Method

The 24 KLOEs in the SQL migration were compared line-by-line against the
CQC framework converted from DOCX to Markdown. The CQC document uses
bullet-point lists for rating characteristics; the database stores these
as continuous prose by joining bullets with spaces. Content fidelity was
assessed independently of this structural conversion.

Rating categories used in this report:
- MATCH: text is identical (accounting for bullet→prose conversion)
- PARTIAL: text is present and accurate but has minor formatting or
  omission differences
- MISMATCH: text differs substantively
- FABRICATED: content not present in the CQC framework

---

## SAFE — 7 KLOEs

---

KLOE: Safety culture
Key Question: Safe

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All nine bullet points from the CQC Good descriptor
are faithfully reproduced as continuous prose with no additions, omissions,
or paraphrasing.

---

KLOE: Managing risks during care and treatment
Key Question: Safe

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All ten bullet points reproduced faithfully. Content
is identical to the CQC source.

---

KLOE: Safe systems, pathways and transitions
Key Question: Safe

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All eight bullet points reproduced faithfully.

---

KLOE: Safeguarding
Key Question: Safe

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All fourteen bullet points reproduced faithfully,
including the Deprivation of Liberty Safeguards, online safety, and
multi-agency safeguarding arrangement bullets.

---

KLOE: Safe environments and infection prevention and control
Key Question: Safe

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All eleven bullet points reproduced faithfully.

---

KLOE: Safe staffing
Key Question: Safe

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All eight bullet points reproduced faithfully.

---

KLOE: Safe medicines and treatments
Key Question: Safe

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All eleven bullet points reproduced faithfully,
including the STOMP/STAMP bullet, controlled drugs bullet, and PRN
protocol bullet.

---

## EFFECTIVE — 4 KLOEs

---

KLOE: Assessing needs
Key Question: Effective

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All nine bullet points reproduced faithfully.

---

KLOE: Evidence-based care and equitable outcomes
Key Question: Effective

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: PARTIAL — Content is accurate but one minor formatting
difference exists. The CQC document reads:

  CQC: "People understand how current 'good practice' is relevant to
  their outcomes..."

  DB:  "People understand how current good practice is relevant to their
  outcomes..."

The database omits the single-quotation marks around 'good practice'.
All ten bullet points are otherwise reproduced with identical wording.
No content is paraphrased or fabricated.

---

KLOE: Supporting people to live healthier lives
Key Question: Effective

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All six bullet points reproduced faithfully.

---

KLOE: Consent to care and treatment
Key Question: Effective

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: PARTIAL — Content is accurate but the CQC source document
contains a stray hyphen that the database correctly removes. The CQC
document reads:

  CQC: "...rights under the Mental Capacity Act 2005 -, their rights
  under the Equality Act 2010..."

  DB:  "...rights under the Mental Capacity Act 2005, their rights under
  the Equality Act 2010..."

The database removes the erroneous standalone hyphen from the CQC
document. This is a correction of a typo in the source, not an error.
All nine bullet points are otherwise reproduced with identical wording.

---

## CARING — 3 KLOEs

---

KLOE: Kindness, compassion and dignity
Key Question: Caring

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All five bullet points reproduced faithfully.

---

KLOE: Person-centred care
Key Question: Caring

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All eight bullet points reproduced faithfully.

---

KLOE: Independence, choice and control
Key Question: Caring

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All fifteen bullet points reproduced faithfully,
including the end of life, advance decisions, and visiting restrictions
bullets.

---

## RESPONSIVE — 4 KLOEs

---

KLOE: Care provision, integration and continuity
Key Question: Responsive

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All five bullet points reproduced faithfully.

---

KLOE: Listening to and responding to feedback
Key Question: Responsive

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All seven bullet points reproduced faithfully.

---

KLOE: Timely and equitable access
Key Question: Responsive

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: PARTIAL — Content is accurate but the database corrects a
punctuation error present in the CQC source document. The CQC document
reads:

  CQC: "...in a way that works for them. which promotes equality,
  removes barriers or delays and protects their rights."

  DB:  "...in a way that works for them, which promotes equality,
  removes barriers or delays and protects their rights."

The CQC source has a period followed by a lowercase "which" (likely a
formatting artifact from the DOCX conversion). The database renders this
as a comma, which is grammatically correct. All six bullet points are
otherwise reproduced with identical wording.

---

KLOE: Equity in experiences
Key Question: Responsive

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All ten bullet points reproduced faithfully,
including the Accessible Information Standard, British Sign Language,
and interpreting/translation bullets.

---

## WELL-LED — 6 KLOEs

---

KLOE: Strategic direction
Key Question: Well-Led

TITLE: MATCH
WORDING: MATCH — Note: the CQC document omits the bold formatting on
this KLOE question (unlike other Well-Led KLOEs) but the text is
identical.
RATING_GOOD: MATCH — All seven bullet points reproduced faithfully.

---

KLOE: Workforce equity and culture
Key Question: Well-Led

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: PARTIAL — The database omits the final sentence of the last
Good bullet point. The CQC document reads (last bullet, final sentence):

  CQC: "...There is support if people are struggling at work. This has
  a positive impact on the care they deliver to people."

  DB:  "...There is support if people are struggling at work."

The sentence "This has a positive impact on the care they deliver to
people" is absent from the database. This is a substantive omission,
though not a fabrication. All preceding content in the twelve other
bullet points is faithfully reproduced.

---

KLOE: Capable and compassionate leaders
Key Question: Well-Led

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All nine bullet points reproduced faithfully.

---

KLOE: Governance and management
Key Question: Well-Led

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All ten bullet points reproduced faithfully.

---

KLOE: Partnerships and communities
Key Question: Well-Led

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All four bullet points reproduced faithfully.

---

KLOE: Improvement, innovation and learning
Key Question: Well-Led

TITLE: MATCH
WORDING: MATCH
RATING_GOOD: MATCH — All six bullet points reproduced faithfully.

---

## SUMMARY

### Counts

| Field        | Exact match | Partial match | Mismatch | Fabricated |
|--------------|-------------|---------------|----------|------------|
| title        | 24 / 24     | 0 / 24        | 0 / 24   | 0 / 24     |
| wording      | 24 / 24     | 0 / 24        | 0 / 24   | 0 / 24     |
| rating_good  | 20 / 24     | 4 / 24        | 0 / 24   | 0 / 24     |

### Partial matches in rating_good (4 KLOEs)

1. Evidence-based care and equitable outcomes (Effective)
   Minor: quotation marks omitted from 'good practice'.

2. Consent to care and treatment (Effective)
   Minor: stray hyphen present in CQC source ("Act 2005 -,") correctly
   removed by the database.

3. Timely and equitable access (Responsive)
   Minor: CQC source punctuation error (period before lowercase "which")
   correctly rendered as a comma in the database.

4. Workforce equity and culture (Well-Led)
   Substantive: final sentence of last Good bullet omitted from database.
   Missing text: "This has a positive impact on the care they deliver
   to people."

### Overall verdict

The klo_items data is TRUSTWORTHY. All 24 KLOE titles and all 24 KLOE
wording questions are verbatim matches against the CQC framework. The
rating_good content for all 24 KLOEs is drawn directly from the CQC
source — the previous session accurately converted bullet-point lists
to prose by joining them with spaces, without paraphrasing or
fabricating any content.

No content is invented or fabricated anywhere in the rating_good column.
The four partial matches represent two trivial formatting differences
(missing quotation marks, corrected CQC typo), one corrected punctuation
error, and one omitted sentence. None of these indicate unreliable data.

The only correction worth making is adding the missing sentence to the
Workforce equity and culture Good descriptor:
  "This has a positive impact on the care they deliver to people."
This should be appended after "There is support if people are struggling
at work." in the rating_good field for that KLOE.

NOTE: This audit covers only the three fields specified (title, wording,
rating_good). The rating_ri (Requires Improvement) field for "Evidence-
based care and equitable outcomes" contains a condensed version of the
CQC bullets that omits four bullets about nutrition (insufficient food/
drink, unbalanced diet, not involving people in meal planning, not
accessing dietary specialists). This is outside the audit scope but
worth correcting if completeness of rating_ri text is required.
