-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Nursing Home checklist content corrections
-- Date: 2026-07-19
-- Reason: Full cross-reference of all 84 Nursing Home Core items against CQC
--         published evidence statements (Good rating characteristics).
--         Four corrections identified:
--
--   1. EFF-EB-03 — "benchmarking scheme" language is Outstanding-level.
--      CQC Good says "rigorous approach to monitoring effectiveness"; the
--      Outstanding characteristic says "works towards, and achieves, relevant
--      accreditation schemes." Replaced with a clinical audit programme item
--      which directly reflects the Good-level wording.
--
--   2. SAF-SC-03 — Clinical governance meeting. CQC Good explicitly states
--      "Patient safety alerts are consistently reviewed and acted on."
--      Added this to evidence_notes so inspectors can see the connection.
--
--   3. EFF-CT-02 — MCA assessments. CQC Safeguarding Good characteristic
--      says "People are deprived of their liberty lawfully. Any potential
--      deprivation of liberty is recognised promptly and appropriate
--      authorisation is sought." DoLS added to evidence_notes.
--
--   4. WEL-IL-03 — "Clinical research / pilots" phrasing. CQC Good says
--      "Staff and leaders engage with external work, including research, and
--      embed evidence-based good practice." The emphasis in Good is on
--      embedding evidence-based good practice, not formal research
--      participation. Evidence notes softened accordingly.
--
-- All other 80 items verified as aligned with CQC Good characteristics.
-- UPDATEs apply to ALL service types sharing the same ref (intentional).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. EFF-EB-03: Replace benchmarking scheme with clinical audit programme
--    CQC Good (Evidence-based care): "There is a rigorous approach to
--    monitoring the effectiveness of people's care, support and treatment
--    and the service takes action to continuously improve it."
UPDATE public.klo_checklist_items
SET
  checklist_item = 'A clinical audit programme is in place covering key clinical areas (e.g. pressure ulcers, falls, medicines, care planning), with results reviewed and acted on',
  evidence_notes = 'Audit schedule; completed clinical audits from the last 12 months; action plans and evidence of improvements made'
WHERE ref = 'EFF-EB-03';

-- 2. SAF-SC-03: Add patient safety alerts to clinical governance evidence notes
--    CQC Good (Safety culture): "Patient safety alerts are consistently
--    reviewed and acted on, and learning from external safety incidents is
--    embedded in the delivery of care."
UPDATE public.klo_checklist_items
SET evidence_notes = 'Governance meeting minutes; standing agenda confirming review of incidents, audits and national patient safety alerts; evidence of practice change'
WHERE ref = 'SAF-SC-03';

-- 3. EFF-CT-02: Add DoLS reference to MCA assessment evidence notes
--    CQC Good (Safeguarding): "People are deprived of their liberty lawfully.
--    Any potential deprivation of liberty is recognised promptly and
--    appropriate authorisation is sought. Where applicable, the Deprivation
--    of Liberty Safeguards (DoLS) are used appropriately."
UPDATE public.klo_checklist_items
SET evidence_notes = 'Completed MCA assessments; best interests decision records; DoLS applications and authorisations where applicable'
WHERE ref = 'EFF-CT-02';

-- 4. WEL-IL-03: Soften evidence notes from research participation to sector
--    good practice engagement (more proportionate to Good-level expectation)
--    CQC Good (Improvement, innovation and learning): "Staff and leaders
--    engage with external work, including research, and embed evidence-based
--    good practice in the service."
UPDATE public.klo_checklist_items
SET evidence_notes = 'Evidence of engaging with sector good practice, external networks or guidance (e.g. NICE, NHS England safety alerts, Skills for Care, sector learning events)'
WHERE ref = 'WEL-IL-03';
