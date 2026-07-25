-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260724000007_supported_living_checklist_cqc_language
-- Purpose : Replace all AI-written Supported Living checklist items with
--           verbatim CQC Good-level characteristic language from the
--           Adult Social Care Assessment Framework (Draft v9).
--           Delete DEM- dementia sub-service items (no CQC equivalent).
--           Insert gap items for all CQC Good-level topics not previously covered.
-- Rule    : Every checklist_item is a direct verbatim quote from CQC Good
--           characteristics. No paraphrasing. No service-specific modifications.
-- ─────────────────────────────────────────────────────────────────────────────


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 1 — DELETE dementia sub-service items
-- ════════════════════════════════════════════════════════════════════════════

DELETE FROM public.klo_checklist_items
WHERE ref LIKE $$DEM-%$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 2 — UPDATE existing 30 core items with verbatim CQC Good-level text
-- ════════════════════════════════════════════════════════════════════════════

-- ── SAFE — Managing risks during care and treatment ──────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People's care plans reflect any foreseeable risks and how they should be managed. Deterioration, emergencies and clinical risks are anticipated where possible and managed to reduce the potential for harm.$$
WHERE ref = $$SAF-MR-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are respected and protected from avoidable harm because care is provided in line with recognised good practice guidance.$$
WHERE ref = $$SAF-MR-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Care, support and treatment are discussed with people so they understand the potential risks and side effects. Where appropriate, people and those close to them are actively involved in managing their own risks.$$
WHERE ref = $$SAF-MR-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service has a process to ensure that any restrictions on people's freedom, choice and control are necessary, proportionate and safe. This particularly includes where people lack mental capacity.$$
WHERE ref = $$SAF-MR-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── SAFE — Safeguarding ───────────────────────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective safeguarding systems, processes and practices, managed by appropriately trained staff, which protect people from abuse, neglect, harassment and breaches of their dignity. These operate in line with legislation and guidance, are communicated effectively and are accessible to people, staff and visitors to the service.$$
WHERE ref = $$SAF-SG-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff can identify abuse and improper treatment. They recognise early indicators of potential abuse or poor care, even when these do not meet the threshold for formal safeguarding concerns. Staff act quickly and appropriately to protect people, working closely with partners.$$
WHERE ref = $$SAF-SG-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Information about people who have suffered harm or are at risk of harm is shared appropriately with other agencies, such as the local authority, in a timely way. Staff use appropriate escalation pathways when concerns are not addressed.$$
WHERE ref = $$SAF-SG-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── SAFE — Safe staffing (legacy refs SAF-ST-) ───────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$Thorough and safe recruitment practices ensure staff, including agency staff and volunteers, are suitably experienced, qualified and competent to carry out their roles.$$
WHERE ref = $$SAF-ST-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are appropriate staffing levels and skill mix to meet people's needs. Individual needs are taken into consideration so that when people receive one-to-one support, the skills and experience of staff are matched to the person's needs.$$
WHERE ref = $$SAF-ST-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── SAFE — Safe medicines (legacy refs SAF-MM-) ──────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear approach to the safe use of medicines, and roles and responsibilities are understood.$$
WHERE ref = $$SAF-MM-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Where the service is responsible, medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance.$$
WHERE ref = $$SAF-MM-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── EFFECTIVE — Assessing needs (legacy refs EFF-CP-) ────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People's needs are comprehensively assessed, and reflect their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics.$$
WHERE ref = $$EFF-CP-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Assessments are regularly reviewed and updated to make sure staff have current information, so that care, support and treatment is meeting people's needs and individual outcomes as expected.$$
WHERE ref = $$EFF-CP-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People's communication needs are assessed and met to maximise the effectiveness of care, support and treatment.$$
WHERE ref = $$EFF-CP-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── EFFECTIVE — Safe staffing / training (legacy refs EFF-TD-) ───────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There are induction, supervision and appraisal processes to support staff to develop and improve services (including professional revalidation where needed).$$
WHERE ref = $$EFF-TD-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Actions are taken to protect staff from fatigue, and leaders understand its impact on the safety of those who use services.$$
WHERE ref = $$EFF-TD-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── EFFECTIVE — Consent to care and treatment (legacy refs EFF-CT-) ──────────

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff know the importance of consent and relevant legal requirements. They make sure people understand what they are consenting to before they deliver care, support or treatment. People are given the appropriate information, support and time they need to make an informed decision.$$
WHERE ref = $$EFF-CT-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear understanding of the requirements of the Mental Capacity Act 2005 and guidance relating to capacity and consent, and staff demonstrate how they put these into practice effectively. People are supported to understand information, communicate and make decisions about their life, care, support and treatment in line with the Mental Capacity Act 2005, involving their representatives and advocates when needed.$$
WHERE ref = $$EFF-CT-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── EFFECTIVE — Supporting healthier lives (legacy refs EFF-HL-) ─────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service works with people who use services and professionals to plan and enable access to health and social care support to achieve good health and wellbeing outcomes. This includes facilitating reasonable adjustments, supporting people to access health checks or to complete healthcare passports.$$
WHERE ref = $$EFF-HL-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Risks to people's health and wellbeing are identified and support to prevent deterioration is prioritised. This includes understanding specific risks for a person due to their needs and specific health conditions, keeping well in hot and cold weather and supporting people to remain as active and mobile as possible.$$
WHERE ref = $$EFF-HL-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── CARING — Independence, choice and control ────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$If people wish to, they are encouraged and enabled to access meaningful activities, hobbies and interests in a personalised way. People are offered meaningful and genuine choices.$$
WHERE ref = $$CAR-IC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to establish and maintain relationships and networks that are important to them, with access to family, friends, cultural connections, and advocacy support while using the service. When applicable, visiting restrictions are limited to exceptional circumstances in accordance with guidance and legislation.$$
WHERE ref = $$CAR-IC-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to make decisions about end of life preferences and advance decisions if they wish to. People who may be approaching the end of their life are identified to ensure their needs are met, in line with their preferences and choices, and the right support is provided.$$
WHERE ref = $$CAR-IC-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── RESPONSIVE — Care provision (legacy refs RES-RC-) ────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service understands the diverse needs of the people who use it and tailors their support accordingly. This includes recognising and responding to the needs of people with protected equality characteristics and those most at risk of experiencing poorer care or facing barriers to accessing care.$$
WHERE ref = $$RES-RC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service works collaboratively and flexibly with others. People experience continuity of care, support and treatment; this includes working with commissioners to manage continuity of care.$$
WHERE ref = $$RES-RC-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── RESPONSIVE — Listening to feedback (legacy ref RES-CF-) ──────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People and those close to them understand how to give feedback, make suggestions or complain about care, support and treatment. They can do this in a way that meets their needs.$$
WHERE ref = $$RES-CF-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

-- ── WELL-LED — Governance and management ─────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service has an accurate statement of purpose that clearly reflects current service provision.$$
WHERE ref = $$WEL-GM-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective systems for monitoring and managing service performance, risk and learning from incidents that support innovation while maintaining the quality of care at the service.$$
WHERE ref = $$WEL-GM-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are secure and reliable arrangements for the availability, integrity and confidentiality of data, records and data management systems. Information is used effectively to monitor and improve the quality of care. Staff understand their responsibilities when collecting and sharing information.$$
WHERE ref = $$WEL-GM-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are thorough business continuity plans in place for emergencies or natural disasters, such as adverse weather events, and staff know how to put these into practice.$$
WHERE ref = $$WEL-GM-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Supported Living$$);


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 3 — INSERT gap items for all CQC Good-level characteristics
--             not covered by the existing 30 core items
-- ════════════════════════════════════════════════════════════════════════════

-- ── SAFE — Safety culture ─────────────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SC-01$$, NULL,
  $$All incidents are recorded, investigated and outcomes are communicated to those involved. If harm has occurred, people are given full details of what happened, why, and what has been learned.$$,
  $$Reg 12, Reg 20$$,
  $$Incident log; investigation records and outcomes; evidence of communication to people and families following incidents; duty of candour records including apology and explanation$$,
  31
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SC-02$$, NULL,
  $$There is a good understanding of the duty of candour. When an incident has happened, staff are open and transparent with people and those close to them.$$,
  $$Reg 20$$,
  $$Duty of candour policy; evidence of staff training on duty of candour; records of duty of candour conversations; evidence of openness following incidents$$,
  32
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SC-03$$, NULL,
  $$There is a strong learning culture in which incidents that have caused harm, or could cause harm, are treated as opportunities to improve.$$,
  $$Reg 12$$,
  $$Evidence of learning shared following incidents; changes made to practice as a result of incidents; learning logs; staff meetings or briefings discussing safety learning$$,
  33
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SC-04$$, NULL,
  $$Complaints, concerns and other feedback about safety are welcomed and prioritised as key sources used to identify and manage safety risks before safety incidents happen.$$,
  $$Reg 12$$,
  $$Evidence that safety feedback is captured and analysed; records of proactive risk identification from complaints or concerns; feedback review records$$,
  34
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SC-05$$, NULL,
  $$The service looks for safety-related themes and trends. Patient safety alerts are consistently reviewed and acted on, and learning from external safety incidents is embedded in the delivery of care.$$,
  $$Reg 12$$,
  $$Evidence of safety alert reviews and actions taken; thematic analysis of incidents; records of external learning embedded in practice; safety trend reports$$,
  35
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SC-06$$, NULL,
  $$Staff and leaders understand what constitutes a closed culture and the risks to people, including organisational abuse. There are systems and processes in place to identify concerns and prevent closed cultures from developing, and appropriate action is taken when needed.$$,
  $$Reg 13$$,
  $$Closed culture awareness training records; monitoring visit records noting culture observations; whistleblowing policy; evidence of action where closed culture concerns were identified$$,
  36
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safety culture$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ── SAFE — Managing risks during care and treatment ───────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MR-05$$, NULL,
  $$Restraint is only ever used as a last resort and there is a clear commitment from all staff to minimising the use of restrictive interventions in the service. If staff use restraint, it is lawful, for a legitimate purpose, safe and necessary, and staff follow good practice.$$,
  $$Reg 12$$,
  $$Restraint policy; records of any restraint use with rationale and outcome; evidence of de-escalation attempts before restraint; post-incident review records; staff training on restraint and de-escalation$$,
  37
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Managing risks during care and treatment$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ── SAFE — Safe systems, pathways and transitions ─────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SP-01$$, NULL,
  $$Plans and information for care during transitions are established and shared before people move between services. Plans consider people's individual needs, circumstances, ongoing care arrangements and expected outcomes.$$,
  $$Reg 12$$,
  $$Transition planning records; information sharing documentation ahead of moves; plans covering individual needs and outcomes; evidence received by receiving service before placement starts$$,
  38
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SP-02$$, NULL,
  $$Safety and continuity are maintained across people's care journeys through collaborative working with people, staff and partners. This includes where people are moving between or accessing multiple services.$$,
  $$Reg 12$$,
  $$Multi-agency coordination records; evidence of safety maintained during transitions; communication records between services; joint working protocols$$,
  39
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SP-03$$, NULL,
  $$Staff work together proactively with teams in other services, commissioners and people using the service to deliver co-ordinated, timely, consistent and person-centred care, support and treatment. Actions are appropriately owned and followed up.$$,
  $$Reg 12$$,
  $$Records of multi-professional meetings and actions; evidence of coordinated working with commissioners and other services; action logs with ownership and follow-up; person-centred care coordination records$$,
  40
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SP-04$$, NULL,
  $$When people have needs that are outside of the service's remit, staff adapt support and escalate issues to relevant agencies.$$,
  $$Reg 12$$,
  $$Records of escalation to external agencies; evidence of adaptation of support when needs exceed remit; referral records and outcomes; escalation actions recorded in care records$$,
  41
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SP-05$$, NULL,
  $$The service has appropriate systems and processes to manage its responsibilities in relation to delegated healthcare activities safely, in line with good practice.$$,
  $$Reg 12$$,
  $$Delegated healthcare activity records; competency assessments for delegated tasks; protocols for delegated activities; evidence of oversight by registered professionals; training records for delegated healthcare tasks$$,
  42
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe systems, pathways and transitions$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ── SAFE — Safeguarding ───────────────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SG-04$$, NULL,
  $$People are deprived of their liberty lawfully. Any potential deprivation of liberty is recognised promptly and appropriate authorisation is sought. Where applicable, the Deprivation of Liberty Safeguards (DoLS) are used appropriately and only when it is in the best interests of the person.$$,
  $$Reg 13$$,
  $$DoLS screening records per relevant person; DoLS applications where criteria are met; DoLS authorisations held on file; evidence conditions are met and reviewed; IMCA involvement records where required$$,
  43
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SG-05$$, NULL,
  $$People are supported to understand what safeguarding means and how to raise concerns on behalf of themselves and others, and are encouraged and empowered to do so.$$,
  $$Reg 13$$,
  $$Evidence that people have been informed about safeguarding in an accessible way; easy-read or accessible safeguarding information; records of safeguarding conversations with people supported; evidence that people know how to raise a concern$$,
  44
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safeguarding$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ── SAFE — Safe environments and infection prevention and control ──────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-EI-01$$, NULL,
  $$Fire safety procedures are effective. Concerns are escalated appropriately where the service is not directly responsible for the premises.$$,
  $$Reg 12$$,
  $$Fire safety records; evidence concerns about fire safety in people's homes are escalated; fire safety checks during visits; service fire safety policy$$,
  45
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-EI-02$$, NULL,
  $$Where the provider is responsible, there is a comprehensive system to proactively manage the safety and upkeep of the premises (including communal and personal spaces) and equipment, and risks are assessed and controlled. Professionally qualified and competent people complete the necessary environmental and equipment checks and maintenance.$$,
  $$Reg 12$$,
  $$Home environment assessment records; equipment checks carried out during visits; records of concerns identified and actions taken; qualified person sign-off on required checks$$,
  46
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-EI-03$$, NULL,
  $$The service manages the control and prevention of infection well. Infection prevention and control roles are clear. The risk of infection is minimised because premises and equipment are kept clean and hygienic.$$,
  $$Reg 12$$,
  $$IPC policy; evidence of IPC guidance shared with staff; records of IPC concerns and actions; staff training on infection prevention$$,
  47
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-EI-04$$, NULL,
  $$The service monitors and acts on equipment alerts, recalls and safety information.$$,
  $$Reg 12$$,
  $$Evidence that equipment alerts and recalls are monitored; records of actions taken following alerts; process for sharing equipment safety information with staff; evidence of timely response to safety notices$$,
  48
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-EI-05$$, NULL,
  $$Facilities, equipment (including special or adaptive equipment) and technology that are the responsibility of the service are maintained, stored and used in line with good practice and guidance.$$,
  $$Reg 12$$,
  $$Equipment maintenance records; adaptive equipment records per person; evidence equipment is used and stored correctly; records of equipment provided to and used by people supported$$,
  49
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe environments and infection prevention and control$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ── SAFE — Safe staffing ──────────────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SS-01$$, NULL,
  $$There are appropriate staffing levels and skill mix to meet people's needs. Individual needs are taken into consideration so that when people receive one-to-one support, the skills and experience of staff are matched to the person's needs.$$,
  $$Reg 18$$,
  $$Staffing rotas; evidence rotas reflect individual assessed needs; staff skill mix records; records of one-to-one support arrangements; evidence of how staffing gaps are managed$$,
  50
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SS-02$$, NULL,
  $$Thorough and safe recruitment practices ensure staff, including agency staff and volunteers, are suitably experienced, qualified and competent to carry out their roles.$$,
  $$Reg 19$$,
  $$Staff recruitment files; DBS certificates and renewal dates; reference records; employment history gap checks; interview records; evidence of competency checks$$,
  51
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SS-03$$, NULL,
  $$Actions are taken to protect staff from fatigue, and leaders understand its impact on the safety of those who use services.$$,
  $$Reg 18$$,
  $$Staff working hours records; evidence of action to manage workload and prevent fatigue; policy on hours and rest; records of cover arrangements during absence; manager review of staffing levels$$,
  52
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-SS-04$$, NULL,
  $$There are induction, supervision and appraisal processes to support staff to develop and improve services (including professional revalidation where needed).$$,
  $$Reg 18$$,
  $$Induction records; supervision records with frequency against policy; appraisal records; evidence of professional revalidation where required; evidence development needs are identified and met$$,
  53
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe staffing$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ── SAFE — Safe medicines and treatments ──────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MT-01$$, NULL,
  $$There is a clear approach to the safe use of medicines, and roles and responsibilities are understood.$$,
  $$Reg 12$$,
  $$Medicines policy; evidence that staff understand their medicines responsibilities; MAR charts accurately maintained; medicines audit records$$,
  54
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MT-02$$, NULL,
  $$Controlled drugs are stored, recorded, administered and disposed of in line with legislation and guidance.$$,
  $$Reg 12$$,
  $$Controlled drugs register; storage records; evidence of disposal in line with guidance; records of any discrepancies and actions taken$$,
  55
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MT-03$$, NULL,
  $$Where the service is responsible, medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance.$$,
  $$Reg 12$$,
  $$MAR charts; medicines competency assessments for relevant staff; medicines ordering and disposal records; medicines error log; evidence of investigation and learning following errors$$,
  56
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MT-04$$, NULL,
  $$The administration of PRN medicines (medicines taken when required) is guided by clear protocols, and there are timely reviews.$$,
  $$Reg 12$$,
  $$PRN protocols per person and medicine; evidence protocols are reviewed regularly; MAR records showing PRN administration; review records for PRN protocols$$,
  57
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MT-05$$, NULL,
  $$People and their representatives are involved in assessments, reviews and decisions, including the level of support needed and self-medication. This is clearly documented in care records.$$,
  $$Reg 9$$,
  $$Evidence of person and family involvement in medicines decisions; self-medication assessments; care records documenting medicines decisions; review records showing person's involvement$$,
  58
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$SAF-MT-06$$, NULL,
  $$The service actively considers opportunities to reduce the over-medication of people, in line with STOMP/STAMP principles where applicable.$$,
  $$Reg 12$$,
  $$Evidence of STOMP/STAMP awareness and application; medicines reviews where applicable; records of liaison with GPs or pharmacists about over-medication; evidence of actions taken to reduce unnecessary medicines$$,
  59
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Safe medicines and treatments$$ AND kq.name = $$Safe$$
ON CONFLICT DO NOTHING;

-- ── EFFECTIVE — Assessing needs ───────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-AN-01$$, NULL,
  $$People's needs are comprehensively assessed, and reflect their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics.$$,
  $$Reg 9$$,
  $$Needs assessments per person; evidence assessments cover all relevant domains; evidence of review; protected equality characteristics recorded$$,
  60
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-AN-02$$, NULL,
  $$Assessments are regularly reviewed and updated to make sure staff have current information, so that care, support and treatment is meeting people's needs and individual outcomes as expected.$$,
  $$Reg 9$$,
  $$Review dates on assessments and support plans; evidence reviews happened following changes; outcome tracking; evidence actions from reviews were followed through$$,
  61
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-AN-03$$, NULL,
  $$People's communication needs are assessed and met to maximise the effectiveness of care, support and treatment.$$,
  $$Reg 9$$,
  $$Communication needs assessments; evidence staff use person's preferred communication method; AAC, Makaton or PECS training records where relevant; accessible information provided$$,
  62
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-AN-04$$, NULL,
  $$People are involved as much as possible in their needs assessment and their needs are fully identified and understood. Where people need support to be involved, this is provided.$$,
  $$Reg 9$$,
  $$Evidence of person's involvement in assessments; records of support provided to enable participation; evidence assessments reflect person's own expressed needs; advocate or family involvement records$$,
  63
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Assessing needs$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ── EFFECTIVE — Evidence-based care and equitable outcomes ────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-EB-01$$, NULL,
  $$People's nutritional and hydration needs are met in line with current standards and good practice guidance. Where applicable, there is positive feedback from dietetic professionals that the service asks for their advice and applies it properly.$$,
  $$Reg 9$$,
  $$Support plans with nutrition and hydration sections; records of dietetic referrals and outcomes; evidence that dietetic advice is applied; nutrition and hydration monitoring records where required$$,
  64
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-EB-02$$, NULL,
  $$People are supported to plan and manage their dietary needs and associated risks, including risks of poor nutrition, dehydration, swallowing problems and other medical conditions that affect their health.$$,
  $$Reg 9$$,
  $$Dietary need assessments in support plans; SALT referrals and recommendations where relevant; records of swallowing assessments; evidence staff understand and apply dietary management plans$$,
  65
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-EB-03$$, NULL,
  $$There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment and the service takes action to continuously improve it.$$,
  $$Reg 9$$,
  $$Outcome monitoring records; evidence of improvement actions following outcome reviews; support plan review records; quality assurance processes linked to care effectiveness; evidence of practice improvement over time$$,
  66
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-EB-04$$, NULL,
  $$Staff monitor and evaluate outcomes related to people's health and quality of life, including those linked to their aspirations and skill development, and act to improve them when possible.$$,
  $$Reg 9$$,
  $$Outcome data linked to individual goals and aspirations; evidence of skill development tracked in support plans; quality of life monitoring; evidence of actions taken to improve outcomes$$,
  67
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-EB-05$$, NULL,
  $$Staff are aware of individual preferences in relation to eating and drinking and there is flexibility when needed or requested. There are good quality food choices and these respect individual wishes, including those relating to sensory, cultural, religious and ethical preferences.$$,
  $$Reg 9$$,
  $$Support plans documenting food and drink preferences including cultural, religious and sensory needs; evidence staff understand and apply individual food preferences; records of mealtime observations$$,
  68
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Evidence-based care and equitable outcomes$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ── EFFECTIVE — Supporting people to live healthier lives ─────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-HL-03$$, NULL,
  $$People are encouraged and supported to make healthier choices relating to diet, lifestyle, physical activity, personal and oral hygiene.$$,
  $$Reg 9$$,
  $$Support plan sections on healthy lifestyle; evidence of health promotion activities; records of support to access dental, optician or GP services; evidence of health promotion discussions$$,
  69
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Supporting people to live healthier lives$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ── EFFECTIVE — Consent to care and treatment ─────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-CT-03$$, NULL,
  $$People are supported to access independent advocacy, including statutory or non-statutory when available, and advocates are appropriately involved by the service.$$,
  $$Reg 11$$,
  $$Advocacy referral records; evidence advocates are involved in reviews and decisions; records of access to IMCA, IMHA or other advocacy; evidence people are aware of their right to an advocate$$,
  70
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$EFF-CT-04$$, NULL,
  $$The service makes lawful decisions in people's best interests when required. People are involved and their feelings, beliefs and values are considered. Those close to the person and their advocates are involved and kept informed of any changes as appropriate.$$,
  $$Reg 11$$,
  $$Best interests decision records; evidence of person involvement in best interests process; records of family, advocate and professional involvement; evidence decisions reflect person's feelings, beliefs and values$$,
  71
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Consent to care and treatment$$ AND kq.name = $$Effective$$
ON CONFLICT DO NOTHING;

-- ── CARING — Kindness, compassion and dignity ─────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-KD-01$$, NULL,
  $$There is a culture of kindness and respect across teams. People feel cared for with kindness, compassion, dignity and respect.$$,
  $$Reg 10$$,
  $$Feedback from people supported and families about how they are cared for; evidence from observations that staff are kind and respectful; records of any concerns about dignity and actions taken$$,
  72
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-KD-02$$, NULL,
  $$People's privacy, confidentiality, and respect are consistently upheld. Staff are discreet and challenge behaviour and practices that fall short of this. Staff have a clear understanding of the boundaries of confidentiality and work within these.$$,
  $$Reg 10$$,
  $$Confidentiality policy; evidence staff understand confidentiality boundaries; records of any breaches and actions; evidence privacy is upheld in personal care and daily life$$,
  73
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-KD-03$$, NULL,
  $$Staff genuinely care about people's wellbeing and show it in a thoughtful, meaningful way. They promptly respond to people's emotions, discomfort, distress, or urgent needs in a positive way.$$,
  $$Reg 10$$,
  $$Evidence from feedback and observations that staff respond promptly and compassionately; records of staff responses to distressed behaviour; feedback from people supported about how they are cared for$$,
  74
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Kindness, compassion and dignity$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ── CARING — Person-centred care ──────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-PC-01$$, NULL,
  $$People are at the centre of how their care, support and treatment is delivered. Care is tailored to the individual and is not task-focused.$$,
  $$Reg 9$$,
  $$Support plans evidencing person-centred approach; evidence care is not task-focused; feedback from people supported about whether care reflects their individuality; records of how care adapts to preferences$$,
  75
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-PC-02$$, NULL,
  $$Staff treat people as individuals, considering any relevant protected equality characteristics and ensuring their personal, cultural, social, spiritual and religious needs are understood and met.$$,
  $$Reg 9$$,
  $$Support plans with equality characteristics and cultural needs documented; evidence that protected characteristics are considered in care planning; records of culturally appropriate care$$,
  76
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Person-centred care$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ── CARING — Independence, choice and control ────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-IC-04$$, NULL,
  $$There is a compassionate and supportive approach towards those close to the person, or staff, before and after a person dies.$$,
  $$Reg 9$$,
  $$Records of support provided to family and carers around end of life; evidence of compassionate approach following bereavement; staff support records after a person dies$$,
  77
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-IC-05$$, NULL,
  $$People are supported to plan for important life changes, including those relating to potential medical and psychological needs. They can have enough time and accessible information to make informed decisions about their future.$$,
  $$Reg 9$$,
  $$Future planning records in support plans; evidence people have been supported to think about their future; accessible information provided about options; records of planning discussions with adequate time given$$,
  78
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$CAR-IC-06$$, NULL,
  $$People have choice and control over their own care and are empowered to make decisions about their care, support, treatment and wellbeing.$$,
  $$Reg 9$$,
  $$Evidence that people make real decisions about their care and daily life; support plans reflecting person's choices; feedback from people supported about choice and control; evidence staff support rather than direct$$,
  79
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Independence, choice and control$$ AND kq.name = $$Caring$$
ON CONFLICT DO NOTHING;

-- ── RESPONSIVE — Care provision, integration and continuity ──────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-CC-01$$, NULL,
  $$The service understands the diverse needs of the people who use it and tailors their support accordingly. This includes recognising and responding to the needs of people with protected equality characteristics and those most at risk of experiencing poorer care or facing barriers to accessing care.$$,
  $$Reg 9$$,
  $$Evidence of tailored support for diverse needs; equality monitoring data; evidence of action taken for people with protected equality characteristics; records of adjustments made$$,
  80
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-CC-02$$, NULL,
  $$The service works collaboratively and flexibly with others. People experience continuity of care, support and treatment; this includes working with commissioners to manage continuity of care.$$,
  $$Reg 9$$,
  $$Records of collaborative working with commissioners and partners; evidence of continuity of care for people supported; multi-agency meeting records; evidence of coordinated care planning$$,
  81
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-CC-03$$, NULL,
  $$Where support is provided by more than one service, or by unpaid carers, staff work in a planned, coordinated and flexible way to make sure care is joined up and meets people's needs.$$,
  $$Reg 9$$,
  $$Records of coordination with other services and unpaid carers; joint support plans or care plans; evidence of planned and flexible working; coordination meeting records$$,
  82
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-CC-04$$, NULL,
  $$Staff can identify and take appropriate action when there is a gap in care provision. This includes identifying and taking appropriate action where people are eligible to receive more care or support.$$,
  $$Reg 9$$,
  $$Records of gaps in care provision identified and actions taken; referral records; evidence of advocacy for additional services where eligible; communication with commissioners about unmet need$$,
  83
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Care provision, integration and continuity$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ── RESPONSIVE — Listening to and responding to feedback ─────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-LF-01$$, NULL,
  $$People and those close to them understand how to give feedback, make suggestions or complain about care, support and treatment. They can do this in a way that meets their needs.$$,
  $$Reg 16$$,
  $$Complaints procedure in accessible formats including easy read and visual; evidence people know how to raise concerns; feedback mechanisms in accessible formats; family and advocate involvement in feedback$$,
  84
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-LF-02$$, NULL,
  $$The staff and service welcome feedback, concerns or complaints as an opportunity to improve the service and the quality of care people receive. Learning from feedback, concerns or complaints is incorporated into practice.$$,
  $$Reg 16$$,
  $$Evidence of positive response to complaints and feedback; records of practice changes made following feedback; complaints log with learning outcomes; evidence learning is shared with staff$$,
  85
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-LF-03$$, NULL,
  $$The service keeps people informed about how their feedback has been addressed and any action taken including a full explanation when it has not been acted on. It does this in line with established processes, and people are given information on how to escalate their complaints to the relevant Ombudsman at the end of its complaint process.$$,
  $$Reg 16$$,
  $$Records of feedback to complainants about actions taken; evidence people are informed of Ombudsman escalation route; complaints closure letters; evidence of timely responses to complaints in line with policy$$,
  86
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-LF-04$$, NULL,
  $$People feel confident that their views or concerns will be taken seriously and they will be treated compassionately, without negative repercussions.$$,
  $$Reg 16$$,
  $$Feedback from people supported and families about confidence in raising concerns; evidence of compassionate responses to concerns; records showing no detriment following complaints$$,
  87
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Listening to and responding to feedback$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ── RESPONSIVE — Timely and equitable access ──────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-TA-01$$, NULL,
  $$People can access care, support and treatment, including physically, when they need it and in a way that works for them, which promotes equality, removes barriers or delays and protects their rights.$$,
  $$Reg 9$$,
  $$Evidence that access to the service is equitable; waiting list management records; access audit; records of action taken to remove barriers to access$$,
  88
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-TA-02$$, NULL,
  $$Reasonable adjustments are understood and made to ensure equal access to the service for all. This removes barriers for people who find it hard to access services.$$,
  $$Reg 9$$,
  $$Records of reasonable adjustments made; accessible information and communication materials; evidence of adjustments to referral and assessment processes; records of support to access the service$$,
  89
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-TA-03$$, NULL,
  $$The service is designed to be accessible and available for people at the point of need, including those most likely to have difficulty accessing care. When there are barriers that prevent equitable access, they are removed.$$,
  $$Reg 9$$,
  $$Evidence of proactive outreach to underserved groups; records of barriers identified and addressed; equality monitoring data for referrals and placements; evidence the service adapts to meet diverse access needs$$,
  90
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Timely and equitable access$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ── RESPONSIVE — Equity in experiences ───────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-EE-01$$, NULL,
  $$Leaders and staff work collaboratively to achieve equity. They do this by recognising barriers, collecting and acting on evidence, including people's experiences, and allocating resources to reduce barriers and improve this.$$,
  $$Reg 9$$,
  $$Equity monitoring data; evidence of action taken to address identified inequalities; resource allocation records linked to equity objectives; staff and people's experience data reviewed and acted on$$,
  91
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-EE-02$$, NULL,
  $$Interpreting and translation are provided or accessed for people who don't speak English as a first language and for people who use British Sign Language.$$,
  $$Reg 9$$,
  $$Records of interpreting and translation provision; evidence of BSL interpretation where needed; support plans noting language needs; evidence that language barriers do not prevent participation in reviews$$,
  92
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$RES-EE-03$$, NULL,
  $$Staff are supported to develop the skills they need to remove barriers to effective communication with the people they support.$$,
  $$Reg 9$$,
  $$Training records on communication skills including AAC, Makaton, easy read and sensory needs; evidence of support to develop communication skills; records of diverse communication approaches in practice$$,
  93
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Equity in experiences$$ AND kq.name = $$Responsive$$
ON CONFLICT DO NOTHING;

-- ── WELL-LED — Strategic direction ───────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-SD-01$$, NULL,
  $$The values of the service are clear, understood and supported by staff. They are demonstrated through the behaviour of leaders and in practices within the service. They include key principles such as openness, involvement, respect, human rights, inclusion, diversity and equality.$$,
  $$Reg 17$$,
  $$Service values statements; evidence values are communicated to all staff; observations and feedback showing values embedded in practice; staff survey evidence of shared values$$,
  94
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-SD-02$$, NULL,
  $$Leaders learn from staff who work directly with people, to build trust and mutual understanding. Feedback is valued and used to track progress, shape priorities and drive improvements.$$,
  $$Reg 17$$,
  $$Evidence of manager engagement with staff; staff feedback mechanisms; records of feedback used to shape priorities; team meeting records showing two-way communication; staff survey results and actions$$,
  95
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-SD-03$$, NULL,
  $$The strategy supports the stability and operational sustainability of the service.$$,
  $$Reg 17$$,
  $$Business plan or strategic plan; evidence of financial sustainability planning; succession planning records; evidence the strategy reflects current and future service needs$$,
  96
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Strategic direction$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ── WELL-LED — Capable and compassionate leaders ─────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-CL-01$$, NULL,
  $$Where required, there is a registered manager in post. They understand their responsibilities and are supported by the board, trustees or directors and other managers to deliver good, effective, high-quality care.$$,
  $$Reg 17$$,
  $$CQC registration records showing registered manager; evidence of manager understanding of regulatory responsibilities; records of manager support from governance structures; management supervision and development records$$,
  97
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-CL-02$$, NULL,
  $$High-quality leadership is sustained through safe, effective, and inclusive recruitment and succession planning.$$,
  $$Reg 17$$,
  $$Leadership recruitment records; succession planning documentation; evidence of inclusive recruitment for leadership roles; leadership development plans; evidence of plans for management continuity$$,
  98
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-CL-03$$, NULL,
  $$Leaders are knowledgeable about issues and priorities that affect the quality of the service and have access to appropriate development in their role. They seek support or independent scrutiny where required.$$,
  $$Reg 17$$,
  $$Evidence of manager training and CPD; records of external support or supervision sought; evidence leaders are up-to-date with sector guidance and regulation; peer review or external scrutiny records$$,
  99
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-CL-04$$, NULL,
  $$When something goes wrong, people receive a sincere and timely apology and are told about any actions being taken to prevent the same thing happening again.$$,
  $$Reg 20$$,
  $$Duty of candour records including apology letters; evidence people and families were informed of actions following incidents; records of timely communication following things going wrong; evidence of sincerity and compassion in responses$$,
  100
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Capable and compassionate leaders$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ── WELL-LED — Workforce equity and culture ───────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-WE-01$$, NULL,
  $$The service is committed to workforce equality, understands equity and proactively works to promote equality, diversity and inclusion. Wellbeing, inclusion, trust and open communication are embedded in the culture of the service.$$,
  $$Reg 17$$,
  $$EDI policy and objectives; equality monitoring data for the workforce; evidence of proactive action to promote inclusion; staff wellbeing initiatives; evidence of open communication between staff and leaders$$,
  101
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-WE-02$$, NULL,
  $$Staff and volunteers are actively encouraged to give feedback, raise concerns, and contribute to improvements through formal speaking up processes. They are confident that they will be treated with compassion and understanding, and will not be blamed, or treated negatively if they do so - including in relation to issues of racism and discrimination.$$,
  $$Reg 17$$,
  $$Whistleblowing and speaking up policy; evidence that staff know how to raise concerns; speaking up records; evidence of compassionate responses to concerns raised; no evidence of detriment following speaking up$$,
  102
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-WE-03$$, NULL,
  $$Staff wellbeing is promoted by providing personalised support, such as making reasonable adjustments, enabling flexible working, ensuring adequate rest, and providing a positive work environment. There is support if people are struggling at work.$$,
  $$Reg 17$$,
  $$Staff wellbeing records; evidence of reasonable adjustments made for staff; flexible working arrangements; evidence of support for staff experiencing difficulties; occupational health or EAP records where applicable$$,
  103
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Workforce equity and culture$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ── WELL-LED — Governance and management (gap items) ─────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-GM-05$$, NULL,
  $$Data or notifications are consistently submitted to external partners as required.$$,
  $$Reg 17$$,
  $$Records of CQC notifications submitted on time; evidence of statutory reporting to local authorities and commissioners; data submission records; evidence of no missed notification deadlines$$,
  104
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-GM-06$$, NULL,
  $$There are clear and effective governance, management and accountability arrangements. Staff understand their roles and responsibilities. Managers can account for the actions, behaviours and performance of staff.$$,
  $$Reg 17$$,
  $$Governance framework documentation; role descriptions for all staff; evidence managers can account for staff performance; supervision and appraisal records; performance management records$$,
  105
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Governance and management$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ── WELL-LED — Partnerships and communities ───────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-PAR-01$$, NULL,
  $$The service maintains positive relationships with the local community and works well with community partners.$$,
  $$Reg 17$$,
  $$Community partnership records; evidence of positive working relationships with local organisations; community engagement activity records; feedback from community partners$$,
  106
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-PAR-02$$, NULL,
  $$Staff and leaders work in partnership with people and other organisations, so that services work as seamlessly as possible for people.$$,
  $$Reg 17$$,
  $$Partnership working records; evidence of joint working with local authorities, NHS and third sector; records of multi-agency meetings; feedback from partner organisations; evidence of coordinated service delivery$$,
  107
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-PAR-03$$, NULL,
  $$The service has strong external relationships and all staff including leaders engage early with people, communities, and partners to share learning with each other, which results in continuous improvements to the service.$$,
  $$Reg 17$$,
  $$Records of external engagement and shared learning; evidence of participation in sector networks or forums; records of learning received from partners and applied; evidence of proactive early engagement with people and communities$$,
  108
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Partnerships and communities$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

-- ── WELL-LED — Improvement, innovation and learning ──────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-IL-01$$, NULL,
  $$Staff and leaders understand how to drive improvement through consistent approaches that enable the right environment for improvement, measuring outcomes and impact.$$,
  $$Reg 17$$,
  $$Quality improvement plan; evidence of improvement methodology embedded in practice; outcome and impact measurement records; evidence staff are equipped and supported to drive improvement$$,
  109
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-IL-02$$, NULL,
  $$Leaders foster a culture of trust by encouraging staff to speak up with ideas for improvement and innovation, and by actively investing time to listen and engage.$$,
  $$Reg 17$$,
  $$Evidence of innovation ideas from staff acted on; records of manager listening and engagement activities; improvement suggestions log; team meeting records showing staff input to improvement$$,
  110
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, sub_service, checklist_item, regulation, evidence_notes, display_order)
SELECT ki.id,
  (SELECT id FROM public.service_types WHERE name = $$Supported Living$$),
  $$Core$$, $$WEL-IL-03$$, NULL,
  $$Staff and leaders engage with external work, including research, and embed evidence-based good practice in the service.$$,
  $$Reg 17$$,
  $$Evidence of engagement with sector research and guidance; records of good practice adopted from external sources; evidence of participation in sector networks or research projects; good practice embedded in policy and procedures$$,
  111
FROM public.klo_items ki JOIN public.key_questions kq ON ki.key_question_id = kq.id
WHERE ki.title = $$Improvement, innovation and learning$$ AND kq.name = $$Well-led$$
ON CONFLICT DO NOTHING;
