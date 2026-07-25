-- Migration: Evidence notes curation
-- Reviewed all evidence_notes in klo_checklist_items across all service types.
-- Changes: 7 distinct note values corrected across 9 UPDATE statements.
-- Issues addressed:
--   (a) Specific assessment tool names CQC does not mandate (MUST, TILE/TILEO)
--   (b) Frequency requirements CQC does not mandate (monthly, annual, 12 months)
--   (c) Factually obsolete qualification framework reference (QCF → replaced by RQF in 2015)
-- Approach: WHERE clauses match old evidence_notes text exactly, so only affected rows change.
-- Notes that already differ by service type are corrected independently.

-- ─────────────────────────────────────────────
-- SAF-SC-01  (Nursing Home, Residential Care Home, Dual-Registered — both sub-services)
-- Reason: 'monthly trend review minutes' imposes a frequency CQC does not mandate.
--         The Homecare, ECH, and other service-type versions are unaffected (different note).
-- ─────────────────────────────────────────────
UPDATE public.klo_checklist_items
SET evidence_notes = $$Incident log; trend review records; action log$$
WHERE ref = $$SAF-SC-01$$
  AND evidence_notes = $$Incident log; monthly trend review minutes; action log$$;

-- ─────────────────────────────────────────────
-- EFF-EB-01  (Nursing Home + Dual-Registered Nursing sub-service)
-- Reason: MUST (Malnutrition Universal Screening Tool) is a specific tool; CQC requires
--         nutrition screening but does not mandate MUST specifically.
-- ─────────────────────────────────────────────
UPDATE public.klo_checklist_items
SET evidence_notes = $$Nutrition screening records; dietitian referrals where indicated$$
WHERE ref = $$EFF-EB-01$$
  AND evidence_notes = $$MUST screening records; dietitian referrals$$;

-- ─────────────────────────────────────────────
-- EFF-EB-01  (Residential Care Home + Dual-Registered Residential sub-service)
-- Reason: Same MUST issue; slightly longer variant of the note.
-- ─────────────────────────────────────────────
UPDATE public.klo_checklist_items
SET evidence_notes = $$Nutrition screening records; referrals to dietitian where indicated; monitoring documentation$$
WHERE ref = $$EFF-EB-01$$
  AND evidence_notes = $$MUST screening records; referrals to dietitian where indicated; monitoring documentation$$;

-- ─────────────────────────────────────────────
-- SAF-MR-02  (Residential Care Home + Dual-Registered Residential sub-service)
-- Reason: TILE/TILEO is an HSE framework that CQC does not mandate by name.
--         The Nursing Home version is unaffected (different note, no TILE/TILEO).
-- ─────────────────────────────────────────────
UPDATE public.klo_checklist_items
SET evidence_notes = $$Moving and handling risk assessments; manual handling care plans; equipment service records$$
WHERE ref = $$SAF-MR-02$$
  AND evidence_notes = $$TILE/TILEO risk assessments; moving and handling care plans; equipment service records$$;

-- ─────────────────────────────────────────────
-- SAF-SG-01  (Residential Care Home + Dual-Registered Residential sub-service)
-- Reason: 'reviewed within 12 months' imposes a policy review frequency CQC does not mandate.
--         The Nursing Home version is unaffected (different note, no frequency).
-- ─────────────────────────────────────────────
UPDATE public.klo_checklist_items
SET evidence_notes = $$Safeguarding policy with current review date; sign-off record; staff awareness evidence$$
WHERE ref = $$SAF-SG-01$$
  AND evidence_notes = $$Safeguarding policy reviewed within 12 months; sign-off record; staff awareness evidence$$;

-- ─────────────────────────────────────────────
-- WEL-GM-04  (Homecare Agency)
-- Reason: 'evidence of annual review' imposes a review frequency CQC does not mandate.
--         Note differs from ECH (which adds a telecare protocol clause) so updated separately.
-- ─────────────────────────────────────────────
UPDATE public.klo_checklist_items
SET evidence_notes = $$Business continuity plan; evidence of review; evidence of plan being activated or tested$$
WHERE ref = $$WEL-GM-04$$
  AND evidence_notes = $$Business continuity plan; evidence of annual review; evidence of plan being activated and tested$$;

-- ─────────────────────────────────────────────
-- WEL-GM-04  (Extra Care Housing)
-- Reason: Same 'annual review' frequency imposition; ECH note adds telecare protocol which is retained.
-- ─────────────────────────────────────────────
UPDATE public.klo_checklist_items
SET evidence_notes = $$Business continuity plan; evidence of review; evidence of plan being activated or tested; telecare system failure protocol$$
WHERE ref = $$WEL-GM-04$$
  AND evidence_notes = $$Business continuity plan; evidence of annual review; evidence of plan being activated or tested; telecare system failure protocol$$;

-- ─────────────────────────────────────────────
-- WEL-IL-02  (Homecare Agency + Extra Care Housing — same note on both)
-- Reason: QCF (Qualifications and Credit Framework) was abolished and replaced by the RQF
--         (Regulated Qualifications Framework) in October 2015. The note is factually wrong.
--         Residential/Nursing/Dual-Registered versions (suggestion scheme focus) are unaffected.
-- ─────────────────────────────────────────────
UPDATE public.klo_checklist_items
SET evidence_notes = $$Staff training and development plans; evidence of relevant qualifications pursued or completed; supervision records identifying development needs$$
WHERE ref = $$WEL-IL-02$$
  AND evidence_notes = $$Staff training and development plans; evidence of QCF enrolment or completion; supervision records identifying development needs$$;
