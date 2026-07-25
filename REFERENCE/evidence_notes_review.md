# Evidence Notes Review
**Date:** 2026-07-25  
**Scope:** All `evidence_notes` values in `klo_checklist_items` across all service types  
**Source files reviewed:**
- `supabase/migrations/20260716000001_checklist_tables.sql` (base — Nursing Home, Residential Care Home, Dual-Registered Care Home, universal Dementia Care items)
- `supabase/migrations/20260719000008_homecare_agency.sql`
- `supabase/migrations/20260719000009_extra_care_housing.sql`
- `supabase/migrations/20260719000010_shared_lives_scheme.sql`
- `supabase/migrations/20260719000011_supported_living.sql`

**Total INSERT blocks reviewed:** 642  
**Decisions:** 628 KEEP · 14 EDIT · 0 NULL  
**Correction migration:** `supabase/migrations/20260725000002_evidence_notes_curation.sql`

---

## Criteria applied

1. Describes evidence categories a care manager can locate and show an inspector
2. Does not name specific tools CQC does not mandate (e.g. MUST, Waterlow, TILE/TILEO, CIWA-Ar)
3. Does not impose frequency requirements CQC does not mandate (e.g. "monthly", "annually", "within 12 months")
4. Does not assume a staffing model incompatible with the service type
5. Is concise and practically useful

---

## Items changed (EDIT)

### SAF-SC-01 — Safety culture
**Applies to:** Nursing Home · Residential Care Home · Dual-Registered Care Home (both sub-services)  
**Original:** `Incident log; monthly trend review minutes; action log`  
**New:** `Incident log; trend review records; action log`  
**Decision:** EDIT  
**Reason:** "monthly trend review minutes" imposes a review frequency that CQC does not mandate. The checklist item itself references monthly review (in the checklist item text), but the evidence note should describe what evidence to gather, not re-impose the frequency. Homecare, ECH, Shared Lives, and Supported Living versions are unaffected (they have different, acceptable notes).

---

### EFF-EB-01 — Evidence-based care and equitable outcomes (variant A)
**Applies to:** Nursing Home · Dual-Registered Nursing sub-service  
**Original:** `MUST screening records; dietitian referrals`  
**New:** `Nutrition screening records; dietitian referrals where indicated`  
**Decision:** EDIT  
**Reason:** MUST (Malnutrition Universal Screening Tool) is a specific assessment tool. CQC requires providers to screen for malnutrition but does not mandate the MUST tool specifically. Providers may use MUST, STAMP, MUST-Plus, or other validated tools. Generalising to "nutrition screening records" is accurate and avoids implying MUST is required.

---

### EFF-EB-01 — Evidence-based care and equitable outcomes (variant B)
**Applies to:** Residential Care Home · Dual-Registered Residential sub-service  
**Original:** `MUST screening records; referrals to dietitian where indicated; monitoring documentation`  
**New:** `Nutrition screening records; referrals to dietitian where indicated; monitoring documentation`  
**Decision:** EDIT  
**Reason:** Same MUST issue as variant A; the rest of the note is accurate and retained.

---

### SAF-MR-02 — Managing risks during care and treatment
**Applies to:** Residential Care Home · Dual-Registered Residential sub-service  
**Original:** `TILE/TILEO risk assessments; moving and handling care plans; equipment service records`  
**New:** `Moving and handling risk assessments; manual handling care plans; equipment service records`  
**Decision:** EDIT  
**Reason:** TILE/TILEO is an HSE manual handling risk assessment framework. While widely used, CQC does not mandate this specific framework by name. "Moving and handling risk assessments" is the accurate generic description. The Nursing Home version ("Moving and handling risk assessments; equipment service records") is unaffected.

---

### SAF-SG-01 — Safeguarding
**Applies to:** Residential Care Home · Dual-Registered Residential sub-service  
**Original:** `Safeguarding policy reviewed within 12 months; sign-off record; staff awareness evidence`  
**New:** `Safeguarding policy with current review date; sign-off record; staff awareness evidence`  
**Decision:** EDIT  
**Reason:** "Reviewed within 12 months" imposes a policy review cycle that CQC does not mandate by that specific frequency. CQC expects policies to be current and reviewed regularly, but the inspection team will judge currency from the review date on the document rather than applying a 12-month rule. "With current review date" captures what inspectors actually look for. The Nursing Home version is unaffected (it does not include a frequency).

---

### WEL-GM-04 — Governance and management (Homecare Agency)
**Applies to:** Homecare Agency  
**Original:** `Business continuity plan; evidence of annual review; evidence of plan being activated and tested`  
**New:** `Business continuity plan; evidence of review; evidence of plan being activated or tested`  
**Decision:** EDIT  
**Reason:** "Annual review" imposes a review frequency CQC does not mandate. CQC expects business continuity plans to be current and tested but does not set a minimum review interval. "Evidence of review" is accurate without imposing a schedule. Also corrected "and tested" to "or tested" (evidence of either activation in a real scenario or a test exercise is sufficient).

---

### WEL-GM-04 — Governance and management (Extra Care Housing)
**Applies to:** Extra Care Housing  
**Original:** `Business continuity plan; evidence of annual review; evidence of plan being activated or tested; telecare system failure protocol`  
**New:** `Business continuity plan; evidence of review; evidence of plan being activated or tested; telecare system failure protocol`  
**Decision:** EDIT  
**Reason:** Same "annual review" frequency issue as the Homecare version. The ECH-specific telecare system failure protocol clause is retained as it is a practical and legitimate evidence type for ECH settings.

---

### WEL-IL-02 — Improvement, innovation and learning (Homecare Agency + Extra Care Housing)
**Applies to:** Homecare Agency · Extra Care Housing (both have identical notes)  
**Original:** `Staff training and development plans; evidence of QCF enrolment or completion; supervision records identifying development needs`  
**New:** `Staff training and development plans; evidence of relevant qualifications pursued or completed; supervision records identifying development needs`  
**Decision:** EDIT  
**Reason:** The QCF (Qualifications and Credit Framework) was abolished and replaced by the RQF (Regulated Qualifications Framework) in October 2015. Referencing QCF is factually wrong and would cause confusion for care managers. "Relevant qualifications" is accurate and future-proof. The Residential/Nursing/Dual-Registered versions (which focus on suggestion scheme records) are unaffected.

---

## Items where "annual" or frequency was KEPT

### EFF-TD-03 — Training and development (Shared Lives Scheme)
**Note:** `Carer support visit records; visit frequency against scheme policy; annual carer appraisal or review records; evidence of actions arising from concerns raised by carers`  
**Decision:** KEEP  
**Reason:** The corresponding checklist item explicitly states "annual appraisal or review of the carer's performance and approval is completed." The evidence note mirrors what the checklist item requires. Annual carer reviews are standard regulatory practice for Shared Lives Schemes and the evidence note is internally consistent with the checklist item wording.

### WEL-GM-02 — Governance and management (Shared Lives Scheme)
**Note:** `Carer register; approval records with conditions; DBS renewal tracker; annual review completion log; placement-to-carer mapping records; evidence register is reviewed and updated regularly`  
**Decision:** KEEP  
**Reason:** The checklist item requires the register to record "last annual review" as one of its required fields. "Annual review completion log" directly evidences that element of the checklist item and is consistent with Shared Lives sector practice.

### EFF-HL-01 — Supporting people to live healthier lives (Supported Living)
**Note:** `Health action plans per person; annual health check records; evidence of follow-up on referrals and health check recommendations; GP and specialist contact records`  
**Decision:** KEEP  
**Reason:** Annual health checks for people with learning disabilities are mandated by NHS England through the GP Quality Outcomes Framework (LD QOF indicator). This is a genuine government-mandated frequency requirement. "Annual health check records" is an accurate and appropriate evidence type that inspectors will actively look for in supported living services.

---

## Notable items kept without change

The following categories of notes were reviewed and retained as accurate and appropriate:

- **SAF-SC-02 to SAF-SC-05** (Safety culture): All variants are practical and do not impose specific frequencies or tool names.
- **SAF-EI-01 to SAF-EI-07** (Environments / IPC): References to legally-required certificates (EICR, gas safety, LOLER) are correct. PEEPs are a genuine fire safety requirement.
- **SAF-MR-03 to SAF-MR-05** (Risk management): Dysphagia screening, SALT referrals, and bed rail risk assessments are all appropriate evidence types.
- **SAF-MT-01 to SAF-MT-05** (Medicines): MAR charts, CD register, fridge temperature logs, PRN protocols, covert medicines protocols — all accurate.
- **SAF-SS-01 to SAF-SS-06** (Safe staffing): NMC registration checks, DBS, supervision records — all correct.
- **EFF-EB-02 to EFF-EB-04** (Evidence-based care): Weight monitoring, outcome tracking — appropriate without tool-naming.
- **EFF-CT-04** (DoLS): DoLS tracker and authorisation dates are the correct evidence types.
- **All CAR-*, RES-*, WEL-*** items in base migration: Reviewed and found to be practical, accurate, and without problematic tool names or frequency mandates.
- **Homecare Agency SAF-SC-01**: A different (better) note from the base — "Incident reporting policy; volume and type of incidents reported; evidence of management review; learning shared at team meetings or supervision" — retained unchanged.
- **All Homecare, ECH, Shared Lives, and Supported Living items not listed above**: Reviewed and found appropriate for their service contexts.

---

## Summary

| Decision | Count (rows) |
|----------|-------------|
| KEEP     | 628         |
| EDIT     | 14          |
| NULL     | 0           |
| **Total** | **642**    |

The 14 edited rows result from 8 distinct UPDATE statements (one covers two Homecare/ECH rows with identical notes).

No notes were set to NULL. All notes reviewed were substantively useful; the issues found were precision problems (specific tool names, frequency language, obsolete qualification framework) rather than notes being wrong or useless.
