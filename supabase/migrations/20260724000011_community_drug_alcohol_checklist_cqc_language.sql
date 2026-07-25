-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260724000011_community_drug_alcohol_checklist_cqc_language
-- Purpose : Replace all Community Drug and Alcohol Service checklist items
--           with exact CQC Good-level characteristic language from the Adult
--           Social Care Assessment Framework (Draft v9).
--           Delete all DEM-prefixed sub-service items (not in CQC Good text).
--           Insert items for KLOEs missing from the original migration.
-- Rule    : Every checklist_item is a direct verbatim quote from CQC Good
--           characteristics. No paraphrasing. No service-specific additions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: DELETE DEM-prefixed items (not in CQC Good-level text)
-- ═══════════════════════════════════════════════════════════════════════════

DELETE FROM public.klo_checklist_items
WHERE ref LIKE $$DEM-%$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: UPDATE existing items with exact CQC Good-level text
-- ═══════════════════════════════════════════════════════════════════════════

-- ── SAFE ▸ Managing risks during care and treatment ─────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People's care plans reflect any foreseeable risks and how they should be managed. Deterioration, emergencies and clinical risks are anticipated where possible and managed to reduce the potential for harm.$$
WHERE ref = $$SAF-MR-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are respected and protected from avoidable harm because care is provided in line with recognised good practice guidance.$$
WHERE ref = $$SAF-MR-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Care, support and treatment are discussed with people so they understand the potential risks and side effects. Where appropriate, people and those close to them are actively involved in managing their own risks.$$
WHERE ref = $$SAF-MR-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service has a process to ensure that any restrictions on people's freedom, choice and control are necessary, proportionate and safe. This particularly includes where people lack mental capacity.$$
WHERE ref = $$SAF-MR-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── SAFE ▸ Safeguarding ──────────────────────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective safeguarding systems, processes and practices, managed by appropriately trained staff, which protect people from abuse, neglect, harassment and breaches of their dignity. These operate in line with legislation and guidance, are communicated effectively and are accessible to people, staff and visitors to the service.$$
WHERE ref = $$SAF-SG-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff can identify abuse and improper treatment. They recognise early indicators of potential abuse or poor care, even when these do not meet the threshold for formal safeguarding concerns. Staff act quickly and appropriately to protect people, working closely with partners.$$
WHERE ref = $$SAF-SG-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── SAFE ▸ Safe staffing (originally ref'd as SAF-ST; 0 rows — covered by INSERT below) ──

UPDATE public.klo_checklist_items
SET checklist_item = $$Thorough and safe recruitment practices ensure staff, including agency staff and volunteers, are suitably experienced, qualified and competent to carry out their roles.$$
WHERE ref = $$SAF-ST-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are appropriate staffing levels and skill mix to meet people's needs. Individual needs are taken into consideration so that when people receive one-to-one support, the skills and experience of staff are matched to the person's needs.$$
WHERE ref = $$SAF-ST-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── SAFE ▸ Safe medicines and treatments (originally ref'd as SAF-MM; 0 rows) ──

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear approach to the safe use of medicines, and roles and responsibilities are understood.$$
WHERE ref = $$SAF-MM-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── EFFECTIVE ▸ Assessing needs (originally ref'd as EFF-CP; 0 rows) ─────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People's needs are comprehensively assessed, and reflect their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics.$$
WHERE ref = $$EFF-CP-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Assessments are regularly reviewed and updated to make sure staff have current information, so that care, support and treatment is meeting people's needs and individual outcomes as expected.$$
WHERE ref = $$EFF-CP-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are involved as much as possible in their needs assessment and their needs are fully identified and understood. Where people need support to be involved, this is provided.$$
WHERE ref = $$EFF-CP-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── EFFECTIVE ▸ Safe staffing / training (originally ref'd as EFF-TD; 0 rows) ──

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and volunteers receive training that is appropriate to their role. This is embedded into practice and refreshed at regular intervals. Competency is assessed as required to maintain knowledge and skills in line with good practice.$$
WHERE ref = $$EFF-TD-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are induction, supervision and appraisal processes to support staff to develop and improve services (including professional revalidation where needed).$$
WHERE ref = $$EFF-TD-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── EFFECTIVE ▸ Consent to care and treatment (originally ref'd as EFF-CT; 0 rows) ──

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff know the importance of consent and relevant legal requirements. They make sure people understand what they are consenting to before they deliver care, support or treatment. People are given the appropriate information, support and time they need to make an informed decision.$$
WHERE ref = $$EFF-CT-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── EFFECTIVE ▸ Supporting people to live healthier lives (originally ref'd as EFF-HL; 0 rows) ──

UPDATE public.klo_checklist_items
SET checklist_item = $$The service works with people who use services and professionals to plan and enable access to health and social care support to achieve good health and wellbeing outcomes. This includes facilitating reasonable adjustments, supporting people to access health checks or to complete healthcare passports.$$
WHERE ref = $$EFF-HL-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Risks to people's health and wellbeing are identified and support to prevent deterioration is prioritised. This includes understanding specific risks for a person due to their needs and specific health conditions, keeping well in hot and cold weather and supporting people to remain as active and mobile as possible.$$
WHERE ref = $$EFF-HL-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are encouraged and supported to make healthier choices relating to diet, lifestyle, physical activity, personal and oral hygiene.$$
WHERE ref = $$EFF-HL-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to be as involved as possible in monitoring and reviewing their own physical and mental health and wellbeing needs. This includes taking part in regular reviews with the service and, where appropriate, being supported to engage in health checks with other health and social care professionals.$$
WHERE ref = $$EFF-HL-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── CARING ▸ Independence, choice and control ────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People have choice and control over their own care and are empowered to make decisions about their care, support, treatment and wellbeing.$$
WHERE ref = $$CAR-IC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── RESPONSIVE ▸ Care provision, integration and continuity (originally RES-TP; 0 rows) ──

UPDATE public.klo_checklist_items
SET checklist_item = $$The service understands the diverse needs of the people who use it and tailors their support accordingly. This includes recognising and responding to the needs of people with protected equality characteristics and those most at risk of experiencing poorer care or facing barriers to accessing care.$$
WHERE ref = $$RES-TP-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── RESPONSIVE ▸ Listening to and responding to feedback (originally RES-CF; 0 rows) ──

UPDATE public.klo_checklist_items
SET checklist_item = $$People and those close to them understand how to give feedback, make suggestions or complain about care, support and treatment. They can do this in a way that meets their needs.$$
WHERE ref = $$RES-CF-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ── WELL-LED ▸ Governance and management ─────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There are clear and effective governance, management and accountability arrangements. Staff understand their roles and responsibilities. Managers can account for the actions, behaviours and performance of staff.$$
WHERE ref = $$WEL-GM-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective systems for monitoring and managing service performance, risk and learning from incidents that support innovation while maintaining the quality of care at the service.$$
WHERE ref = $$WEL-GM-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are secure and reliable arrangements for the availability, integrity and confidentiality of data, records and data management systems. Information is used effectively to monitor and improve the quality of care. Staff understand their responsibilities when collecting and sharing information.$$
WHERE ref = $$WEL-GM-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: INSERT items that failed to insert originally
--            (original migration used wrong klo_item titles)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── SAF-ST-01: Safe staffing — recruitment ──────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe staffing$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-ST-01$$,
  $$Thorough and safe recruitment practices ensure staff, including agency staff and volunteers, are suitably experienced, qualified and competent to carry out their roles.$$,
  NULL, 7, NULL
);

-- ── SAF-ST-02: Safe staffing — staffing levels ──────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe staffing$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-ST-02$$,
  $$There are appropriate staffing levels and skill mix to meet people's needs. Individual needs are taken into consideration so that when people receive one-to-one support, the skills and experience of staff are matched to the person's needs.$$,
  NULL, 8, NULL
);

-- ── SAF-MM-01: Safe medicines and treatments ────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-MM-01$$,
  $$There is a clear approach to the safe use of medicines, and roles and responsibilities are understood.$$,
  NULL, 9, NULL
);

-- ── EFF-CP-01: Assessing needs ───────────────────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Assessing needs$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-CP-01$$,
  $$People's needs are comprehensively assessed, and reflect their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics.$$,
  NULL, 10, NULL
);

-- ── EFF-CP-02: Assessing needs — review ─────────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Assessing needs$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-CP-02$$,
  $$Assessments are regularly reviewed and updated to make sure staff have current information, so that care, support and treatment is meeting people's needs and individual outcomes as expected.$$,
  NULL, 11, NULL
);

-- ── EFF-CP-03: Assessing needs — involvement ────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Assessing needs$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-CP-03$$,
  $$People are involved as much as possible in their needs assessment and their needs are fully identified and understood. Where people need support to be involved, this is provided.$$,
  NULL, 12, NULL
);

-- ── EFF-TD-01: Safe staffing — training ─────────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe staffing$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-TD-01$$,
  $$Staff and volunteers receive training that is appropriate to their role. This is embedded into practice and refreshed at regular intervals. Competency is assessed as required to maintain knowledge and skills in line with good practice.$$,
  NULL, 13, NULL
);

-- ── EFF-TD-02: Safe staffing — supervision and appraisal ────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe staffing$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-TD-02$$,
  $$There are induction, supervision and appraisal processes to support staff to develop and improve services (including professional revalidation where needed).$$,
  NULL, 14, NULL
);

-- ── EFF-CT-01: Consent to care and treatment ────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Consent to care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-CT-01$$,
  $$Staff know the importance of consent and relevant legal requirements. They make sure people understand what they are consenting to before they deliver care, support or treatment. People are given the appropriate information, support and time they need to make an informed decision.$$,
  NULL, 15, NULL
);

-- ── EFF-HL-01: Supporting people to live healthier lives — access ────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Supporting people to live healthier lives$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-HL-01$$,
  $$The service works with people who use services and professionals to plan and enable access to health and social care support to achieve good health and wellbeing outcomes. This includes facilitating reasonable adjustments, supporting people to access health checks or to complete healthcare passports.$$,
  NULL, 16, NULL
);

-- ── EFF-HL-02: Supporting people to live healthier lives — deterioration ─────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Supporting people to live healthier lives$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-HL-02$$,
  $$Risks to people's health and wellbeing are identified and support to prevent deterioration is prioritised. This includes understanding specific risks for a person due to their needs and specific health conditions, keeping well in hot and cold weather and supporting people to remain as active and mobile as possible.$$,
  NULL, 17, NULL
);

-- ── EFF-HL-03: Supporting people to live healthier lives — healthier choices ──
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Supporting people to live healthier lives$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-HL-03$$,
  $$People are encouraged and supported to make healthier choices relating to diet, lifestyle, physical activity, personal and oral hygiene.$$,
  NULL, 18, NULL
);

-- ── EFF-HL-04: Supporting people to live healthier lives — involvement ────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Supporting people to live healthier lives$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-HL-04$$,
  $$People are supported to be as involved as possible in monitoring and reviewing their own physical and mental health and wellbeing needs. This includes taking part in regular reviews with the service and, where appropriate, being supported to engage in health checks with other health and social care professionals.$$,
  NULL, 19, NULL
);

-- ── RES-TP-01: Care provision, integration and continuity ───────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Care provision, integration and continuity$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$RES-TP-01$$,
  $$The service understands the diverse needs of the people who use it and tailors their support accordingly. This includes recognising and responding to the needs of people with protected equality characteristics and those most at risk of experiencing poorer care or facing barriers to accessing care.$$,
  NULL, 21, NULL
);

-- ── RES-CF-01: Listening to and responding to feedback ──────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$RES-CF-01$$,
  $$People and those close to them understand how to give feedback, make suggestions or complain about care, support and treatment. They can do this in a way that meets their needs.$$,
  NULL, 22, NULL
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: INSERT gap items for KLOEs not previously covered
-- ═══════════════════════════════════════════════════════════════════════════

-- ── GAP 1: Safety culture ────────────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-SC-01$$,
  $$There is a strong learning culture in which incidents that have caused harm, or could cause harm, are treated as opportunities to improve.$$,
  NULL, 26, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-SC-02$$,
  $$When an incident has happened, staff are open and transparent with people and those close to them. All incidents are recorded, investigated and outcomes are communicated to those involved. If harm has occurred, people are given full details of what happened, why, and what has been learned.$$,
  NULL, 27, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-SC-03$$,
  $$Complaints, concerns and other feedback about safety are welcomed and prioritised as key sources used to identify and manage safety risks before safety incidents happen.$$,
  NULL, 28, NULL
);

-- ── GAP 2: Safe systems, pathways and transitions ────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe systems, pathways and transitions$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-SP-01$$,
  $$Safety and continuity are maintained across people's care journeys through collaborative working with people, staff and partners. This includes where people are moving between or accessing multiple services.$$,
  NULL, 29, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe systems, pathways and transitions$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-SP-02$$,
  $$Plans and information for care during transitions are established and shared before people move between services. Plans consider people's individual needs, circumstances, ongoing care arrangements and expected outcomes.$$,
  NULL, 30, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe systems, pathways and transitions$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-SP-03$$,
  $$When people have needs that are outside of the service's remit, staff adapt support and escalate issues to relevant agencies.$$,
  NULL, 31, NULL
);

-- ── GAP 3: Safe environments and infection prevention and control ─────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-EI-01$$,
  $$The service manages the control and prevention of infection well. Infection prevention and control roles are clear. The risk of infection is minimised because premises and equipment are kept clean and hygienic.$$,
  NULL, 32, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$SAF-EI-02$$,
  $$Fire safety procedures are effective. Concerns are escalated appropriately where the service is not directly responsible for the premises.$$,
  NULL, 33, NULL
);

-- ── GAP 4: Evidence-based care and equitable outcomes ───────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-EB-01$$,
  $$There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment and the service takes action to continuously improve it.$$,
  NULL, 34, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$EFF-EB-02$$,
  $$Staff monitor and evaluate outcomes related to people's health and quality of life, including those linked to their aspirations and skill development, and act to improve them when possible.$$,
  NULL, 35, NULL
);

-- ── GAP 5: Kindness, compassion and dignity ──────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Kindness, compassion and dignity$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$CAR-KD-01$$,
  $$There is a culture of kindness and respect across teams. People feel cared for with kindness, compassion, dignity and respect.$$,
  NULL, 36, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Kindness, compassion and dignity$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$CAR-KD-02$$,
  $$People's privacy, confidentiality, and respect are consistently upheld. Staff are discreet and challenge behaviour and practices that fall short of this. Staff have a clear understanding of the boundaries of confidentiality and work within these.$$,
  NULL, 37, NULL
);

-- ── GAP 6: Person-centred care ───────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Person-centred care$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$CAR-PC-01$$,
  $$People are at the centre of how their care, support and treatment is delivered. Care is tailored to the individual and is not task-focused.$$,
  NULL, 38, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Person-centred care$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$CAR-PC-02$$,
  $$Staff treat people as individuals, considering any relevant protected equality characteristics and ensuring their personal, cultural, social, spiritual and religious needs are understood and met.$$,
  NULL, 39, NULL
);

-- ── GAP 7: Timely and equitable access ──────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Timely and equitable access$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$RES-TA-01$$,
  $$People can access care, support and treatment, including physically, when they need it and in a way that works for them, which promotes equality, removes barriers or delays and protects their rights.$$,
  NULL, 40, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Timely and equitable access$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$RES-TA-02$$,
  $$Reasonable adjustments are understood and made to ensure equal access to the service for all. This removes barriers for people who find it hard to access services.$$,
  NULL, 41, NULL
);

-- ── GAP 8: Equity in experiences ────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Equity in experiences$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$RES-EE-01$$,
  $$Leaders and staff work collaboratively to achieve equity. They do this by recognising barriers, collecting and acting on evidence, including people's experiences, and allocating resources to reduce barriers and improve this.$$,
  NULL, 42, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Equity in experiences$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$RES-EE-02$$,
  $$Interpreting and translation are provided or accessed for people who don't speak English as a first language and for people who use British Sign Language.$$,
  NULL, 43, NULL
);

-- ── GAP 9: Strategic direction ───────────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Strategic direction$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-SD-01$$,
  $$The values of the service are clear, understood and supported by staff. They are demonstrated through the behaviour of leaders and in practices within the service. They include key principles such as openness, involvement, respect, human rights, inclusion, diversity and equality.$$,
  NULL, 44, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Strategic direction$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-SD-02$$,
  $$Leaders learn from staff who work directly with people, to build trust and mutual understanding. Feedback is valued and used to track progress, shape priorities and drive improvements.$$,
  NULL, 45, NULL
);

-- ── GAP 10: Workforce equity and culture ─────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-WE-01$$,
  $$The service is committed to workforce equality, understands equity and proactively works to promote equality, diversity and inclusion. Wellbeing, inclusion, trust and open communication are embedded in the culture of the service.$$,
  NULL, 46, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-WE-02$$,
  $$Staff and volunteers are actively encouraged to give feedback, raise concerns, and contribute to improvements through formal speaking up processes. They are confident that they will be treated with compassion and understanding, and will not be blamed, or treated negatively if they do so - including in relation to issues of racism and discrimination.$$,
  NULL, 47, NULL
);

-- ── GAP 11: Capable and compassionate leaders ────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Capable and compassionate leaders$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-CL-01$$,
  $$Where required, there is a registered manager in post. They understand their responsibilities and are supported by the board, trustees or directors and other managers to deliver good, effective, high-quality care.$$,
  NULL, 48, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Capable and compassionate leaders$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-CL-02$$,
  $$Leaders are knowledgeable about issues and priorities that affect the quality of the service and have access to appropriate development in their role. They seek support or independent scrutiny where required.$$,
  NULL, 49, NULL
);

-- ── GAP 12: Partnerships and communities ─────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Partnerships and communities$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-PC-01$$,
  $$The service maintains positive relationships with the local community and works well with community partners.$$,
  NULL, 50, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Partnerships and communities$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-PC-02$$,
  $$Staff and leaders work in partnership with people and other organisations, so that services work as seamlessly as possible for people.$$,
  NULL, 51, NULL
);

-- ── GAP 13: Improvement, innovation and learning ─────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Improvement, innovation and learning$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-IL-01$$,
  $$Staff and leaders understand how to drive improvement through consistent approaches that enable the right environment for improvement, measuring outcomes and impact.$$,
  NULL, 52, NULL
);

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Improvement, innovation and learning$$),
  (SELECT id FROM public.service_types WHERE name = $$Community Drug and Alcohol Service$$),
  $$Core$$, $$WEL-IL-02$$,
  $$Leaders foster a culture of trust by encouraging staff to speak up with ideas for improvement and innovation, and by actively investing time to listen and engage.$$,
  NULL, 53, NULL
);
