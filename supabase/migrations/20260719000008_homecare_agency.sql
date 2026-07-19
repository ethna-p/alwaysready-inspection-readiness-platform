-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Homecare Agency — Core checklist items + Dementia sub-service
--
-- Key homecare differences from residential:
--   • Care delivered in service users' own homes — no registered premises inspection
--   • Lone working safety is a primary Safe theme
--   • DoLS does NOT apply (it's a care home / hospital power only)
--     MCA + Court of Protection / Liberty Protection Safeguards apply instead
--   • Key safe / key holding management is a homecare-specific risk
--   • Electronic call monitoring (ECM) is the primary call-time governance tool
--   • No fire PEEPs for the service's own premises — fire safety sits in home risk assessment
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Managing risks during care and treatment
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MR-01$$, NULL,
  $$An environmental risk assessment is completed in each service user's home before care begins; it covers falls hazards, trip risks, gas, electricity, heating and fire safety; assessments are updated following any incident or change in the home$$,
  $$Reg 12$$,
  $$Home environment risk assessments per service user; date of last review; evidence of updates following incidents or changes$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MR-02$$, NULL,
  $$A lone working policy is in place; all staff have a check-in and check-out system for every visit; a clear escalation procedure is followed when a carer does not check in as expected$$,
  $$Reg 12$$,
  $$Lone working policy; electronic call monitoring (ECM) or manual check-in records; escalation log; evidence of procedure being followed when calls were missed$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MR-03$$, NULL,
  $$A key holding policy is in place; keys to service users' homes are logged, allocated to named carers and signed in and out; access codes for key safes are recorded securely and reviewed when staff leave$$,
  $$Reg 12$$,
  $$Key holding policy; key log or register; evidence of code changes when staff leave; records of key safe installation and code review$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MR-04$$, NULL,
  $$Moving and handling risk assessments are completed in each service user's home; equipment is maintained and serviced; staff competency in using equipment in the home environment is assessed$$,
  $$Reg 12$$,
  $$Moving and handling risk assessments; equipment service records; staff competency assessments for manual handling in the home$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MR-05$$, NULL,
  $$Incidents, accidents and near misses in service users' homes are recorded and reported; the registered manager reviews them for themes and acts on learning$$,
  $$Reg 12$$,
  $$Incident and accident log; evidence of manager review; actions taken; themes identified and shared with staff$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MR-06$$, NULL,
  $$When a service user is discharged from hospital, a care plan review is initiated immediately; the service adapts the care package to any changed needs before the first post-discharge visit$$,
  $$Reg 12$$,
  $$Hospital discharge notifications and care plan reviews; evidence of contact with hospital or community team; updated care plans dated to reflect discharge$$,
  6
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Safe medicines and treatments
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MT-01$$, NULL,
  $$A medicines administration record (MAR chart) is in place in the service user's home for all service users receiving medicines support or administration; entries are accurate and legible$$,
  $$Reg 12$$,
  $$MAR charts in the home; evidence of accurate and contemporaneous recording; any gaps or omissions explained$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MT-02$$, NULL,
  $$Staff providing medicines support or administration are trained and competency-assessed before working unsupervised with medicines; competency is reassessed following any medication error$$,
  $$Reg 12$$,
  $$Medicines training matrix; competency assessment records; evidence of reassessment following errors$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MT-03$$, NULL,
  $$PRN (as-required) medicine protocols are in place for each applicable medicine; they describe symptoms, maximum dose, minimum interval and outcome to record$$,
  $$Reg 12$$,
  $$PRN protocols per service user and per medicine; evidence of recording when PRN medicines are given and the outcome$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MT-04$$, NULL,
  $$Medication errors and near misses are recorded, reported to the appropriate professional and investigated; learning is shared with staff$$,
  $$Reg 12$$,
  $$Medication error log; evidence of GP or pharmacist notification; investigation records; staff communication of learning$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MT-05$$, NULL,
  $$Medicines are stored correctly in the service user's home; the care plan records the storage location and any specific storage requirements (e.g. refrigeration); staff check storage conditions on each visit$$,
  $$Reg 12$$,
  $$Care plans with medicines storage instructions; spot check records confirming appropriate storage; evidence of action when storage conditions were not met$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-MT-06$$, NULL,
  $$A medicines audit is carried out at regular intervals; it checks MAR accuracy, PRN protocol completeness, staff competency currency and storage compliance$$,
  $$Reg 12$$,
  $$Medicines audit records; frequency of audits; actions arising from audit findings; evidence of follow-up$$,
  6
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Safe staffing
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SS-01$$, NULL,
  $$Safer recruitment procedures are followed for all staff including enhanced DBS checks, two references, a full employment history with gaps explained, and right to work verification$$,
  $$Reg 19$$,
  $$Recruitment files including DBS certificates; reference records; employment history; right to work documents$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SS-02$$, NULL,
  $$Call scheduling allows sufficient travel time between visits; calls are not shortened without the service user's agreement to cover staff shortages$$,
  $$Reg 18$$,
  $$Rotas showing travel time between calls; ECM data confirming call times are as scheduled; evidence of how late starts or gaps are managed$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SS-03$$, NULL,
  $$Electronic call monitoring records the actual start and end time of every visit; late or missed calls trigger an immediate welfare response; a log of all alerts and responses is maintained$$,
  $$Reg 12$$,
  $$ECM system reports; missed and late call log; evidence of welfare responses made; actions when contact could not be established$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SS-04$$, NULL,
  $$All new staff complete an induction that meets the Care Certificate standards before working unsupervised; induction records are signed off by the manager$$,
  $$Reg 18$$,
  $$Care Certificate completion records; induction sign-off; evidence of supervised visits before lone working$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SS-05$$, NULL,
  $$Agency or bank staff receive an orientation and are given access to the relevant care plans before their first visit; they are not assigned to service users whose needs exceed their competency$$,
  $$Reg 18$$,
  $$Agency orientation records; evidence of care plan access before first visit; competency matching records for complex care visits$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Safeguarding
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SG-01$$, NULL,
  $$A Safeguarding Adults policy is in place, up to date and aligned with local multi-agency procedures; all staff have read and signed it$$,
  $$Reg 13$$,
  $$Safeguarding policy; sign-off records; date of last review; evidence of alignment with local MASP procedures$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SG-02$$, NULL,
  $$All staff are trained in safeguarding adults at the appropriate level for their role; training is refreshed in line with local authority requirements$$,
  $$Reg 13$$,
  $$Safeguarding training matrix; certificates; refresher due dates; evidence of level-appropriate training (e.g. managers at a higher level)$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SG-03$$, NULL,
  $$Safeguarding referrals to the local authority are made promptly and correctly; a referral log is maintained including the outcome of each referral$$,
  $$Reg 13$$,
  $$Safeguarding referral log; evidence of LA acknowledgement; referral outcomes recorded; timeliness of referrals$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SG-04$$, NULL,
  $$A designated safeguarding lead is identified; they are contactable during and outside of office hours and have received safeguarding lead training$$,
  $$Reg 13$$,
  $$Named safeguarding lead; out-of-hours contact arrangements; safeguarding lead training certificate$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SG-05$$, NULL,
  $$Allegations against staff are managed through the correct procedure; the Local Authority Designated Officer (LADO) is notified promptly where the allegation involves a person in a position of trust$$,
  $$Reg 13$$,
  $$Allegations management policy; LADO referral records where applicable; evidence of suspension or redeployment pending investigation$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Safe environments and infection prevention and control
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-EI-01$$, NULL,
  $$PPE is provided to all staff for use in service users' homes; an IPC policy sets out when and how PPE is used; staff are observed using PPE correctly during spot checks$$,
  $$Reg 12$$,
  $$IPC policy; PPE provision records; spot check observations confirming correct PPE use$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-EI-02$$, NULL,
  $$All staff receive IPC training covering hand hygiene, standard precautions and use of PPE; training is refreshed annually; hand hygiene is observed during spot checks$$,
  $$Reg 12$$,
  $$IPC training matrix and certificates; spot check records confirming hand hygiene technique; refresher due dates$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-EI-03$$, NULL,
  $$Clinical waste generated in service users' homes (e.g. incontinence products, used dressings) is disposed of in line with the IPC policy and local waste disposal requirements$$,
  $$Reg 12$$,
  $$IPC policy section on waste disposal; evidence of correct waste disposal methods communicated to staff; any waste disposal incidents recorded$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-EI-04$$, NULL,
  $$When a service user or household member has a known infection, a care plan risk assessment is completed; staff are given appropriate guidance and additional PPE as needed$$,
  $$Reg 12$$,
  $$Infection-specific risk assessments; evidence of communication to visiting staff; records of enhanced precautions taken$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Safety culture
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SC-01$$, NULL,
  $$A culture of open reporting is established; staff feel confident to report incidents, near misses and concerns without fear of blame; the manager reviews reports and shares learning$$,
  $$Reg 17$$,
  $$Incident reporting policy; volume and type of incidents reported; evidence of management review; learning shared at team meetings or supervision$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SC-02$$, NULL,
  $$The duty of candour is applied; service users and, where appropriate, their families are informed promptly and openly when something has gone wrong during their care$$,
  $$Reg 20$$,
  $$Duty of candour records; evidence of notification to service users or families following incidents; apology records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-SC-03$$, NULL,
  $$A whistleblowing policy is in place; staff know how to raise concerns internally and externally (including to CQC); there is no evidence of a culture that discourages reporting$$,
  $$Reg 17$$,
  $$Whistleblowing policy; evidence of communication to staff; any concerns raised and how they were handled$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Safe systems, pathways and transitions
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-ST-01$$, NULL,
  $$The service has a clear protocol for when a carer cannot access the property or a service user is not found at home; the protocol includes welfare checks, family contact and emergency service notification where needed$$,
  $$Reg 12$$,
  $$No-answer protocol; records of instances when the protocol was activated; evidence of welfare checks carried out and outcomes$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$SAF-ST-02$$, NULL,
  $$Information about a service user's care is shared safely with other professionals (GP, district nurse, hospital) when a transition occurs; information governance requirements are met$$,
  $$Reg 17$$,
  $$Evidence of information sharing with community teams; hospital admission and discharge notifications; evidence of consent or lawful basis for sharing$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Assessing needs
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-AN-01$$, NULL,
  $$A thorough needs assessment is completed before care begins; it covers health, functional ability, social, cultural, religious, communication and dietary needs$$,
  $$Reg 9$$,
  $$Pre-care needs assessments; evidence of assessor competency; date of assessment relative to care start date$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-AN-02$$, NULL,
  $$Care plans are person-centred, written with the service user and their family, and are kept in the service user's home; they are accessible to all visiting carers$$,
  $$Reg 9$$,
  $$Care plans in the home; evidence of co-production with service user; care plans signed by service user or their representative$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-AN-03$$, NULL,
  $$Care plans are reviewed at least every 12 months and following any change in need, hospital admission, discharge, incident or safeguarding concern$$,
  $$Reg 9$$,
  $$Care plan review dates; evidence of triggered reviews following changes in need or incidents; updated care plans dated and signed$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-AN-04$$, NULL,
  $$Input from other professionals (district nurse, occupational therapist, GP, SALT) is incorporated into care plans and acted upon; the service coordinates with the wider community health team$$,
  $$Reg 9$$,
  $$Evidence of professional input in care plans; referral records; correspondence with community professionals; evidence of recommendations being implemented$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-AN-05$$, NULL,
  $$The service user's personal outcomes and goals are documented in the care plan; progress towards outcomes is reviewed at each care plan review$$,
  $$Reg 9$$,
  $$Outcomes documented in care plans; evidence of review against outcomes at scheduled reviews$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Care provision, integration and continuity
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$A consistent rota promotes continuity of carers; new carers are introduced to the service user before attending alone; any change of regular carer is communicated to the service user in advance$$,
  $$Reg 9$$,
  $$Rota records showing carer consistency; evidence of introductions before lone attendance; communications to service users about carer changes$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CP-02$$, NULL,
  $$Handover between carers is effective; any changes in a service user's condition are communicated to the next carer and, where clinically significant, to the relevant professional$$,
  $$Reg 9$$,
  $$Visit notes and daily logs in the home; evidence of inter-carer communication; records of escalation to professionals when a change in condition was noted$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CP-03$$, NULL,
  $$The service works alongside district nurses, community mental health teams, GPs and other community professionals; records of joint working and shared information are maintained$$,
  $$Reg 9$$,
  $$Records of multi-professional contact; joint visit records; evidence of care co-ordination with community teams; referral outcomes$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CP-04$$, NULL,
  $$When a service user is discharged from hospital, the service is notified and adapts the care package before the first post-discharge visit; a care plan review is completed within an agreed timeframe$$,
  $$Reg 9$$,
  $$Hospital discharge notifications; evidence of pre-discharge communication with hospital team; updated care plans following discharge; timescales for review$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CP-05$$, NULL,
  $$When the service reduces or ends, a planned transition is arranged with the service user and, where relevant, with the commissioning authority; continuity of support is maintained during the handover period$$,
  $$Reg 9$$,
  $$Cessation or reduction of care records; evidence of planned transition; communication with commissioners and community teams$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Supporting people to live healthier lives
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-HL-01$$, NULL,
  $$Staff monitor and record changes in service users' health and wellbeing at each visit; concerns are escalated promptly to the appropriate professional$$,
  $$Reg 9$$,
  $$Visit notes and daily logs; records of health changes observed; evidence of timely escalation to GP, district nurse or 999 as appropriate$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-HL-02$$, NULL,
  $$Nutrition and hydration support is documented in care plans; staff know when to prompt, assist or refer; concerns about weight loss or inadequate intake are escalated to a GP or dietitian$$,
  $$Reg 14$$,
  $$Care plans with nutrition and hydration sections; evidence of food and fluid records where indicated; referral records to dietitian or GP for nutrition concerns$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-HL-03$$, NULL,
  $$Care is not task-focused at the expense of the service user's overall wellbeing; staff take time to engage with the person, notice changes in mood or behaviour, and report concerns$$,
  $$Reg 9$$,
  $$Visit notes reflecting wellbeing observations; evidence of referrals for mental health or social concerns; spot check feedback on carer engagement$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-HL-04$$, NULL,
  $$The service supports service users to attend health appointments where needed; transport or escort arrangements are documented in care plans$$,
  $$Reg 9$$,
  $$Care plans with appointment support documented; evidence of escort arrangements; records of appointments attended with support$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Evidence-based care and equitable outcomes
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-EQ-01$$, NULL,
  $$Care is delivered in line with relevant national guidance and best practice frameworks, including NICE guidance and Skills for Care standards; training is updated when guidance changes$$,
  $$Reg 9$$,
  $$Evidence of staff training aligned to current guidance; references to NICE or Skills for Care in policies or care plans; evidence of practice updating when national guidance is published$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-EQ-02$$, NULL,
  $$Outcomes are monitored across the service user group; any disparity in outcomes for people with protected characteristics is identified and addressed$$,
  $$Reg 17$$,
  $$Outcomes monitoring data; equality analysis of outcomes; evidence of action taken where disparities identified$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- EFFECTIVE — Consent to care and treatment
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CT-01$$, NULL,
  $$Consent is obtained and recorded for all elements of care before care begins; consent is revisited if the service user's capacity changes or they withdraw agreement$$,
  $$Reg 11$$,
  $$Consent records in care plans; evidence of consent being revisited following changes in capacity or service user preference$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CT-02$$, NULL,
  $$Where a service user may lack capacity to consent, a Mental Capacity Act assessment is completed for each specific decision; a best interest decision is documented and reviewed; note: DoLS does not apply in community settings$$,
  $$Reg 11$$,
  $$MCA assessments per decision; best interest meeting records; evidence of least restrictive option chosen; review dates for best interest decisions$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$EFF-CT-03$$, NULL,
  $$Advance decisions to refuse treatment (ADRTs) and Lasting Powers of Attorney (LPA) are recorded in care plans, shared with relevant professionals and honoured during care delivery$$,
  $$Reg 11$$,
  $$ADRT and LPA records in care plans; evidence of sharing with GP or district nurse; evidence of decisions being honoured during care$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Kindness, compassion and dignity
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-KD-01$$, NULL,
  $$Staff knock and announce themselves before entering a service user's home; they treat the home with respect and ask permission before moving belongings or entering rooms$$,
  $$Reg 10$$,
  $$Spot check observation records; service user and family feedback; staff supervision records addressing dignity in the home$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-KD-02$$, NULL,
  $$Service users are treated with dignity during personal care; their preferences for how care is delivered are respected and recorded in care plans$$,
  $$Reg 10$$,
  $$Care plans recording personal care preferences; spot check observations; service user feedback confirming dignity is maintained$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-KD-03$$, NULL,
  $$Family members and carers are involved in care discussions where the service user wishes; their role is acknowledged and supported$$,
  $$Reg 9$$,
  $$Care plans noting family involvement preferences; evidence of family being included in reviews; carer support information provided$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-KD-04$$, NULL,
  $$Spot checks include direct observation of care delivery in the service user's home to confirm dignity, respect and person-centred practice$$,
  $$Reg 17$$,
  $$Spot check records including observations made in the home; feedback from service users following spot checks; actions taken following any concerns observed$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Independence, choice and control
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-IC-01$$, NULL,
  $$Care plans are written around the service user's outcomes and promote the maximum level of independence; care tasks are designed to enable, not replace, the service user's own abilities$$,
  $$Reg 9$$,
  $$Outcomes-focused care plans; evidence of reablement or enabling approach; review of whether care tasks have been reduced as independence improves$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-IC-02$$, NULL,
  $$Service users are supported to make everyday decisions including what they wear, what they eat and their daily routine; carers do not impose their own preferences$$,
  $$Reg 9$$,
  $$Care plans recording daily routine preferences; spot check evidence of service user-led care; service user feedback on choice and control$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-IC-03$$, NULL,
  $$The service is flexible; service users can change their call times, routines and care tasks within reasonable parameters without barriers or additional charges$$,
  $$Reg 9$$,
  $$Complaints or feedback log relating to flexibility; evidence of call time adjustments accommodated; service user satisfaction survey responses on flexibility$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Equity in experiences
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-EE-01$$, NULL,
  $$Communication needs are documented in care plans including language, literacy, hearing or visual impairments; interpreters or adapted materials are arranged as needed$$,
  $$Reg 9$$,
  $$Care plans with communication needs documented; evidence of interpreter arrangements; accessible care plan formats (e.g. easy read, large print, translated)$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-EE-02$$, NULL,
  $$All staff complete equality and diversity training; the service actively considers the cultural, religious and lifestyle preferences of each service user in care delivery$$,
  $$Reg 18$$,
  $$Equality and diversity training matrix; care plans recording cultural or religious preferences; evidence of preferences being honoured in practice$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- CARING — Listening to and responding to feedback
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-LR-01$$, NULL,
  $$Service users and families are given regular opportunities to give feedback; annual satisfaction surveys are conducted and the results are shared with staff$$,
  $$Reg 17$$,
  $$Satisfaction survey records; evidence of results being shared; response rate and themes identified$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$CAR-LR-02$$, NULL,
  $$Feedback from service users shapes care planning and service improvement; there is evidence that suggestions have led to tangible changes$$,
  $$Reg 17$$,
  $$Examples of improvements made in response to feedback; evidence shared with service users that their feedback was acted on$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Person-centred care
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$RES-PC-01$$, NULL,
  $$Care plans reflect each service user's individual preferences, cultural and religious needs, life history, social interests and communication style$$,
  $$Reg 9$$,
  $$Care plans with individual preference sections completed; evidence of life history, cultural and religious needs documented and reflected in care$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$RES-PC-02$$, NULL,
  $$The service responds promptly when a service user's needs change; care plans are amended and communicated to all carers before the next visit$$,
  $$Reg 9$$,
  $$Records of urgent care plan amendments; evidence of communication to carers following changes; timescales from change in need to updated care plan$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$RES-PC-03$$, NULL,
  $$End of life preferences, including preferred place of death, DNACPR decisions and advanced care plans, are documented and shared with the relevant professionals where the service user consents$$,
  $$Reg 9$$,
  $$End of life care plans; DNACPR documentation; evidence of sharing with GP and community nurse; care plans updated as end of life needs change$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- RESPONSIVE — Timely and equitable access
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$RES-TA-01$$, NULL,
  $$Calls are delivered at the agreed times; ECM data is reviewed to identify patterns of lateness or early departure and these are addressed$$,
  $$Reg 9$$,
  $$ECM reports showing actual vs. scheduled call times; evidence of manager review of lateness patterns; actions taken$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$RES-TA-02$$, NULL,
  $$New service users receive their first care visit within the agreed timeframe following referral; any delay is documented with the reason and communicated to the commissioner or referrer$$,
  $$Reg 9$$,
  $$Referral-to-start records; evidence of timescales met; records of delays and reason; communication with commissioners$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$RES-TA-03$$, NULL,
  $$An out-of-hours or on-call arrangement is in place; service users and families know how to contact the service in an emergency outside of office hours$$,
  $$Reg 9$$,
  $$Out-of-hours contact details provided to service users; evidence of on-call rota; records of out-of-hours contacts and responses$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$RES-TA-04$$, NULL,
  $$When a carer is unavailable, a suitable replacement is identified and the service user is notified in advance; last-minute cover does not compromise the quality or continuity of care$$,
  $$Reg 9$$,
  $$Records of cover arrangements; evidence of advance notification to service users; records of any short-notice cover and how managed$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Capable and compassionate leaders
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-CL-01$$, NULL,
  $$A registered manager is in post and is available to staff and service users; any absence is covered by an appropriately experienced deputy; CQC is notified of any changes$$,
  $$Reg 7$$,
  $$CQC registration records; registered manager's DBS and qualifications; absence cover arrangements; evidence of availability to staff and service users$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-CL-02$$, NULL,
  $$All staff receive regular supervision; spot checks include direct observation of care in service users' homes; both supervision and spot check records document performance and any concerns$$,
  $$Reg 18$$,
  $$Supervision records including frequency and content; spot check records showing in-home observations; evidence of actions arising from supervision or spot checks$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-CL-03$$, NULL,
  $$The service has a clear set of values; leaders model those values and staff can describe how they influence day-to-day care$$,
  $$Reg 17$$,
  $$Statement of values; evidence of values in induction and training; staff able to describe how values apply to their work; any examples of values in practice from service users or families$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-CL-04$$, NULL,
  $$Staff wellbeing is actively supported; there are mechanisms for staff to raise concerns, and workload, lone working and travel time are managed to protect wellbeing$$,
  $$Reg 18$$,
  $$Staff wellbeing policy; evidence of wellbeing support arrangements; staff survey or supervision records relating to workload and lone working$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Governance and management
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-GM-01$$, NULL,
  $$A quality assurance programme is in place including regular audits of care records, medicines, call times and safeguarding; audit results are acted upon$$,
  $$Reg 17$$,
  $$Quality audit schedule; completed audit reports; evidence of actions arising from audits; improvement tracked over time$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-GM-02$$, NULL,
  $$Policies and procedures are reviewed at least annually and updated to reflect changes in legislation, guidance or practice; version control is maintained$$,
  $$Reg 17$$,
  $$Policy review schedule; version-controlled policy documents with review dates; evidence of policy updates following guidance changes$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-GM-03$$, NULL,
  $$Notifiable incidents are reported to CQC within the required timescales; a log of notifications is maintained$$,
  $$Reg 18$$,
  $$CQC notification log; copies of notifications submitted; evidence of timescales met$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-GM-04$$, NULL,
  $$A business continuity plan is in place covering staff shortages, adverse weather, systems failure and pandemic response; it is tested and reviewed annually$$,
  $$Reg 17$$,
  $$Business continuity plan; evidence of annual review; evidence of plan being activated and tested$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-GM-05$$, NULL,
  $$A complaints procedure is in place and accessible to service users; complaints are acknowledged within 3 working days, investigated thoroughly and resolved with written outcomes$$,
  $$Reg 16$$,
  $$Complaints policy; complaints log with acknowledgement and resolution dates; evidence of written outcomes; themes identified and acted upon$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Partnerships and communities
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-PC-01$$, NULL,
  $$The service has established relationships with the commissioning local authority and/or ICB; it attends provider forums and engages in market shaping discussions$$,
  $$Reg 17$$,
  $$Evidence of attendance at provider forums; commissioner monitoring visit records; correspondence with local authority or ICB$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-PC-02$$, NULL,
  $$The service participates in multi-agency safeguarding, hospital discharge and care planning meetings where appropriate; contribution to community health and social care pathways is evidenced$$,
  $$Reg 17$$,
  $$Multi-agency meeting attendance records; evidence of contribution to discharge planning; safeguarding strategy meeting involvement$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-PC-03$$, NULL,
  $$The service connects service users with community resources, voluntary organisations and social activities where this supports their outcomes$$,
  $$Reg 9$$,
  $$Evidence of signposting or referrals to community groups; care plans noting social activities supported; feedback from service users on community connections made$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Improvement, innovation and learning
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-IL-01$$, NULL,
  $$Learning from incidents, complaints and near misses is embedded in practice; changes made as a result are communicated to staff and their impact is monitored$$,
  $$Reg 17$$,
  $$Evidence of learning from incidents shared at team meetings or supervision; policy or practice changes following incidents; monitoring of whether changes improved outcomes$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-IL-02$$, NULL,
  $$Staff development opportunities are provided including access to QCF qualifications, specialist training and career progression; training needs are identified at supervision and appraisal$$,
  $$Reg 18$$,
  $$Staff training and development plans; evidence of QCF enrolment or completion; supervision records identifying development needs$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Workforce equity and culture
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-WE-01$$, NULL,
  $$All staff are treated equitably regardless of protected characteristics; the service monitors pay, progression and treatment of staff and acts on any disparity$$,
  $$Reg 18$$,
  $$Equality monitoring data for workforce; evidence of equal pay and progression; any grievances or disciplinaries reviewed for equality impact$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-WE-02$$, NULL,
  $$Staff have a voice in how the service is run; regular team meetings and staff surveys give staff the opportunity to contribute ideas and raise concerns$$,
  $$Reg 17$$,
  $$Team meeting records including staff contributions; staff survey results; evidence of staff suggestions being acted upon$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WELL-LED — Strategic direction
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-SD-01$$, NULL,
  $$The service has a clear vision and strategic plan; leaders can articulate priorities for improvement and these are reflected in operational decisions$$,
  $$Reg 17$$,
  $$Service development plan or strategy; evidence of leaders referring to strategic priorities in meetings or supervision; progress against strategic goals reviewed$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$WEL-SD-02$$, NULL,
  $$Financial sustainability of the service is managed responsibly; there is evidence that resource allocation does not compromise the quality or safety of care$$,
  $$Reg 17$$,
  $$Evidence of financial oversight; any cost pressures documented and impact on care assessed; commissioner or owner financial governance records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- DEMENTIA SUB-SERVICE — Homecare Agency
-- 12 items, sub_service = 'Dementia', display_order 51+
-- Framed for community care: dementia in the home, lone carer context,
-- no DoLS (MCA + CoP applies), community SALT referrals.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-SAF-01$$, $$Dementia$$,
  $$A risk assessment is in place for each service user living with dementia covering wandering, getting lost, leaving the home unsafely and night-time risks; the plan balances safety with the person's right to move freely$$,
  $$Reg 12$$,
  $$Dementia-specific risk assessments; management plans; evidence of family and professional involvement; evidence of review following any incident$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-SAF-02$$, $$Dementia$$,
  $$Where a service user living with dementia lacks capacity to consent to taking medicines, a covert administration protocol is in place, documented, authorised by the GP and reviewed at each medicines review$$,
  $$Reg 12$$,
  $$Covert medicine protocols per service user; MCA best interest decision records; GP authorisation; MAR charts showing covert administration; evidence of regular review$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-SAF-03$$, $$Dementia$$,
  $$All staff visiting service users living with dementia receive dementia-specific training covering types of dementia, communication approaches, behaviour support and person-centred care in the home$$,
  $$Reg 18$$,
  $$Dementia training matrix and certificates; evidence of training covering community-specific dementia care; refresher records$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-EFF-01$$, $$Dementia$$,
  $$Care plans for service users living with dementia document the type and date of diagnosis, current cognitive baseline and any changes; carers are briefed on the person's current presentation before each visit$$,
  $$Reg 9$$,
  $$Care plans with dementia diagnosis details; cognitive assessment information; handover notes to visiting carers; evidence of care plan updates when cognition changes$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-EFF-02$$, $$Dementia$$,
  $$Where a service user living with dementia presents with swallowing difficulties, a referral is made to community SALT; SALT recommendations are documented in the care plan and followed by all visiting carers$$,
  $$Reg 14$$,
  $$SALT referral records; SALT assessment outcomes in care plans; modified diet or texture guidance communicated to carers; evidence of implementation during visits$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-EFF-03$$, $$Dementia$$,
  $$Where a service user living with dementia may lack capacity to consent to care decisions, a Mental Capacity Act assessment is completed for each specific decision; best interest decisions are documented and reviewed; note: DoLS does not apply in community settings$$,
  $$Reg 11$$,
  $$MCA assessments per decision; best interest meeting records with family or advocate involvement; review dates for best interest decisions; evidence of least restrictive option chosen$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-EFF-04$$, $$Dementia$$,
  $$The home environment is assessed for dementia-friendly features as part of the care plan risk assessment; adaptations such as labelling, visual cues and reduced clutter are recommended and, where agreed, supported$$,
  $$Reg 12$$,
  $$Home environment risk assessments noting dementia-specific factors; evidence of recommendations made; records of adaptations agreed with service user or family$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-CAR-01$$, $$Dementia$$,
  $$A life history document ("This Is Me" or equivalent) is completed for each service user living with dementia; it is kept in the home and accessible to every visiting carer including cover and agency staff$$,
  $$Reg 9$$,
  $$Completed "This Is Me" or life history documents in the home; evidence accessible to all visiting carers; evidence of updates over time$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-CAR-02$$, $$Dementia$$,
  $$Activities and meaningful occupation are encouraged during visits for service users living with dementia; carers spend time engaging the person in familiar, enjoyable activities rather than focusing solely on care tasks$$,
  $$Reg 9$$,
  $$Care plans noting preferred activities and interests; spot check observations of engagement during visits; service user and family feedback on quality of time during calls$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-RES-01$$, $$Dementia$$,
  $$Communication needs for service users living with dementia are documented in care plans; all visiting carers — including cover and agency staff — use adapted techniques including simple language, familiar routines and validation approaches$$,
  $$Reg 9$$,
  $$Communication needs assessments in care plans; evidence of handover of communication guidance to cover and agency carers; spot check observations of communication approaches$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-WEL-01$$, $$Dementia$$,
  $$A dementia lead or champion is in post within the service; they support staff development, promote best practice in community dementia care and monitor quality for service users living with dementia$$,
  $$Reg 17$$,
  $$Named dementia lead or champion; evidence of their role in training, supervision or quality monitoring; any dementia-specific audits or improvement work$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Homecare Agency$$),
  $$Core$$, $$DEM-WEL-02$$, $$Dementia$$,
  $$The service has established links with memory clinics, Admiral Nurses or Dementia UK; these are accessed when a service user's dementia-related needs escalate or when families need support$$,
  $$Reg 17$$,
  $$Referral pathways to memory clinic or Admiral Nurse; evidence of referrals made; outcomes followed up; evidence of family signposting to dementia support organisations$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
