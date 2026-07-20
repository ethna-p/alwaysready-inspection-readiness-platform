-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Autism sub-service checklist items
--
-- These items appear only for organisations that have enabled the 'Autism'
-- sub-service via the Account page. They are seeded for the 9 service types
-- where autism is NOT already baked into the core checklist content.
--
-- Excluded service types (autism is core to their purpose):
--   • Supported Living
--   • Specialist College
--
-- Covered service types (9):
--   • Residential Care Home
--   • Nursing Home
--   • Dual-Registered Care Home
--   • ARBD Specialist Care Home
--   • Homecare Agency
--   • Extra Care Housing
--   • Shared Lives Scheme
--   • Residential Rehabilitation Service
--   • Community Drug and Alcohol Service
--
-- Key CQC framework for autism across ALL settings:
--   "Right support, right care, right culture" (RSRCC, 2022 updated guidance)
--   STOMP (Stopping Over-Medication of People with a learning disability,
--     autism or both)
--   Oliver McGowan Mandatory Training (rolled out 2023–2025)
--   LeDeR (Learning from Lives and Deaths) — applies where autistic people
--     are supported
--
-- All items use sub_service = 'Autism' and display_order 63+ so they appear
-- after Dementia items (51–62) within each KLOE's checklist.
-- ─────────────────────────────────────────────────────────────────────────────


-- ════════════════════════════════════════════════════════════════════════════
-- RESIDENTIAL CARE HOME
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-SAF-01$$, $$Autism$$,
  $$A risk assessment is in place for each autistic resident that addresses autism-specific risks including sensory overload, distress and meltdown, self-injurious behaviour, and elopement or absconding; the assessment is developed with the resident and, where appropriate, their family or advocate$$,
  $$Reg 12$$,
  $$Individual autism risk assessments; evidence of resident and family involvement; management plans for identified risks; evidence of review following any incident involving distress or restrictive intervention$$,
  63
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-SAF-02$$, $$Autism$$,
  $$Any restrictive practices used with autistic residents are lawful, proportionate and documented in a positive behaviour support (PBS) plan; a restrictive practice register is maintained; there is an active reduction plan; STOMP principles are applied where medication is used to manage behaviour$$,
  $$Reg 13$$,
  $$Restrictive practice register; PBS plans per resident where restrictions are used; reduction plans with targets and review dates; evidence of STOMP principles applied; external oversight records (e.g. positive behaviour support specialist involvement)$$,
  64
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic resident; it covers communication needs and preferences, sensory sensitivities, triggers for distress, interests and motivators, and what good support looks like for that person; the profile is developed with the resident and their family or advocate$$,
  $$Reg 9$$,
  $$Individual autism profiles per resident; evidence of resident and family involvement; profiles are accessible to all staff who support that person; evidence profiles are updated as needs change$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for each autistic resident who needs it; this may include AAC devices, visual schedules, social stories, Makaton, PECS, or easy-read materials; all staff who support that resident know how to use the communication tools in the resident's profile$$,
  $$Reg 9$$,
  $$Communication profiles per resident; evidence of AAC or other communication aids in use; staff training on individual communication tools; evidence that written information is available in accessible formats$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff who support autistic residents have completed Oliver McGowan Mandatory Training (Tier 1 as a minimum; Tier 2 for those providing direct care); training records are up to date; staff can describe what autism means for each person they support$$,
  $$Reg 18$$,
  $$Oliver McGowan training records for all staff; evidence of Tier 1 and Tier 2 completion as appropriate; evidence staff can describe individual autism profiles; refresher training records$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-EFF-04$$, $$Autism$$,
  $$Mental capacity assessments for autistic residents account for autism-specific communication and presentation; assessors do not conflate autism with lack of capacity; where a resident lacks capacity for a specific decision, the best interests process involves people who know the resident well$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; evidence assessors have autism awareness; evidence capacity is assumed unless evidence to the contrary; best interests records including involvement of people who know the resident$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The physical environment is adapted to meet autistic residents' sensory needs; sensory assessments are completed and reasonable adjustments are made to lighting, sound levels, textures, and smells; residents have access to quiet spaces; changes to the environment are planned with residents in advance$$,
  $$Reg 10$$,
  $$Sensory assessments per resident; evidence of environmental adjustments made; quiet space provision; evidence residents were involved in any environmental changes; staff training on sensory needs$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-CAR-02$$, $$Autism$$,
  $$Autistic residents' need for routine and predictability is respected; where changes to routine are necessary they are communicated in advance using the person's preferred communication method; unexpected changes are managed with additional support$$,
  $$Reg 10$$,
  $$Evidence of routine-based care planning; records of how changes to routine are communicated; evidence of visual schedules or advance notice tools used; staff records reflecting understanding of individual routine needs$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care and support is responsive to each autistic resident's individual communication and sensory needs; support is not one-size-fits-all; the service adjusts its approach where a resident's needs or presentation change$$,
  $$Reg 9$$,
  $$Evidence of individualised support approaches; care records reflecting individual communication and sensory needs; evidence of care plan adjustments where needs change; resident and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$The service embeds the principles of Right Support, Right Care, Right Culture (RSRCC); the culture is person-centred and not institutionalised; autistic residents are supported to have choice and control over their lives; the service exists for the people it supports, not the other way around$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles in care planning and culture; staff can describe what RSRCC means in practice; evidence of individual choice and control; evidence the service is not institutionalised in its approach; quality assurance records$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Care Home$$),
  $$Core$$, $$AUT-WEL-02$$, $$Autism$$,
  $$Governance oversight includes the restrictive practice register and reduction plan; clinical review of any psychotropic medication used to manage behaviour (STOMP); and learning from incidents involving distress, meltdown, or restrictive intervention; learning is shared with all staff$$,
  $$Reg 17$$,
  $$Restrictive practice register reviewed at governance level; STOMP medication review records; incident learning records; evidence learning is shared with staff; evidence reduction in restrictive practices over time$$,
  73
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- NURSING HOME
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-SAF-01$$, $$Autism$$,
  $$A risk assessment is in place for each autistic resident that addresses autism-specific risks including sensory overload, distress and meltdown, self-injurious behaviour, and elopement or absconding; the assessment is developed with the resident and, where appropriate, their family or advocate$$,
  $$Reg 12$$,
  $$Individual autism risk assessments; evidence of resident and family involvement; management plans for identified risks; evidence of review following any incident involving distress or restrictive intervention$$,
  63
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-SAF-02$$, $$Autism$$,
  $$Any restrictive practices used with autistic residents are lawful, proportionate and documented in a positive behaviour support (PBS) plan; a restrictive practice register is maintained; there is an active reduction plan; STOMP principles are applied where medication is used to manage behaviour$$,
  $$Reg 13$$,
  $$Restrictive practice register; PBS plans per resident where restrictions are used; reduction plans with targets and review dates; evidence of STOMP principles applied; external oversight records$$,
  64
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic resident covering communication needs and preferences, sensory sensitivities, triggers for distress, interests and motivators, and what good support looks like; the profile is developed with the resident and their family or advocate$$,
  $$Reg 9$$,
  $$Individual autism profiles per resident; evidence of resident and family involvement; profiles are accessible to all staff who support that person; evidence profiles are updated as needs change$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for each autistic resident who needs it; nursing staff are trained to adapt clinical communication for autistic patients; written information including care plans, consent forms and health information is available in accessible formats$$,
  $$Reg 9$$,
  $$Communication profiles per resident; evidence of AAC or other communication aids in use; nursing staff training on autism and communication; evidence that written information is available in accessible formats; hospital passport or communication passport$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff who support autistic residents have completed Oliver McGowan Mandatory Training (Tier 1 as a minimum; Tier 2 for those providing direct care); nursing staff understand that autistic people may present physical health symptoms atypically and that standard pain and distress assessment tools may not be valid$$,
  $$Reg 18$$,
  $$Oliver McGowan training records for all staff; evidence of Tier 1 and Tier 2 completion; evidence clinical staff are aware of atypical presentation of pain and illness in autistic people$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-EFF-04$$, $$Autism$$,
  $$Mental capacity assessments for autistic residents account for autism-specific communication and presentation; assessors do not conflate autism with lack of capacity; where a resident lacks capacity for a specific decision, the best interests process involves people who know the resident well$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; evidence assessors have autism awareness; evidence capacity is assumed unless evidence to the contrary; best interests records$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The physical environment is adapted to meet autistic residents' sensory needs; sensory assessments are completed and reasonable adjustments are made to lighting, sound levels, textures, and smells; residents have access to quiet spaces$$,
  $$Reg 10$$,
  $$Sensory assessments per resident; evidence of environmental adjustments made; quiet space provision; evidence residents were involved in any environmental changes; staff training on sensory needs$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-CAR-02$$, $$Autism$$,
  $$Autistic residents' need for routine and predictability is respected; where changes to routine or clinical care are necessary they are communicated in advance using the person's preferred communication method; clinical procedures are prepared for in advance to minimise distress$$,
  $$Reg 10$$,
  $$Evidence of routine-based care planning; records of how changes to routine and clinical procedures are communicated; evidence of visual schedules or advance notice tools; evidence of pre-procedure preparation plans where relevant$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care and support is responsive to each autistic resident's individual communication and sensory needs; clinical care is adapted to the individual's autism; the service adjusts its approach where needs or presentation change$$,
  $$Reg 9$$,
  $$Evidence of individualised support approaches; care records reflecting individual communication and sensory needs; evidence of care plan adjustments where needs change; resident and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$The service embeds the principles of Right Support, Right Care, Right Culture (RSRCC); care is person-centred; autistic residents have choice and control over their lives and their clinical care; the service actively works to prevent inappropriate placements of younger autistic adults in nursing homes$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; staff can describe what this means in practice; evidence of individual choice and control; records of any younger autistic adults and evidence their placement is appropriate and transition-planned$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$, $$AUT-WEL-02$$, $$Autism$$,
  $$Governance oversight includes the restrictive practice register and reduction plan; clinical review of psychotropic medication used to manage behaviour (STOMP); and learning from incidents involving distress or restrictive intervention; learning is shared with all staff$$,
  $$Reg 17$$,
  $$Restrictive practice register reviewed at governance level; STOMP medication review records; incident learning records; evidence learning is shared with staff$$,
  73
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- DUAL-REGISTERED CARE HOME
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-SAF-01$$, $$Autism$$,
  $$A risk assessment is in place for each autistic resident that addresses autism-specific risks including sensory overload, distress and meltdown, self-injurious behaviour, and elopement or absconding; the assessment is developed with the resident and, where appropriate, their family or advocate$$,
  $$Reg 12$$,
  $$Individual autism risk assessments; evidence of resident and family involvement; management plans for identified risks; evidence of review following any incident involving distress or restrictive intervention$$,
  63
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-SAF-02$$, $$Autism$$,
  $$Any restrictive practices used with autistic residents are lawful, proportionate and documented in a PBS plan; a restrictive practice register is maintained; there is an active reduction plan; STOMP principles are applied where medication is used to manage behaviour$$,
  $$Reg 13$$,
  $$Restrictive practice register; PBS plans per resident where restrictions are used; reduction plans with targets and review dates; evidence of STOMP principles applied; external oversight records$$,
  64
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic resident covering communication needs and preferences, sensory sensitivities, triggers for distress, interests and motivators, and what good support looks like; the profile is developed with the resident and their family$$,
  $$Reg 9$$,
  $$Individual autism profiles per resident; evidence of resident and family involvement; profiles accessible to all staff; evidence profiles are updated as needs change$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for each autistic resident who needs it; staff are trained to adapt communication for autistic residents; written information is available in accessible formats$$,
  $$Reg 9$$,
  $$Communication profiles per resident; evidence of AAC or other communication aids in use; staff training on individual communication tools; accessible written information$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff who support autistic residents have completed Oliver McGowan Mandatory Training (Tier 1 as a minimum; Tier 2 for those providing direct care); training records are up to date$$,
  $$Reg 18$$,
  $$Oliver McGowan training records for all staff; evidence of Tier 1 and Tier 2 completion as appropriate; refresher training records$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-EFF-04$$, $$Autism$$,
  $$Mental capacity assessments for autistic residents account for autism-specific communication and presentation; assessors do not conflate autism with lack of capacity; where a resident lacks capacity, the best interests process involves people who know the resident well$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; evidence assessors have autism awareness; best interests records$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The physical environment is adapted to meet autistic residents' sensory needs; sensory assessments are completed and reasonable adjustments are made to lighting, sound levels, textures, and smells; residents have access to quiet spaces$$,
  $$Reg 10$$,
  $$Sensory assessments per resident; evidence of environmental adjustments; quiet space provision; staff training on sensory needs$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-CAR-02$$, $$Autism$$,
  $$Autistic residents' need for routine and predictability is respected; where changes to routine are necessary they are communicated in advance using the person's preferred communication method$$,
  $$Reg 10$$,
  $$Evidence of routine-based care planning; records of how changes to routine are communicated; evidence of visual schedules or advance notice tools$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care and support is responsive to each autistic resident's individual communication and sensory needs; support is personalised and adjusted where needs or presentation change$$,
  $$Reg 9$$,
  $$Evidence of individualised support approaches; care records reflecting individual needs; evidence of care plan adjustments; resident and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$The service embeds RSRCC principles; care is person-centred; autistic residents have choice and control; the culture is not institutionalised$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; staff can describe what this means in practice; evidence of individual choice and control; quality assurance records$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$AUT-WEL-02$$, $$Autism$$,
  $$Governance oversight includes the restrictive practice register and reduction plan; STOMP medication review; and learning from incidents involving distress or restrictive intervention; learning is shared with all staff$$,
  $$Reg 17$$,
  $$Restrictive practice register reviewed at governance level; STOMP medication review records; incident learning records; evidence learning is shared with staff$$,
  73
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- ARBD SPECIALIST CARE HOME
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-SAF-01$$, $$Autism$$,
  $$A risk assessment is in place for each autistic resident that addresses autism-specific risks including sensory overload, distress and meltdown, self-injurious behaviour, and elopement; the assessment distinguishes autism-related behaviour from alcohol-related cognitive or behavioural change$$,
  $$Reg 12$$,
  $$Individual autism risk assessments; evidence of distinction between autism and ARBD presentation; management plans; review records following incidents$$,
  63
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-SAF-02$$, $$Autism$$,
  $$Any restrictive practices used with autistic residents are lawful, proportionate and documented in a PBS plan; a restrictive practice register is maintained; STOMP principles are applied where medication is used to manage behaviour$$,
  $$Reg 13$$,
  $$Restrictive practice register; PBS plans; reduction plans; evidence of STOMP principles applied; external oversight records$$,
  64
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic resident; staff understand that autistic presentation may interact with ARBD-related cognitive impairment and that each requires distinct assessment and support$$,
  $$Reg 9$$,
  $$Individual autism profiles; evidence of distinction between autism and ARBD in assessment; profiles accessible to all staff; evidence profiles are updated$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is tailored to the autistic resident's individual needs; staff understand that ARBD may affect a resident's ability to communicate and that this is separate from autism-related communication differences$$,
  $$Reg 9$$,
  $$Communication profiles per resident; evidence of AAC or other communication aids; evidence staff distinguish autism communication needs from ARBD cognitive effects; accessible written information$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff have completed Oliver McGowan Mandatory Training; staff understand the distinct needs of autistic people and do not attribute autism-related behaviour to ARBD or vice versa$$,
  $$Reg 18$$,
  $$Oliver McGowan training records; evidence staff can distinguish autism from ARBD presentation; refresher training records$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-EFF-04$$, $$Autism$$,
  $$Mental capacity assessments for autistic residents account for autism-specific communication and presentation separately from any ARBD-related cognitive impairment; assessors do not conflate autism with lack of capacity$$,
  $$Reg 11$$,
  $$Mental capacity assessments per decision; evidence autism and ARBD are assessed separately; best interests records$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Mental capacity and consent$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The physical environment is adapted to meet autistic residents' sensory needs; sensory assessments are completed and reasonable adjustments are made; residents have access to quiet spaces$$,
  $$Reg 10$$,
  $$Sensory assessments per resident; evidence of environmental adjustments; quiet space provision; staff training on sensory needs$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-CAR-02$$, $$Autism$$,
  $$Autistic residents' need for routine and predictability is respected; changes to routine are communicated in advance using the person's preferred method; the interaction between autism and ARBD-related disorientation is managed sensitively$$,
  $$Reg 10$$,
  $$Evidence of routine-based care planning; evidence of advance communication of changes; evidence staff manage the interaction between autism and ARBD sensitively$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care is responsive to each autistic resident's individual communication and sensory needs; support is personalised and adjusted where needs change$$,
  $$Reg 9$$,
  $$Evidence of individualised support; care records reflecting individual needs; evidence of care plan adjustments; resident and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; care is person-centred; autistic residents have choice and control; the culture does not conflate autism with ARBD$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; staff can describe what this means; evidence of individual choice and control; quality assurance records$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$AUT-WEL-02$$, $$Autism$$,
  $$Governance oversight includes the restrictive practice register and reduction plan; STOMP medication review; and learning from incidents involving distress or restrictive intervention$$,
  $$Reg 17$$,
  $$Restrictive practice register reviewed at governance; STOMP review records; incident learning; evidence learning is shared with staff$$,
  73
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- HOMECARE AGENCY
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-SAF-01$$, $$Autism$$,
  $$A risk assessment is in place for each autistic person receiving care that covers autism-specific risks including distress and meltdown, self-injurious behaviour, and safety in the home; the assessment informs the support worker's approach and is reviewed regularly$$,
  $$Reg 12$$,
  $$Individual autism risk assessments per person; evidence of person and family involvement; risk management guidance in the care plan; evidence of review following any incident$$,
  63
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-SAF-02$$, $$Autism$$,
  $$Any restrictive practices used during homecare visits are lawful, proportionate and pre-agreed in a PBS plan; staff are trained in de-escalation; the use of any restriction is recorded and reviewed; STOMP principles are applied where medication is used to manage behaviour$$,
  $$Reg 13$$,
  $$Restrictive practice guidance in care plans; PBS plans where restrictions are used; de-escalation training records; records of any restrictions used during visits; STOMP medication review records$$,
  64
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic person covering their communication needs, sensory sensitivities, triggers for distress, preferred routines, and what good support looks like in their home; the profile is shared with all support workers who visit that person$$,
  $$Reg 9$$,
  $$Individual autism profiles per person; evidence of person and family involvement; profiles shared with and read by all visiting staff; evidence profiles are updated as needs change$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Support workers are briefed on each autistic person's individual communication needs before visiting; where the person uses AAC, visual supports or specific communication strategies, support workers are trained to use them; written materials left in the home are in accessible formats$$,
  $$Reg 9$$,
  $$Communication profiles shared with support workers; evidence of AAC or communication strategy training; accessible written materials in the person's home; evidence support workers know how to communicate with each person$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All support workers who visit autistic people have completed Oliver McGowan Mandatory Training; the service prioritises consistency of support workers for autistic people to minimise distress from unfamiliar faces$$,
  $$Reg 18$$,
  $$Oliver McGowan training records; evidence of support worker consistency rota planning for autistic people; evidence of how new workers are introduced; evidence of training in de-escalation and autism-specific support$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$Support workers respect the autistic person's sensory environment in their own home; they do not make changes to the person's home environment without prior agreement; they are aware of sensory triggers and avoid them during visits$$,
  $$Reg 10$$,
  $$Sensory needs documented in care plans; evidence support workers are briefed on sensory environment; evidence of no unrequested changes to home environment; person and family feedback$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-CAR-02$$, $$Autism$$,
  $$Visit times and routines are as consistent as possible for autistic people; where changes to visit times or support workers are unavoidable, the person is informed in advance using their preferred communication method; last-minute changes are minimised$$,
  $$Reg 10$$,
  $$Evidence of routine visit scheduling for autistic people; records of how changes are communicated; evidence of advance notice; evidence last-minute changes are minimised; person and family feedback on consistency$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care is responsive to each autistic person's individual communication and sensory needs in their own home; support is personalised to each visit and each person; the service adjusts its approach where needs or presentation change$$,
  $$Reg 9$$,
  $$Evidence of personalised support; care records reflecting individual needs; evidence of care plan adjustments; person and family feedback$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; support workers understand that they are guests in the autistic person's home and that support must be delivered on the person's terms; the culture values the person's autonomy and routine$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles in practice; staff can describe what this means; evidence of respect for the person's home and autonomy; person and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$AUT-WEL-02$$, $$Autism$$,
  $$Governance oversight includes review of any restrictive practices used during visits; STOMP principles where medication is involved; and learning from incidents involving distress or restrictive intervention; learning is shared with all support workers$$,
  $$Reg 17$$,
  $$Restrictive practice oversight records; STOMP review; incident learning; evidence learning is shared with all visiting staff$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- EXTRA CARE HOUSING
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-SAF-01$$, $$Autism$$,
  $$A risk assessment is in place for each autistic tenant covering autism-specific risks including sensory overload, distress, self-injurious behaviour, and risks in the communal environment; the assessment respects the person's tenancy rights and is developed with them$$,
  $$Reg 12$$,
  $$Individual autism risk assessments; evidence of tenant involvement; management plans balancing safety with tenancy rights; evidence of review following incidents$$,
  63
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-SAF-02$$, $$Autism$$,
  $$Any restrictive practices used with autistic tenants are lawful, proportionate and agreed in a PBS plan; they respect the person's tenancy rights; STOMP principles are applied where medication is used to manage behaviour$$,
  $$Reg 13$$,
  $$PBS plans; restrictive practice records; evidence tenancy rights are respected; STOMP review records$$,
  64
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic tenant covering communication needs, sensory sensitivities, triggers for distress, preferred routines in their flat and in communal areas, and what good support looks like for them$$,
  $$Reg 9$$,
  $$Individual autism profiles per tenant; evidence of tenant involvement; profiles accessible to all staff; evidence profiles are updated as needs change$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for each autistic tenant who needs it; support workers know and use the person's preferred communication methods; written information about the scheme and their tenancy is available in accessible formats$$,
  $$Reg 9$$,
  $$Communication profiles per tenant; evidence of communication aids in use; accessible written information; staff training on individual communication methods$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff who support autistic tenants have completed Oliver McGowan Mandatory Training; the service prioritises consistency of support workers for autistic tenants$$,
  $$Reg 18$$,
  $$Oliver McGowan training records; evidence of support worker consistency planning; evidence of how new workers are introduced to autistic tenants$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$Sensory needs are considered in both private flats and communal areas; reasonable adjustments are made to communal space lighting, sound and layout where autistic tenants find these distressing; tenants have access to quieter areas of the scheme$$,
  $$Reg 10$$,
  $$Sensory assessments per tenant; evidence of adjustments in communal areas; evidence tenants are involved in decisions about communal spaces; staff training on sensory needs$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-CAR-02$$, $$Autism$$,
  $$Autistic tenants' need for routine and predictability is respected; visit times are as consistent as possible; changes are communicated in advance in the person's preferred format; scheme-wide events or changes to communal areas are communicated in advance$$,
  $$Reg 10$$,
  $$Evidence of consistent visit scheduling; records of how changes are communicated; evidence of advance notice for scheme-wide changes; tenant and family feedback$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Care and support is responsive to each autistic tenant's individual communication and sensory needs; support is personalised; the service adjusts its approach as needs or presentation change$$,
  $$Reg 9$$,
  $$Evidence of personalised support; care records reflecting individual needs; evidence of care plan adjustments; tenant and family feedback$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; support is delivered on the autistic tenant's terms within their own home; the culture values autonomy, routine and the person's right to live as they choose$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; staff can describe what this means; evidence of tenant autonomy and control; quality assurance records$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$AUT-WEL-02$$, $$Autism$$,
  $$Governance oversight includes review of any restrictive practices; STOMP medication review; and learning from incidents involving distress or restrictive intervention; learning is shared with staff$$,
  $$Reg 17$$,
  $$Restrictive practice oversight records; STOMP review; incident learning; evidence learning is shared with staff$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- SHARED LIVES SCHEME
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-SAF-01$$, $$Autism$$,
  $$A risk assessment is in place for each autistic person that addresses autism-specific risks including sensory overload, distress and meltdown, self-injurious behaviour, and elopement; the assessment considers the carer's home environment and household as the setting for support$$,
  $$Reg 12$$,
  $$Individual autism risk assessments; evidence of person and carer involvement; management plans adapted to the carer's home setting; evidence of review following incidents$$,
  63
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-SAF-02$$, $$Autism$$,
  $$The matching process considers autism compatibility explicitly; the carer's household environment, sensory profile, routines, and any other household members are assessed for compatibility with the autistic person's needs before a match is made$$,
  $$Reg 12$$,
  $$Matching assessment records documenting autism compatibility; evidence of sensory and routine compatibility assessment; evidence of household member considerations; evidence the matching process is autism-informed$$,
  64
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$An individual autism profile is in place for each autistic person covering their communication needs, sensory sensitivities, triggers for distress, interests and motivators, and what good support looks like; the profile is shared with the Shared Lives carer and any household members who interact with the person$$,
  $$Reg 9$$,
  $$Individual autism profiles; evidence of person and family involvement; profiles shared with the carer and relevant household members; evidence profiles are updated$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$The Shared Lives carer is trained in and uses the autistic person's preferred communication methods; the scheme ensures the carer has access to AAC tools, visual supports or other communication aids as needed; accessible written information is available to the person in the carer's home$$,
  $$Reg 9$$,
  $$Carer training records on individual communication methods; evidence of AAC or communication aids in the carer's home; accessible written information; evidence carer can demonstrate the person's communication methods$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All Shared Lives carers supporting autistic people have completed Oliver McGowan Mandatory Training; the scheme provides ongoing autism-specific support and training to carers; carers know how to access additional support from the scheme when needed$$,
  $$Reg 18$$,
  $$Oliver McGowan training records for carers; evidence of ongoing autism support from the scheme; evidence carers know how to access help; carer supervision records$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The sensory environment in the carer's home is assessed as part of the matching process and is adapted where possible to meet the autistic person's sensory needs; the person has access to a quiet space within the carer's home$$,
  $$Reg 10$$,
  $$Sensory assessment as part of matching; evidence of sensory adaptations in the carer's home; evidence the person has a quiet space; evidence carers understand and respect sensory needs$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-CAR-02$$, $$Autism$$,
  $$The autistic person's need for routine and predictability is respected within the carer's household; the matching process considers the carer's household routines and their compatibility with the person's own routines; changes are communicated in advance$$,
  $$Reg 10$$,
  $$Evidence of routine compatibility assessed at matching; evidence of routine-based living arrangements; records of how changes to household routines are managed; person and family feedback$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Support is responsive to the autistic person's individual communication and sensory needs; where needs change the scheme reviews the match and adjusts the support or the placement accordingly$$,
  $$Reg 9$$,
  $$Evidence of responsive support; records of match reviews where needs change; evidence of care plan adjustments; person and family feedback; evidence of re-matching where current placement is not meeting need$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; the autistic person is treated as an equal member of the carer's household, not as a patient or client; the scheme actively monitors that the placement remains person-centred$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles in placement monitoring; carer supervision records; evidence the person is treated as a household member; person and family feedback; quality assurance records$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Shared Lives Scheme$$),
  $$Core$$, $$AUT-WEL-02$$, $$Autism$$,
  $$Governance oversight includes review of any restrictive practices used in placements; STOMP medication review; and learning from incidents involving distress or breakdown of placement; the scheme uses learning to improve matching and carer support$$,
  $$Reg 17$$,
  $$Restrictive practice oversight records; STOMP review; incident and placement breakdown learning; evidence learning improves matching and carer support$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- RESIDENTIAL REHABILITATION SERVICE
-- Note: Autism and substance use — autistic people are significantly more
-- likely to use substances as a coping mechanism ("self-medication") and to
-- mask autistic traits. Autism may be undiagnosed at admission. Standard
-- assessment tools and therapeutic group formats may not be appropriate.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-SAF-01$$, $$Autism$$,
  $$Where a client is known or suspected to be autistic, a specific risk assessment is completed that covers autism-related risks including sensory overload in the residential environment, distress and meltdown during treatment, and the impact of group therapy settings on the autistic client$$,
  $$Reg 12$$,
  $$Autism-specific risk assessments; evidence of sensory and group-setting risk consideration; management plans; evidence of review following incidents$$,
  63
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-SAF-02$$, $$Autism$$,
  $$Any restrictive practices used with autistic clients are lawful, proportionate and pre-agreed; the service does not use blanket rules (e.g. mandatory group attendance) that cannot be adjusted for autistic clients; STOMP principles are applied where medication is used to manage behaviour$$,
  $$Reg 13$$,
  $$Evidence of individualised rather than blanket rules; PBS plans where restrictions are used; evidence of STOMP review; records of any restrictions used and their review$$,
  64
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$The admission assessment considers whether a client may be autistic, including undiagnosed autism; the service is aware that autistic people commonly use substances as a coping mechanism and that autism may present atypically (especially in women and people who have learned to mask); where autism is identified or suspected, the treatment plan is adapted$$,
  $$Reg 9$$,
  $$Admission assessment records; evidence of autism screening or consideration; evidence treatment plan is adapted where autism is identified or suspected; referral for formal autism assessment where appropriate$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for autistic clients who need it; information about the treatment programme, house rules, and client rights is available in accessible formats; group sessions are facilitated in a way that is accessible for autistic participants$$,
  $$Reg 9$$,
  $$Communication profiles for autistic clients; accessible written information; evidence group facilitation is adapted for autistic participants; evidence autistic clients are not excluded from therapeutic benefit due to communication or social differences$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff have completed Oliver McGowan Mandatory Training; staff understand that autism and substance use frequently co-occur; they understand the concept of masking and do not assume an autistic person lacks insight or motivation because their presentation differs from non-autistic clients$$,
  $$Reg 18$$,
  $$Oliver McGowan training records; evidence of substance use and autism co-occurrence awareness training; evidence staff understand masking; evidence of non-discriminatory approach to autistic clients$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The residential environment is assessed for sensory impact on autistic clients; where possible, reasonable adjustments are made to lighting, sound, and shared spaces; autistic clients have access to a quiet space within the residential setting$$,
  $$Reg 10$$,
  $$Sensory environment assessment; evidence of reasonable adjustments; evidence autistic clients have access to quiet space; client feedback on the environment$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-CAR-02$$, $$Autism$$,
  $$Autistic clients' need for routine and predictability is respected within the treatment programme; the daily structure is explained clearly and in advance; any changes to the programme or environment are communicated before they happen$$,
  $$Reg 10$$,
  $$Evidence of routine-based daily structure; evidence of advance communication of changes to programme; evidence autistic clients are supported through disruptions to routine; client feedback$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$The therapeutic programme is adapted for autistic clients where needed; alternatives to standard group formats are considered; the service does not discharge an autistic client for non-compliance where the non-compliance reflects autism-related difference rather than unwillingness to engage$$,
  $$Reg 9$$,
  $$Evidence of programme adaptations for autistic clients; evidence of alternatives to group formats where needed; evidence that any discharge for non-compliance has been reviewed against autism needs; client feedback$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; autistic clients are treated with dignity and without stigma; the service recognises that their substance use may be linked to their autism and does not pathologise autistic traits as resistance to treatment$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; evidence autistic traits are not misattributed to resistance; staff training on autism and substance use; client and family feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$AUT-WEL-02$$, $$Autism$$,
  $$Governance oversight includes review of any restrictive practices; STOMP review; learning from incidents involving autistic clients; and review of any discharges of autistic clients to ensure these were not due to unmet autism need$$,
  $$Reg 17$$,
  $$Restrictive practice oversight; STOMP review records; incident learning; discharge review records for autistic clients; evidence learning is shared with staff$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- COMMUNITY DRUG AND ALCOHOL SERVICE
-- Note: Same autism + substance use context as residential rehab, adapted for
-- community and appointment-based delivery.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-SAF-01$$, $$Autism$$,
  $$Where a client is known or suspected to be autistic, a specific risk assessment considers autism-related risks including sensory overload in the clinic environment, distress during appointments, and risks arising from the interaction between autism and substance use$$,
  $$Reg 12$$,
  $$Autism-specific risk assessments; evidence of sensory and appointment environment risk consideration; management plans; evidence of review following incidents$$,
  63
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-SAF-02$$, $$Autism$$,
  $$The service does not use blanket appointment or group formats that cannot be adjusted for autistic clients; where an autistic client finds the clinic environment distressing, alternatives such as home visits, telephone or video appointments, or adapted clinic spaces are considered$$,
  $$Reg 12$$,
  $$Evidence of flexible appointment formats for autistic clients; evidence of home visit or remote appointment provision where needed; evidence clinic environment adjustments are made; records of any adaptations in place$$,
  64
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-EFF-01$$, $$Autism$$,
  $$The initial assessment considers whether a client may be autistic, including undiagnosed autism; the service understands that autistic people are more likely to use substances as a coping mechanism and to mask autistic traits; where autism is identified or suspected, the treatment plan is adapted$$,
  $$Reg 9$$,
  $$Admission assessment records; evidence of autism screening or consideration; evidence treatment plan is adapted where autism is identified; referral for formal autism assessment where appropriate$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-EFF-02$$, $$Autism$$,
  $$Communication support is in place for autistic clients who need it; appointment letters and written information are available in accessible formats; key workers adapt their communication style to the individual autistic client; the service assigns a consistent key worker to each autistic client where possible$$,
  $$Reg 9$$,
  $$Communication profiles for autistic clients; accessible appointment letters and information; evidence of key worker consistency; evidence of adapted communication style; evidence of accessible formats used$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessment and care planning$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-EFF-03$$, $$Autism$$,
  $$All staff have completed Oliver McGowan Mandatory Training; staff understand that autism and substance use frequently co-occur; they understand the concept of masking and do not interpret autistic traits as non-engagement or resistance to treatment$$,
  $$Reg 18$$,
  $$Oliver McGowan training records; evidence of substance use and autism awareness training; evidence staff understand masking; evidence of non-discriminatory approach$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Training and development$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-CAR-01$$, $$Autism$$,
  $$The clinic environment is assessed for sensory impact; reasonable adjustments are made to the waiting area and appointment rooms where autistic clients find these distressing; autistic clients may be offered a direct arrival pathway that avoids waiting in busy or loud reception areas$$,
  $$Reg 10$$,
  $$Evidence of sensory assessment of clinic environment; evidence of reasonable adjustments; evidence of direct arrival pathways where needed; client feedback on the environment$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Compassionate care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-CAR-02$$, $$Autism$$,
  $$Appointment scheduling for autistic clients is as consistent as possible; the same day, time, and key worker are prioritised; where changes are unavoidable, the client is given advance notice using their preferred communication format$$,
  $$Reg 10$$,
  $$Evidence of consistent appointment scheduling for autistic clients; records of how changes are communicated; evidence of advance notice; client feedback on appointment consistency$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-RES-01$$, $$Autism$$,
  $$Treatment is adapted for autistic clients where needed; the service does not discharge an autistic client for missed appointments or apparent non-engagement without first considering whether the non-engagement reflects unmet autism need; alternatives to standard group or clinic formats are offered$$,
  $$Reg 9$$,
  $$Evidence of treatment adaptations for autistic clients; evidence that missed appointments are reviewed against autism need before discharge; evidence of alternative formats offered; client feedback$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Responding to people's needs$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-WEL-01$$, $$Autism$$,
  $$RSRCC principles are embedded; autistic clients are treated with dignity and without stigma; the service recognises that substance use may be linked to autism and does not pathologise autistic traits as resistance to treatment or lack of motivation$$,
  $$Reg 17$$,
  $$Evidence of RSRCC principles; evidence autistic traits are not misattributed to resistance; staff training on autism and substance use; client feedback$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id, (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$AUT-WEL-02$$, $$Autism$$,
  $$Governance oversight includes learning from incidents involving autistic clients and review of any discharges of autistic clients to ensure these were not due to unmet autism need; the service tracks autism as a protected characteristic in its equality monitoring$$,
  $$Reg 17$$,
  $$Incident learning for autistic clients; discharge review records; equality monitoring data including autism; evidence learning is shared with staff$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
