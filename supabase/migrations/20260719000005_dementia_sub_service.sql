-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Dementia sub-service checklist items
--
-- These items appear only for organisations that have enabled the 'Dementia'
-- sub-service via the Account page. They are seeded per service type so that
-- wording can be tailored in future without a schema change.
--
-- Current service types covered: Residential Care Home, ARBD Specialist Care Home.
-- Items will be added for remaining service types as their Core content is built.
--
-- All items use sub_service = 'Dementia' and display_order 50+ so they appear
-- after Core items within each KLOE's checklist.
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- RESIDENTIAL CARE HOME — Dementia sub-service items
-- ════════════════════════════════════════════════════════════════════════════

-- ── SAFE ─────────────────────────────────────────────────────────────────────

-- DEM-SAF-01: Wandering / absconding risk
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-SAF-01$$, $$Dementia$$,
  $$Wandering and absconding risk assessment is in place for each resident living with dementia; the management plan balances safety with dignity and independence$$,
  $$Reg 12$$,
  $$Individual wandering / absconding risk assessments; management plans; door security records; evidence of plan reviewed following any incident$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$;

-- DEM-SAF-02: Covert medicines
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-SAF-02$$, $$Dementia$$,
  $$Where a resident lacks capacity to consent to taking medicines, a covert administration protocol is in place, documented, authorised by the prescriber and reviewed regularly$$,
  $$Reg 12$$,
  $$Covert medicine protocols per resident; MCA best interest decision records; prescriber authorisation; MAR / EMAR showing covert administration$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$;

-- DEM-SAF-03: Dementia-specific staff training
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-SAF-03$$, $$Dementia$$,
  $$All staff receive dementia-specific training covering: types of dementia, communication approaches, behaviour support and person-centred care; training is refreshed regularly$$,
  $$Reg 18$$,
  $$Dementia training matrix; training certificates or records; evidence of refresher training; any bespoke dementia training programme$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$;

-- ── EFFECTIVE ─────────────────────────────────────────────────────────────────

-- DEM-EFF-01: Cognitive baseline in care plans
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-EFF-01$$, $$Dementia$$,
  $$Care plans document the type and date of dementia diagnosis, current cognitive baseline (e.g. MMSE or ACE-R score) and any changes in cognition; changes are acted upon and escalated appropriately$$,
  $$Reg 9$$,
  $$Care plans with dementia diagnosis details; cognitive assessment records; evidence of escalation when cognition deteriorates (e.g. GP referral, medication review)$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$;

-- DEM-EFF-02: SALT / swallowing assessment
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-EFF-02$$, $$Dementia$$,
  $$SALT assessment is offered to residents living with dementia who present with dysphagia or swallowing difficulties; outcomes are documented and followed in care plans and meal preparation$$,
  $$Reg 14$$,
  $$SALT referral records; SALT assessment outcomes; modified diet / texture guidance in care plans; evidence of kitchen and care staff following SALT recommendations$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$;

-- DEM-EFF-03: MCA / DoLS for dementia
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-EFF-03$$, $$Dementia$$,
  $$MCA assessments are completed for residents living with dementia where capacity is in doubt; capacity is assessed decision-specifically and reviewed when cognition changes; DoLS applications are submitted and tracked to expiry$$,
  $$Reg 11$$,
  $$MCA assessment records per decision; best interest meeting minutes; DoLS application and authorisation records; system for tracking DoLS expiry dates$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$;

-- DEM-EFF-04: Dementia-friendly environment
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-EFF-04$$, $$Dementia$$,
  $$The environment supports residents living with dementia through evidence-based design features including contrasting colours, picture-format signage, sensory areas and room individualisation$$,
  $$Reg 15$$,
  $$Environmental audit against dementia-friendly design principles; photographs or walkthrough evidence; evidence of adaptations made in response to residents' needs$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$;

-- ── CARING ───────────────────────────────────────────────────────────────────

-- DEM-CAR-01: Life history / This Is Me
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-CAR-01$$, $$Dementia$$,
  $$A life history document ("This Is Me" or equivalent) is completed for each resident living with dementia and is accessible to all staff on shift; it is updated as new information is shared$$,
  $$Reg 9$$,
  $$Completed "This Is Me" or life history documents; evidence that documents are accessible at the point of care (e.g. in room, on care system); evidence of updates over time$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$;

-- DEM-CAR-02: Adapted activities
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-CAR-02$$, $$Dementia$$,
  $$Activities are adapted to match the cognitive ability and stage of dementia of each resident; individual activity plans are reviewed regularly and include cognitive stimulation where appropriate$$,
  $$Reg 9$$,
  $$Individual activity plans; evidence of cognitive-ability-matched activities (e.g. reminiscence, sensory, music); activity review records; SOFI observations or equivalent$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$;

-- ── RESPONSIVE ───────────────────────────────────────────────────────────────

-- DEM-RES-01: Communication needs
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-RES-01$$, $$Dementia$$,
  $$Communication needs for residents living with dementia are documented in care plans; staff use adapted techniques including simple language, non-verbal cues and validation approaches$$,
  $$Reg 9$$,
  $$Communication needs assessments in care plans; evidence of adapted communication in observation records or staff notes; staff training records on dementia communication$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$;

-- ── WELL-LED ─────────────────────────────────────────────────────────────────

-- DEM-WEL-01: Dementia lead / champion
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-WEL-01$$, $$Dementia$$,
  $$A dementia lead or champion is in post; they support staff development, promote best practice and monitor the quality of dementia care within the service$$,
  $$Reg 17$$,
  $$Named dementia lead / champion; evidence of their role in training, supervision or quality monitoring; any dementia audit or improvement records they have produced$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$;

-- DEM-WEL-02: Admiral Nurse / memory clinic links
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$DEM-WEL-02$$, $$Dementia$$,
  $$The service has established links with specialist dementia services including memory clinic, Admiral Nurse or Dementia UK; these are accessed when residents' dementia-related needs escalate$$,
  $$Reg 17$$,
  $$Referral pathways to memory clinic / Admiral Nurse; correspondence or meeting records with specialist services; evidence of referrals made and outcomes followed up$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$;


-- ════════════════════════════════════════════════════════════════════════════
-- ARBD SPECIALIST CARE HOME — Dementia sub-service items
-- Focuses on co-occurring dementia (e.g. Alzheimer's) alongside Korsakoff's,
-- which is already covered in the ARBD Core checklist.
-- ════════════════════════════════════════════════════════════════════════════

-- DEM-SAF-01 (ARBD): Wandering / absconding risk for co-occurring dementia
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-SAF-01$$, $$Dementia$$,
  $$Where a resident has co-occurring dementia alongside ARBD or Korsakoff's syndrome, a separate dementia-specific wandering and absconding risk assessment is in place alongside the standard ARBD community access risk assessment$$,
  $$Reg 12$$,
  $$Dementia-specific risk assessments (separate from ARBD community access assessment); management plans; evidence of review following any incident$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$;

-- DEM-SAF-02 (ARBD): Covert medicines
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-SAF-02$$, $$Dementia$$,
  $$Where a resident lacks capacity to consent to taking medicines, a covert administration protocol is in place, documented, authorised by the prescriber and reviewed regularly$$,
  $$Reg 12$$,
  $$Covert medicine protocols per resident; MCA best interest decision records; prescriber authorisation; MAR / EMAR showing covert administration$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$;

-- DEM-SAF-03 (ARBD): Dementia training (in addition to ARBD training)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-SAF-03$$, $$Dementia$$,
  $$Staff receive dementia-specific training (separate from ARBD and Korsakoff's training) covering co-occurring dementia types, communication approaches and person-centred dementia care$$,
  $$Reg 18$$,
  $$Dementia training records (distinct from ARBD training matrix); evidence of training covering dementia types beyond Korsakoff's; refresher records$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$;

-- DEM-EFF-01 (ARBD): Cognitive baseline — co-occurring dementia documented separately
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-EFF-01$$, $$Dementia$$,
  $$Where a resident has co-occurring dementia alongside ARBD or Korsakoff's syndrome, the dementia diagnosis type and cognitive baseline are documented separately in the support plan and reviewed when cognition changes$$,
  $$Reg 9$$,
  $$Support plans documenting co-occurring dementia diagnosis; cognitive assessment records; evidence of differentiation between Korsakoff's and other dementia types in clinical documentation$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$;

-- DEM-EFF-02 (ARBD): SALT / swallowing
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-EFF-02$$, $$Dementia$$,
  $$SALT assessment is offered to residents with dysphagia or swallowing difficulties associated with dementia; outcomes are documented and followed in support plans and meal preparation$$,
  $$Reg 14$$,
  $$SALT referral records; SALT assessment outcomes; modified diet / texture guidance; evidence of kitchen and care staff following SALT recommendations$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$;

-- DEM-EFF-03 (ARBD): MCA / DoLS — already partially covered in ARBD Core but adds dementia-specific tracking
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-EFF-03$$, $$Dementia$$,
  $$Where a resident has co-occurring dementia, MCA assessments are reviewed specifically in respect of dementia-related capacity changes (separate from ARBD capacity fluctuations); DoLS authorisations reflect both conditions$$,
  $$Reg 11$$,
  $$MCA assessments noting co-occurring dementia; DoLS records referencing both ARBD and dementia where applicable; best interest decisions addressing both conditions$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$;

-- DEM-EFF-04 (ARBD): Dementia-friendly environment
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-EFF-04$$, $$Dementia$$,
  $$The environment supports residents living with co-occurring dementia through evidence-based design features including contrasting colours, picture-format signage and sensory areas, adapted alongside existing ARBD environmental requirements$$,
  $$Reg 15$$,
  $$Environmental audit against dementia-friendly design principles; evidence of adaptations made for residents with co-occurring dementia$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$;

-- DEM-CAR-01 (ARBD): Life history / This Is Me
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-CAR-01$$, $$Dementia$$,
  $$A life history document ("This Is Me" or equivalent) is completed for each resident living with dementia and is accessible to all staff on shift; it complements the life history already held in the ARBD support plan$$,
  $$Reg 9$$,
  $$Completed "This Is Me" or life history documents; evidence accessible at point of care; evidence of updates over time$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$;

-- DEM-CAR-02 (ARBD): Adapted activities
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-CAR-02$$, $$Dementia$$,
  $$Activities for residents with co-occurring dementia are adapted to their cognitive ability and dementia stage as well as their rehabilitation stage; individual activity plans address both ARBD and dementia needs$$,
  $$Reg 9$$,
  $$Individual activity plans noting both ARBD rehabilitation stage and dementia stage; evidence of cognitive-ability-matched activities; activity review records$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$;

-- DEM-RES-01 (ARBD): Communication needs
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-RES-01$$, $$Dementia$$,
  $$Where a resident has co-occurring dementia, communication needs specific to dementia (in addition to ARBD-related communication needs) are documented and staff use adapted techniques accordingly$$,
  $$Reg 9$$,
  $$Communication needs assessments differentiating ARBD and dementia-related needs; evidence of adapted communication in support notes; relevant staff training records$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$;

-- DEM-WEL-01 (ARBD): Dementia lead
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-WEL-01$$, $$Dementia$$,
  $$A dementia lead or champion is in post (which may be the same person as the ARBD specialist lead or a separate role); they support staff in managing co-occurring dementia and promote dementia best practice$$,
  $$Reg 17$$,
  $$Named dementia lead / champion; evidence of their role in training or quality monitoring; dementia-specific audit or improvement records$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$;

-- DEM-WEL-02 (ARBD): Admiral Nurse / memory clinic links
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$DEM-WEL-02$$, $$Dementia$$,
  $$The service has established links with specialist dementia services (memory clinic, Admiral Nurse or Dementia UK) in addition to existing ARBD specialist and CMHT links; these are accessed when co-occurring dementia needs escalate$$,
  $$Reg 17$$,
  $$Referral pathways to memory clinic / Admiral Nurse; correspondence with specialist dementia services; evidence of referrals made and outcomes followed up$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$;
