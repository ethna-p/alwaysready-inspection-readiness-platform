-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Extra Care Housing — Core checklist items + Dementia sub-service
--
-- Key ECH differences from residential care and homecare:
--   • Residents live in self-contained flats with their own tenancy/lease —
--     care staff are on-site but must knock and request entry as in homecare
--   • Staff are scheme-based (on-site), not travelling between homes
--   • Telecare / emergency pendant system replaces the homecare no-answer protocol
--   • On-site night cover (sleep-in or waking night) responds to pendant calls
--   • DoLS does NOT apply — residents hold tenancy rights and cannot be deprived
--     of liberty under DoLS; MCA + Court of Protection applies instead
--   • Communal facilities (dining room, lounges, gardens) are shared spaces;
--     building safety in communal areas is primarily the housing provider's
--     responsibility — the care provider must have a clear interface protocol
--   • Housing provider interface is a specific governance requirement
--   • Residents have the right to have visitors, come and go freely, and make
--     decisions about their own flat — care plans must respect tenancy rights
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- SAFE — Managing risks during care and treatment
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-MR-01$$, NULL,
  $$A risk assessment is completed in each resident's flat before care begins; it covers falls hazards, trip risks, gas, electricity, heating and fire safety; assessments are updated following any incident or change in the flat$$,
  $$Reg 12$$,
  $$Risk assessments per flat; date of last review; evidence of updates following incidents or changes; interface with housing provider where structural or communal risks are identified$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-MR-02$$, NULL,
  $$A telecare and emergency call pendant system is in place for all residents; pendants are tested regularly; response times to pendant activations are monitored; a log of activations and responses is maintained$$,
  $$Reg 12$$,
  $$Pendant testing records; pendant activation log with response times; evidence of action taken following each activation; maintenance and battery replacement records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-MR-03$$, NULL,
  $$A master key or emergency access policy is in place; access to residents' flats by staff without the resident's express permission is only used in genuine emergencies and is documented; keys are signed in and out$$,
  $$Reg 12$$,
  $$Master key policy; key register; records of emergency access to flats with reason documented; evidence that routine access is by resident consent only$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-MR-04$$, NULL,
  $$Moving and handling risk assessments are completed for each resident in their flat; equipment is maintained and serviced; staff competency in using equipment is assessed$$,
  $$Reg 12$$,
  $$Moving and handling risk assessments per flat; equipment service records; staff competency assessments for moving and handling$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-MR-05$$, NULL,
  $$Incidents, accidents and near misses occurring in residents' flats and communal areas are recorded; the registered manager reviews them for themes and acts on learning; serious incidents are reported to CQC and the housing provider as appropriate$$,
  $$Reg 12$$,
  $$Incident and accident log; evidence of manager review; actions taken; themes identified and shared with staff; evidence of housing provider notification where communal area incidents occur$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-MR-06$$, NULL,
  $$When a resident is discharged from hospital, a care plan review is initiated before the first post-discharge visit; the care package is adapted to any changed needs and the housing provider is informed where the flat needs to be adapted$$,
  $$Reg 12$$,
  $$Hospital discharge notifications; updated care plans following discharge; evidence of communication with hospital team; any flat adaptation requests to housing provider$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-MT-01$$, NULL,
  $$A medicines administration record (MAR chart) is kept in each resident's flat for all residents receiving medicines support; entries are accurate, legible and contemporaneous$$,
  $$Reg 12$$,
  $$MAR charts in flats; evidence of accurate and contemporaneous recording; any gaps or omissions explained$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-MT-03$$, NULL,
  $$PRN (as-required) medicine protocols are in place for each applicable medicine; they describe symptoms, maximum dose, minimum interval and outcome to record$$,
  $$Reg 12$$,
  $$PRN protocols per resident and per medicine; evidence of recording when PRN medicines are given and the outcome$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-MT-05$$, NULL,
  $$Medicines are stored correctly in each resident's flat; the care plan records storage requirements; staff check storage conditions and report any concerns$$,
  $$Reg 12$$,
  $$Care plans with medicines storage instructions; evidence of action when storage conditions were not met; medicines stored securely where indicated$$,
  5
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-MT-06$$, NULL,
  $$A medicines audit is carried out regularly; it checks MAR accuracy, PRN protocol completeness, staff competency currency and storage compliance$$,
  $$Reg 12$$,
  $$Medicines audit records; frequency of audits; actions arising from findings; evidence of follow-up$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-SS-02$$, NULL,
  $$Staffing levels are sufficient to meet the care needs of all residents at all times of the day; rotas are planned in advance and shortfalls are covered without compromising the quality of care$$,
  $$Reg 18$$,
  $$Staffing rotas; evidence of planned versus actual staffing levels; records of how shortfalls were covered; resident feedback on responsiveness of staff$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-SS-03$$, NULL,
  $$Night-time cover arrangements are in place; a sleep-in or waking night member of staff is on-site and able to respond to pendant activations and emergencies throughout the night$$,
  $$Reg 18$$,
  $$Night cover rota; evidence of sleep-in or waking night cover; pendant activation log including night-time responses; any gaps in night cover documented and covered$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-SS-04$$, NULL,
  $$All new staff complete an induction that meets Care Certificate standards before working unsupervised; induction records are signed off by the manager$$,
  $$Reg 18$$,
  $$Care Certificate completion records; induction sign-off; evidence of supervised practice before working independently$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-SS-05$$, NULL,
  $$Agency or bank staff receive an orientation to the scheme before their first shift; they are given access to relevant care plans and are not assigned to residents whose needs exceed their competency$$,
  $$Reg 18$$,
  $$Agency orientation records; evidence of care plan access before first shift; competency matching records for complex care residents$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-SG-02$$, NULL,
  $$All staff are trained in safeguarding adults at the appropriate level for their role; training is refreshed in line with local authority requirements$$,
  $$Reg 13$$,
  $$Safeguarding training matrix; certificates; refresher due dates; evidence of level-appropriate training$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-SG-03$$, NULL,
  $$Safeguarding referrals to the local authority are made promptly and correctly; a referral log is maintained including outcomes; the housing provider is notified where a safeguarding concern relates to the building or communal areas$$,
  $$Reg 13$$,
  $$Safeguarding referral log; evidence of LA acknowledgement; referral outcomes; timeliness of referrals; evidence of housing provider notification where relevant$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-SG-04$$, NULL,
  $$A designated safeguarding lead is identified; they are contactable during and outside office hours and have received safeguarding lead training$$,
  $$Reg 13$$,
  $$Named safeguarding lead; out-of-hours contact arrangements; safeguarding lead training certificate$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-EI-01$$, NULL,
  $$PPE is provided to all staff for use in residents' flats; an IPC policy sets out when and how PPE is used; staff are observed using PPE correctly during spot checks$$,
  $$Reg 12$$,
  $$IPC policy; PPE provision records; spot check observations confirming correct PPE use$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-EI-03$$, NULL,
  $$Clinical waste generated in residents' flats is disposed of in line with the IPC policy and local waste disposal requirements; arrangements with the housing provider for communal waste handling are in place$$,
  $$Reg 12$$,
  $$IPC policy section on waste disposal; evidence of correct waste disposal methods; any waste disposal incidents recorded; housing provider waste arrangements$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-EI-04$$, NULL,
  $$When a resident has a known infection, a care plan risk assessment is completed; staff are given appropriate guidance and enhanced PPE; the housing provider is notified where communal area use needs to be restricted$$,
  $$Reg 12$$,
  $$Infection-specific risk assessments; evidence of communication to staff; records of enhanced precautions; housing provider notification where communal area access was restricted$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-SC-02$$, NULL,
  $$The duty of candour is applied; residents and, where appropriate, their families are informed promptly and openly when something has gone wrong during their care$$,
  $$Reg 20$$,
  $$Duty of candour records; evidence of notification to residents or families following incidents; apology records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-SC-03$$, NULL,
  $$A whistleblowing policy is in place; staff know how to raise concerns internally and externally including to CQC; there is no evidence of a culture that discourages reporting$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-ST-01$$, NULL,
  $$A welfare check protocol is in place for when a resident does not respond to a pendant activation or scheduled visit; it includes escalation to family, emergency services and out-of-hours management$$,
  $$Reg 12$$,
  $$Welfare check protocol; records of instances when the protocol was activated; evidence of escalation steps taken and outcomes$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$SAF-ST-02$$, NULL,
  $$Information about a resident's care is shared safely with other professionals and the housing provider when a transition occurs; information governance requirements are met$$,
  $$Reg 17$$,
  $$Evidence of information sharing with community teams and housing on transitions; hospital admission and discharge notifications; evidence of consent or lawful basis for sharing$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-AN-01$$, NULL,
  $$A thorough needs assessment is completed before care begins; it covers health, functional ability, social, cultural, religious, communication and dietary needs$$,
  $$Reg 9$$,
  $$Pre-care needs assessments; evidence of assessor competency; date of assessment relative to move-in date$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-AN-02$$, NULL,
  $$Care plans are person-centred, written with the resident and their family, and are kept in the resident's flat; they are accessible to all staff working on the scheme$$,
  $$Reg 9$$,
  $$Care plans in flats; evidence of co-production with resident; care plans signed by resident or their representative$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-AN-03$$, NULL,
  $$Care plans are reviewed at least every 12 months and following any change in need, hospital admission, discharge, incident or safeguarding concern$$,
  $$Reg 9$$,
  $$Care plan review dates; evidence of triggered reviews following changes; updated care plans dated and signed$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-AN-04$$, NULL,
  $$Input from other professionals (district nurse, occupational therapist, GP, SALT, community mental health) is incorporated into care plans and acted upon$$,
  $$Reg 9$$,
  $$Evidence of professional input in care plans; referral records; correspondence with community professionals; evidence of recommendations being implemented$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-AN-05$$, NULL,
  $$The resident's personal outcomes and goals are documented in the care plan; progress towards outcomes is reviewed at each care plan review$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CP-01$$, NULL,
  $$Continuity of care workers is promoted through consistent rota allocation; residents are introduced to new staff before they work with them alone$$,
  $$Reg 9$$,
  $$Rota records showing staff consistency per resident; evidence of introductions before lone working; communications to residents about staffing changes$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CP-02$$, NULL,
  $$Handover between staff is effective; changes in a resident's condition are communicated to the next shift and, where clinically significant, to the relevant professional$$,
  $$Reg 9$$,
  $$Visit notes and daily logs in each flat; evidence of inter-shift communication; records of escalation to professionals when a change in condition was noted$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CP-03$$, NULL,
  $$The service works alongside district nurses, GPs, community mental health teams and other professionals; records of joint working and shared information are maintained$$,
  $$Reg 9$$,
  $$Records of multi-professional contact; joint visit records; evidence of care co-ordination with community teams$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CP-04$$, NULL,
  $$When a resident is discharged from hospital, the service is notified and adapts the care package before the first post-discharge visit; the housing provider is informed where flat adaptations may be needed$$,
  $$Reg 9$$,
  $$Hospital discharge notifications; updated care plans following discharge; timescales for review; communication with housing provider about any flat adaptations required$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CP-05$$, NULL,
  $$When a resident's care package changes significantly or ceases, a planned transition is arranged; where a resident needs to move to a more intensive setting, support is provided throughout the transition and the housing provider is notified$$,
  $$Reg 9$$,
  $$Care package change records; evidence of planned transition; communication with resident, family and housing provider; continuity of care during transition period$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-HL-01$$, NULL,
  $$Staff monitor and record changes in residents' health and wellbeing at each visit; concerns are escalated promptly to the appropriate professional$$,
  $$Reg 9$$,
  $$Visit notes and daily logs; records of health changes observed; evidence of timely escalation to GP, district nurse or 999 as appropriate$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-HL-02$$, NULL,
  $$Nutrition and hydration are supported in care plans; staff know when to prompt, assist or refer; communal dining is available and residents are encouraged but not required to attend; concerns about weight loss are escalated$$,
  $$Reg 14$$,
  $$Care plans with nutrition and hydration sections; communal dining records; evidence of referral to dietitian or GP for nutrition concerns; food and fluid records where indicated$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-HL-03$$, NULL,
  $$Social wellbeing is actively supported; staff facilitate residents' participation in communal activities and social connections both within the scheme and in the wider community$$,
  $$Reg 9$$,
  $$Activities programme; records of resident participation; evidence of support to maintain community connections; spot check feedback on social engagement$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-HL-04$$, NULL,
  $$Residents are supported to attend health appointments; transport or escort arrangements are documented in care plans$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-EQ-01$$, NULL,
  $$Care is delivered in line with relevant national guidance and best practice frameworks including NICE guidance and Skills for Care standards; training is updated when guidance changes$$,
  $$Reg 9$$,
  $$Evidence of staff training aligned to current guidance; references to NICE or Skills for Care in policies or care plans; evidence of practice updating when guidance is published$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-EQ-02$$, NULL,
  $$Outcomes are monitored across the resident group; any disparity in outcomes for people with protected characteristics is identified and addressed$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CT-01$$, NULL,
  $$Consent is obtained and recorded for all elements of care before care begins; consent is revisited if the resident's capacity changes or they withdraw agreement$$,
  $$Reg 11$$,
  $$Consent records in care plans; evidence of consent being revisited following changes in capacity or resident preference$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CT-02$$, NULL,
  $$Where a resident may lack capacity to consent, a Mental Capacity Act assessment is completed for each specific decision; a best interest decision is documented and reviewed; note: DoLS does not apply in Extra Care Housing as residents hold tenancy rights — MCA and Court of Protection apply$$,
  $$Reg 11$$,
  $$MCA assessments per decision; best interest meeting records; evidence of least restrictive option chosen; review dates for best interest decisions$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$EFF-CT-03$$, NULL,
  $$Advance decisions to refuse treatment (ADRTs) and Lasting Powers of Attorney (LPA) are recorded in care plans, shared with relevant professionals and honoured during care delivery$$,
  $$Reg 11$$,
  $$ADRT and LPA records in care plans; evidence of sharing with GP or district nurse; evidence of decisions being honoured$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-KD-01$$, NULL,
  $$Staff knock and announce themselves before entering a resident's flat; they treat the flat as the resident's home and ask permission before entering rooms or moving belongings$$,
  $$Reg 10$$,
  $$Spot check observation records; resident and family feedback; supervision records addressing dignity and respect in residents' own flats$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-KD-02$$, NULL,
  $$Residents are treated with dignity during personal care; their preferences for how and by whom care is delivered are respected and recorded in care plans$$,
  $$Reg 10$$,
  $$Care plans recording personal care preferences; spot check observations; resident feedback confirming dignity is maintained$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-KD-03$$, NULL,
  $$Family members and carers are involved in care discussions where the resident wishes; their role is acknowledged and supported$$,
  $$Reg 9$$,
  $$Care plans noting family involvement preferences; evidence of family being included in reviews; carer support information provided$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-KD-04$$, NULL,
  $$Spot checks include direct observation of care delivery in the resident's flat to confirm dignity, respect and person-centred practice$$,
  $$Reg 17$$,
  $$Spot check records including observations in flats; feedback from residents following spot checks; actions taken following any concerns observed$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-IC-01$$, NULL,
  $$Care plans promote the maximum level of independence; tasks are designed to enable, not replace, the resident's own abilities; reablement approaches are used where appropriate$$,
  $$Reg 9$$,
  $$Outcomes-focused care plans; evidence of enabling or reablement approach; review of whether care tasks have been reduced as independence improves$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-IC-02$$, NULL,
  $$Residents' tenancy rights are respected in care delivery; residents can have visitors, personalise their flat, make their own daily choices and come and go freely; care plans do not restrict these rights$$,
  $$Reg 9$$,
  $$Care plans that do not impose unlawful restrictions; evidence of residents exercising tenancy rights without interference; any restrictions documented with MCA justification$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-IC-03$$, NULL,
  $$Residents can adjust their care package — including increasing, decreasing or ending support — without having to leave the scheme; the process for requesting changes is clear and accessible$$,
  $$Reg 9$$,
  $$Evidence of care package changes accommodated within the scheme; resident feedback on flexibility; records of how requests for changes were handled and the outcome$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-EE-02$$, NULL,
  $$All staff complete equality and diversity training; care delivery actively considers the cultural, religious and lifestyle preferences of each resident$$,
  $$Reg 18$$,
  $$Equality and diversity training matrix; care plans recording cultural or religious preferences; evidence of preferences being honoured in care and in communal activity planning$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-LR-01$$, NULL,
  $$Residents have regular opportunities to give feedback; resident meetings and annual satisfaction surveys are conducted and the results are shared with staff and the housing provider$$,
  $$Reg 17$$,
  $$Satisfaction survey records; resident meeting minutes; evidence of results being shared; response rate and themes identified$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$CAR-LR-02$$, NULL,
  $$Feedback from residents shapes care planning and service improvement; there is evidence that suggestions have led to tangible changes$$,
  $$Reg 17$$,
  $$Examples of improvements made in response to feedback; evidence shared with residents that their feedback was acted on$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$RES-PC-01$$, NULL,
  $$Care plans reflect each resident's individual preferences, cultural and religious needs, life history, social interests and communication style$$,
  $$Reg 9$$,
  $$Care plans with individual preference sections completed; evidence of life history, cultural and religious needs documented and reflected in care and activity planning$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$RES-PC-02$$, NULL,
  $$The service responds promptly when a resident's needs change; care plans are amended and all staff are informed before the next shift$$,
  $$Reg 9$$,
  $$Records of urgent care plan amendments; evidence of communication to all scheme staff following changes; timescales from change in need to updated care plan$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$RES-PC-03$$, NULL,
  $$End of life preferences, including preferred place of death, DNACPR decisions and advanced care plans, are documented and shared with relevant professionals where the resident consents$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$RES-TA-01$$, NULL,
  $$Pendant and emergency call activations are responded to within an agreed timescale; response times are monitored and reviewed; any pattern of delayed responses is addressed$$,
  $$Reg 9$$,
  $$Pendant activation log with response times; evidence of manager review; any delayed response investigated; service level targets for pendant response$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$RES-TA-02$$, NULL,
  $$New residents receive their first care visit within the agreed timeframe following move-in; care assessments are completed promptly to allow care to begin safely$$,
  $$Reg 9$$,
  $$Move-in to care start records; evidence of timescales met; records of delays and reasons$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$RES-TA-03$$, NULL,
  $$Care packages can be increased or decreased in response to changing needs without requiring residents to leave the scheme; the process is flexible and timely$$,
  $$Reg 9$$,
  $$Records of care package changes accommodated within the scheme; timescales from assessment to change in care provision; evidence that no resident had to move unnecessarily$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$RES-TA-04$$, NULL,
  $$When a regular care worker is unavailable, a suitable replacement is identified and the resident is notified; cover is always available on-site and care is not cancelled$$,
  $$Reg 9$$,
  $$Records of cover arrangements; evidence of advance notification to residents; records of any short-notice cover and how it was managed$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-CL-01$$, NULL,
  $$A registered manager is in post and is available to staff and residents; any absence is covered by an appropriately experienced deputy; CQC is notified of any changes to the registered manager$$,
  $$Reg 7$$,
  $$CQC registration records; registered manager's DBS and qualifications; absence cover arrangements; evidence of availability to staff and residents$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-CL-02$$, NULL,
  $$All staff receive regular supervision; spot checks include direct observation of care in residents' flats; both supervision and spot check records document performance and any concerns$$,
  $$Reg 18$$,
  $$Supervision records including frequency and content; spot check records showing in-flat observations; evidence of actions arising from supervision or spot checks$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-CL-03$$, NULL,
  $$The service has a clear set of values; leaders model those values and staff can describe how they influence day-to-day care$$,
  $$Reg 17$$,
  $$Statement of values; evidence of values in induction and training; staff able to describe how values apply to their work$$,
  3
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-CL-04$$, NULL,
  $$Staff wellbeing is actively supported; workload, shift patterns and night cover arrangements are managed to protect staff wellbeing; mechanisms are in place for staff to raise concerns$$,
  $$Reg 18$$,
  $$Staff wellbeing policy; evidence of wellbeing support arrangements; staff survey or supervision records relating to workload and shift patterns$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-GM-01$$, NULL,
  $$A quality assurance programme is in place including regular audits of care records, medicines, safeguarding and pendant response times; audit results are acted upon$$,
  $$Reg 17$$,
  $$Quality audit schedule; completed audit reports; evidence of actions arising from audits; improvement tracked over time$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-GM-04$$, NULL,
  $$A business continuity plan is in place covering staff shortages, telecare system failure, adverse weather and pandemic response; it is tested and reviewed annually$$,
  $$Reg 17$$,
  $$Business continuity plan; evidence of annual review; evidence of plan being activated or tested; telecare system failure protocol$$,
  4
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-GM-05$$, NULL,
  $$A complaints procedure is in place and accessible to residents; complaints are acknowledged within 3 working days, investigated thoroughly and resolved with written outcomes$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-PC-01$$, NULL,
  $$The service has established relationships with the commissioning local authority and/or ICB; it attends provider forums and engages in strategic conversations about the role of extra care housing in local care pathways$$,
  $$Reg 17$$,
  $$Evidence of attendance at provider forums; commissioner monitoring visit records; correspondence with local authority or ICB$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-PC-02$$, NULL,
  $$A formal interface arrangement is in place with the housing provider covering responsibilities for building safety, communal area maintenance, safeguarding notifications, emergency access and information sharing$$,
  $$Reg 17$$,
  $$Service Level Agreement or Memorandum of Understanding with housing provider; evidence of regular liaison meetings; clear allocation of responsibility for building safety and communal areas; joint safeguarding protocols$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-PC-03$$, NULL,
  $$The service connects residents with community resources, local voluntary organisations and social activities beyond the scheme; links to the wider community are actively maintained$$,
  $$Reg 9$$,
  $$Evidence of signposting or referrals to community groups; care plans noting community activities supported; feedback from residents on community connections made$$,
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
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
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-SD-01$$, NULL,
  $$The service has a clear vision and strategic plan; leaders can articulate priorities for improvement and these are reflected in operational decisions$$,
  $$Reg 17$$,
  $$Service development plan or strategy; evidence of leaders referring to strategic priorities; progress against strategic goals reviewed$$,
  1
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$WEL-SD-02$$, NULL,
  $$Financial sustainability of the service is managed responsibly; there is evidence that resource allocation does not compromise the quality or safety of care$$,
  $$Reg 17$$,
  $$Evidence of financial oversight; any cost pressures documented and impact on care assessed; commissioner or owner financial governance records$$,
  2
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- DEMENTIA SUB-SERVICE — Extra Care Housing
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-SAF-01$$, $$Dementia$$,
  $$A risk assessment is in place for each resident living with dementia covering wandering within and outside the scheme, getting lost, night-time risks and the safety of shared communal areas; the plan balances safety with the right to move freely$$,
  $$Reg 12$$,
  $$Dementia-specific risk assessments; management plans; evidence of family and professional involvement; any telecare or sensor technology used; evidence of review following incidents$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-SAF-02$$, $$Dementia$$,
  $$Where a resident living with dementia lacks capacity to consent to taking medicines, a covert administration protocol is in place, documented, authorised by the GP and reviewed at each medicines review$$,
  $$Reg 12$$,
  $$Covert medicine protocols per resident; MCA best interest decision records; GP authorisation; MAR charts; evidence of regular review$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-SAF-03$$, $$Dementia$$,
  $$All staff working with residents living with dementia receive dementia-specific training covering types of dementia, communication approaches, behaviour support and person-centred care in an extra care housing setting$$,
  $$Reg 18$$,
  $$Dementia training matrix and certificates; training covering ECH-specific dementia care; refresher records$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-EFF-01$$, $$Dementia$$,
  $$Care plans for residents living with dementia document the type and date of diagnosis, current cognitive baseline and any changes; all scheme staff are briefed on the person's current presentation$$,
  $$Reg 9$$,
  $$Care plans with dementia diagnosis details; cognitive assessment information; handover notes to all scheme staff; evidence of care plan updates when cognition changes$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-EFF-02$$, $$Dementia$$,
  $$Where a resident living with dementia presents with swallowing difficulties, a referral is made to community SALT; SALT recommendations are documented in the care plan, communicated to all staff and followed at mealtimes including in the communal dining room$$,
  $$Reg 14$$,
  $$SALT referral records; assessment outcomes in care plans; modified diet or texture guidance communicated to all staff including dining room staff; evidence of implementation$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-EFF-03$$, $$Dementia$$,
  $$Where a resident living with dementia may lack capacity to consent to care decisions, a Mental Capacity Act assessment is completed for each specific decision; best interest decisions are documented and reviewed; note: DoLS does not apply as residents hold tenancy rights — MCA and Court of Protection apply$$,
  $$Reg 11$$,
  $$MCA assessments per decision; best interest meeting records with family or advocate involvement; review dates; evidence of least restrictive option chosen$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-EFF-04$$, $$Dementia$$,
  $$Flats occupied by residents living with dementia are assessed for dementia-friendly features; adaptations such as visual cues, contrasting colours and reduced clutter are recommended and, where agreed with the resident and housing provider, supported$$,
  $$Reg 12$$,
  $$Flat environment risk assessments noting dementia-specific factors; evidence of recommendations made; records of adaptations agreed with resident or family and housing provider$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-CAR-01$$, $$Dementia$$,
  $$A life history document ("This Is Me" or equivalent) is completed for each resident living with dementia; it is kept in their flat and used by all scheme staff to provide consistent, person-centred care$$,
  $$Reg 9$$,
  $$Completed "This Is Me" or life history documents; evidence accessible to all scheme staff; evidence of updates over time$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-CAR-02$$, $$Dementia$$,
  $$Meaningful activities and social connections are supported for residents living with dementia including participation in communal activities adapted to their cognitive ability$$,
  $$Reg 9$$,
  $$Care plans noting preferred activities and interests; evidence of dementia-adapted activities in the communal programme; spot check observations of engagement; resident and family feedback$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-RES-01$$, $$Dementia$$,
  $$Communication needs for residents living with dementia are documented in care plans; all scheme staff use adapted techniques including simple language, familiar routines and validation approaches$$,
  $$Reg 9$$,
  $$Communication needs assessments in care plans; evidence of communication guidance shared with all staff; spot check observations of communication approaches$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-WEL-01$$, $$Dementia$$,
  $$A dementia lead or champion is in post within the scheme; they support staff development, promote best practice in dementia care and monitor quality for residents living with dementia$$,
  $$Reg 17$$,
  $$Named dementia lead or champion; evidence of their role in training or quality monitoring; any dementia-specific audits or improvement work$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Extra Care Housing$$),
  $$Core$$, $$DEM-WEL-02$$, $$Dementia$$,
  $$The service has established links with memory clinics, Admiral Nurses or Dementia UK; these are accessed when a resident's dementia-related needs escalate or when families need support$$,
  $$Reg 17$$,
  $$Referral pathways to memory clinic or Admiral Nurse; evidence of referrals made; outcomes followed up; evidence of family signposting to dementia support organisations$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
