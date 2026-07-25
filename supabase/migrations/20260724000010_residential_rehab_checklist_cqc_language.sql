-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260724000010_residential_rehab_checklist_cqc_language
-- Purpose : Correct all Residential Rehabilitation Service checklist items
--           to use exact verbatim CQC Good-level characteristic language from
--           the Adult Social Care Assessment Framework (Draft v9).
--           Delete DEM- prefixed dementia sub-service items.
--           Add gap items for CQC Good-level topics not previously covered.
-- Rule    : Every checklist_item is a direct quote from CQC Good characteristics.
--           No paraphrasing. No rehab-specific modifications.
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: DELETE dementia sub-service items
-- ═══════════════════════════════════════════════════════════════════════════

DELETE FROM public.klo_checklist_items
WHERE ref LIKE $$DEM-%$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: UPDATE existing items with exact CQC Good-level text
-- ═══════════════════════════════════════════════════════════════════════════

-- ── SAFE ▸ Managing risks during care and treatment ─────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People's care plans reflect any foreseeable risks and how they should be managed. Deterioration, emergencies and clinical risks are anticipated where possible and managed to reduce the potential for harm.$$
WHERE ref = $$SAF-MR-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are respected and protected from avoidable harm because care is provided in line with recognised good practice guidance.$$
WHERE ref = $$SAF-MR-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Care, support and treatment are discussed with people so they understand the potential risks and side effects. Where appropriate, people and those close to them are actively involved in managing their own risks.$$
WHERE ref = $$SAF-MR-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service has a process to ensure that any restrictions on people's freedom, choice and control are necessary, proportionate and safe. This particularly includes where people lack mental capacity.$$
WHERE ref = $$SAF-MR-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Restraint is only ever used as a last resort and there is a clear commitment from all staff to minimising the use of restrictive interventions in the service. If staff use restraint, it is lawful, for a legitimate purpose, safe and necessary, and staff follow good practice.$$
WHERE ref = $$SAF-MR-05$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── SAFE ▸ Safeguarding ──────────────────────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective safeguarding systems, processes and practices, managed by appropriately trained staff, which protect people from abuse, neglect, harassment and breaches of their dignity. These operate in line with legislation and guidance, are communicated effectively and are accessible to people, staff and visitors to the service.$$
WHERE ref = $$SAF-SG-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── SAFE ▸ Safe staffing ─────────────────────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$Thorough and safe recruitment practices ensure staff, including agency staff and volunteers, are suitably experienced, qualified and competent to carry out their roles.$$
WHERE ref = $$SAF-ST-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are appropriate staffing levels and skill mix to meet people's needs. Individual needs are taken into consideration so that when people receive one-to-one support, the skills and experience of staff are matched to the person's needs.$$
WHERE ref = $$SAF-ST-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── SAFE ▸ Safe medicines and treatments ─────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear approach to the safe use of medicines, and roles and responsibilities are understood.$$
WHERE ref = $$SAF-MM-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── EFFECTIVE ▸ Assessing needs ──────────────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People's needs are comprehensively assessed, and reflect their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics.$$
WHERE ref = $$EFF-CP-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Assessments are regularly reviewed and updated to make sure staff have current information, so that care, support and treatment is meeting people's needs and individual outcomes as expected.$$
WHERE ref = $$EFF-CP-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are involved as much as possible in their needs assessment and their needs are fully identified and understood. Where people need support to be involved, this is provided.$$
WHERE ref = $$EFF-CP-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── EFFECTIVE ▸ Safe staffing — training and development ─────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and volunteers receive training that is appropriate to their role. This is embedded into practice and refreshed at regular intervals. Competency is assessed as required to maintain knowledge and skills in line with good practice.$$
WHERE ref = $$EFF-TD-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are induction, supervision and appraisal processes to support staff to develop and improve services (including professional revalidation where needed).$$
WHERE ref = $$EFF-TD-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── EFFECTIVE ▸ Consent to care and treatment ────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff know the importance of consent and relevant legal requirements. They make sure people understand what they are consenting to before they deliver care, support or treatment. People are given the appropriate information, support and time they need to make an informed decision.$$
WHERE ref = $$EFF-CT-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── EFFECTIVE ▸ Supporting people to live healthier lives ────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service works with people who use services and professionals to plan and enable access to health and social care support to achieve good health and wellbeing outcomes. This includes facilitating reasonable adjustments, supporting people to access health checks or to complete healthcare passports.$$
WHERE ref = $$EFF-HL-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Risks to people's health and wellbeing are identified and support to prevent deterioration is prioritised. This includes understanding specific risks for a person due to their needs and specific health conditions, keeping well in hot and cold weather and supporting people to remain as active and mobile as possible.$$
WHERE ref = $$EFF-HL-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are encouraged and supported to make healthier choices relating to diet, lifestyle, physical activity, personal and oral hygiene.$$
WHERE ref = $$EFF-HL-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── CARING ▸ Independence, choice and control ────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People have choice and control over their own care and are empowered to make decisions about their care, support, treatment and wellbeing.$$
WHERE ref = $$CAR-IC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to establish and maintain relationships and networks that are important to them, with access to family, friends, cultural connections, and advocacy support while using the service. When applicable, visiting restrictions are limited to exceptional circumstances in accordance with guidance and legislation.$$
WHERE ref = $$CAR-IC-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── RESPONSIVE ▸ Care provision, integration and continuity ──────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service understands the diverse needs of the people who use it and tailors their support accordingly. This includes recognising and responding to the needs of people with protected equality characteristics and those most at risk of experiencing poorer care or facing barriers to accessing care.$$
WHERE ref = $$RES-TP-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── RESPONSIVE ▸ Listening to and responding to feedback ─────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People and those close to them understand how to give feedback, make suggestions or complain about care, support and treatment. They can do this in a way that meets their needs.$$
WHERE ref = $$RES-CF-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ── WELL-LED ▸ Governance and management ─────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service has an accurate statement of purpose that clearly reflects current service provision.$$
WHERE ref = $$WEL-GM-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective systems for monitoring and managing service performance, risk and learning from incidents that support innovation while maintaining the quality of care at the service.$$
WHERE ref = $$WEL-GM-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are secure and reliable arrangements for the availability, integrity and confidentiality of data, records and data management systems. Information is used effectively to monitor and improve the quality of care. Staff understand their responsibilities when collecting and sharing information.$$
WHERE ref = $$WEL-GM-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: INSERT gap items for CQC Good-level topics not yet covered
-- ═══════════════════════════════════════════════════════════════════════════

-- ── GAP 1–6: SAFE ▸ Safety culture ──────────────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SC-01$$,
  $$All incidents are recorded, investigated and outcomes are communicated to those involved. If harm has occurred, people are given full details of what happened, why, and what has been learned.$$,
  NULL, 101, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SC-02$$,
  $$There is a good understanding of the duty of candour. When an incident has happened, staff are open and transparent with people and those close to them.$$,
  NULL, 102, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SC-03$$,
  $$There is a strong learning culture in which incidents that have caused harm, or could cause harm, are treated as opportunities to improve.$$,
  NULL, 103, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SC-04$$,
  $$Complaints, concerns and other feedback about safety are welcomed and prioritised as key sources used to identify and manage safety risks before safety incidents happen.$$,
  NULL, 104, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SC-05$$,
  $$The service looks for safety-related themes and trends. Patient safety alerts are consistently reviewed and acted on, and learning from external safety incidents is embedded in the delivery of care.$$,
  NULL, 105, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SC-06$$,
  $$Staff and leaders understand what constitutes a closed culture and the risks to people, including organisational abuse. There are systems and processes in place to identify concerns and prevent closed cultures from developing, and appropriate action is taken when needed.$$,
  NULL, 106, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 7–11: SAFE ▸ Safe systems, pathways and transitions ─────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe systems, pathways and transitions$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SP-01$$,
  $$Plans and information for care during transitions are established and shared before people move between services. Plans consider people's individual needs, circumstances, ongoing care arrangements and expected outcomes.$$,
  NULL, 111, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe systems, pathways and transitions$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SP-02$$,
  $$Safety and continuity are maintained across people's care journeys through collaborative working with people, staff and partners. This includes where people are moving between or accessing multiple services.$$,
  NULL, 112, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe systems, pathways and transitions$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SP-03$$,
  $$Staff work together proactively with teams in other services, commissioners and people using the service to deliver co-ordinated, timely, consistent and person-centred care, support and treatment. Actions are appropriately owned and followed up.$$,
  NULL, 113, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe systems, pathways and transitions$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SP-04$$,
  $$When people have needs that are outside of the service's remit, staff adapt support and escalate issues to relevant agencies.$$,
  NULL, 114, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe systems, pathways and transitions$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SP-05$$,
  $$The service has appropriate systems and processes to manage its responsibilities in relation to delegated healthcare activities safely, in line with good practice.$$,
  NULL, 115, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 12–15: SAFE ▸ Safeguarding (additional bullets) ─────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SG-02$$,
  $$Staff can identify abuse and improper treatment. They recognise early indicators of potential abuse or poor care, even when these do not meet the threshold for formal safeguarding concerns. Staff act quickly and appropriately to protect people, working closely with partners.$$,
  NULL, 121, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SG-03$$,
  $$Information about people who have suffered harm or are at risk of harm is shared appropriately with other agencies, such as the local authority, in a timely way. Staff use appropriate escalation pathways when concerns are not addressed.$$,
  NULL, 122, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SG-04$$,
  $$People are deprived of their liberty lawfully. Any potential deprivation of liberty is recognised promptly and appropriate authorisation is sought. Where applicable, the Deprivation of Liberty Safeguards (DoLS) are used appropriately and only when it is in the best interests of the person.$$,
  NULL, 123, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SG-05$$,
  $$People are supported to understand what safeguarding means and how to raise concerns on behalf of themselves and others, and are encouraged and empowered to do so.$$,
  NULL, 124, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 16–20: SAFE ▸ Safe environments and infection prevention and control ──

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-EI-01$$,
  $$Fire safety procedures are effective. Concerns are escalated appropriately where the service is not directly responsible for the premises.$$,
  NULL, 131, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-EI-02$$,
  $$Where the provider is responsible, there is a comprehensive system to proactively manage the safety and upkeep of the premises (including communal and personal spaces) and equipment, and risks are assessed and controlled. Professionally qualified and competent people complete the necessary environmental and equipment checks and maintenance.$$,
  NULL, 132, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-EI-03$$,
  $$The service manages the control and prevention of infection well. Infection prevention and control roles are clear. The risk of infection is minimised because premises and equipment are kept clean and hygienic.$$,
  NULL, 133, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-EI-04$$,
  $$The service monitors and acts on equipment alerts, recalls and safety information.$$,
  NULL, 134, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-EI-05$$,
  $$Facilities, equipment (including special or adaptive equipment) and technology that are the responsibility of the service are maintained, stored and used in line with good practice and guidance.$$,
  NULL, 135, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 21: SAFE ▸ Safe staffing (fatigue) ───────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe staffing$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-SS-03$$,
  $$Actions are taken to protect staff from fatigue, and leaders understand its impact on the safety of those who use services.$$,
  NULL, 141, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 22–26: SAFE ▸ Safe medicines and treatments (additional) ─────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MT-02$$,
  $$Controlled drugs are stored, recorded, administered and disposed of in line with legislation and guidance.$$,
  NULL, 151, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MT-03$$,
  $$Where the service is responsible, medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance.$$,
  NULL, 152, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MT-04$$,
  $$The administration of PRN medicines (medicines taken when required) is guided by clear protocols, and there are timely reviews.$$,
  NULL, 153, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MT-05$$,
  $$People and their representatives are involved in assessments, reviews and decisions, including the level of support needed and self-medication. This is clearly documented in care records.$$,
  NULL, 154, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$SAF-MT-06$$,
  $$The service actively considers opportunities to reduce the over-medication of people, in line with STOMP/STAMP principles where applicable.$$,
  NULL, 155, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 27: EFFECTIVE ▸ Assessing needs (communication needs) ────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Assessing needs$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-AN-04$$,
  $$People's communication needs are assessed and met to maximise the effectiveness of care, support and treatment.$$,
  NULL, 161, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 28–32: EFFECTIVE ▸ Evidence-based care and equitable outcomes ─────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-EB-01$$,
  $$People's nutritional and hydration needs are met in line with current standards and good practice guidance. Where applicable, there is positive feedback from dietetic professionals that the service asks for their advice and applies it properly.$$,
  NULL, 171, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-EB-02$$,
  $$People are supported to plan and manage their dietary needs and associated risks, including risks of poor nutrition, dehydration, swallowing problems and other medical conditions that affect their health.$$,
  NULL, 172, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-EB-03$$,
  $$There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment and the service takes action to continuously improve it.$$,
  NULL, 173, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-EB-04$$,
  $$Staff monitor and evaluate outcomes related to people's health and quality of life, including those linked to their aspirations and skill development, and act to improve them when possible.$$,
  NULL, 174, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-EB-05$$,
  $$Staff are aware of individual preferences in relation to eating and drinking and there is flexibility when needed or requested. There are good quality food choices and these respect individual wishes, including those relating to sensory, cultural, religious and ethical preferences.$$,
  NULL, 175, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 33–35: EFFECTIVE ▸ Consent to care and treatment (additional) ─────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Consent to care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-CT-02$$,
  $$There is a clear understanding of the requirements of the Mental Capacity Act 2005 and guidance relating to capacity and consent, and staff demonstrate how they put these into practice effectively. People are supported to understand information, communicate and make decisions about their life, care, support and treatment in line with the Mental Capacity Act 2005, involving their representatives and advocates when needed.$$,
  NULL, 181, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Consent to care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-CT-03$$,
  $$People are supported to access independent advocacy, including statutory or non-statutory when available, and advocates are appropriately involved by the service.$$,
  NULL, 182, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Consent to care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$EFF-CT-04$$,
  $$The service makes lawful decisions in people's best interests when required. People are involved and their feelings, beliefs and values are considered. Those close to the person and their advocates are involved and kept informed of any changes as appropriate.$$,
  NULL, 183, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 36–38: CARING ▸ Kindness, compassion and dignity ─────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Kindness, compassion and dignity$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-KD-01$$,
  $$There is a culture of kindness and respect across teams. People feel cared for with kindness, compassion, dignity and respect.$$,
  NULL, 191, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Kindness, compassion and dignity$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-KD-02$$,
  $$People's privacy, confidentiality, and respect are consistently upheld. Staff are discreet and challenge behaviour and practices that fall short of this. Staff have a clear understanding of the boundaries of confidentiality and work within these.$$,
  NULL, 192, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Kindness, compassion and dignity$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-KD-03$$,
  $$Staff genuinely care about people's wellbeing and show it in a thoughtful, meaningful way. They promptly respond to people's emotions, discomfort, distress, or urgent needs in a positive way.$$,
  NULL, 193, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 39–40: CARING ▸ Person-centred care ──────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Person-centred care$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-PC-01$$,
  $$People are at the centre of how their care, support and treatment is delivered. Care is tailored to the individual and is not task-focused.$$,
  NULL, 201, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Person-centred care$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-PC-02$$,
  $$Staff treat people as individuals, considering any relevant protected equality characteristics and ensuring their personal, cultural, social, spiritual and religious needs are understood and met.$$,
  NULL, 202, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 41–44: CARING ▸ Independence, choice and control (additional) ─────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-IC-03$$,
  $$If people wish to, they are encouraged and enabled to access meaningful activities, hobbies and interests in a personalised way. People are offered meaningful and genuine choices.$$,
  NULL, 211, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-IC-04$$,
  $$There is a compassionate and supportive approach towards those close to the person, or staff, before and after a person dies.$$,
  NULL, 212, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-IC-05$$,
  $$People are supported to plan for important life changes, including those relating to potential medical and psychological needs. They can have enough time and accessible information to make informed decisions about their future.$$,
  NULL, 213, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$CAR-IC-06$$,
  $$People are supported to make decisions about end of life preferences and advance decisions if they wish to. People who may be approaching the end of their life are identified to ensure their needs are met, in line with their preferences and choices, and the right support is provided.$$,
  NULL, 214, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 45–47: RESPONSIVE ▸ Care provision, integration and continuity (additional)

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Care provision, integration and continuity$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-CC-02$$,
  $$The service works collaboratively and flexibly with others. People experience continuity of care, support and treatment; this includes working with commissioners to manage continuity of care.$$,
  NULL, 221, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Care provision, integration and continuity$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-CC-03$$,
  $$Where support is provided by more than one service, or by unpaid carers, staff work in a planned, coordinated and flexible way to make sure care is joined up and meets people's needs.$$,
  NULL, 222, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Care provision, integration and continuity$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-CC-04$$,
  $$Staff can identify and take appropriate action when there is a gap in care provision. This includes identifying and taking appropriate action where people are eligible to receive more care or support.$$,
  NULL, 223, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 48–50: RESPONSIVE ▸ Listening to and responding to feedback (additional)

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-LF-02$$,
  $$The staff and service welcome feedback, concerns or complaints as an opportunity to improve the service and the quality of care people receive. Learning from feedback, concerns or complaints is incorporated into practice.$$,
  NULL, 231, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-LF-03$$,
  $$The service keeps people informed about how their feedback has been addressed and any action taken including a full explanation when it has not been acted on. It does this in line with established processes, and people are given information on how to escalate their complaints to the relevant Ombudsman at the end of its complaint process.$$,
  NULL, 232, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-LF-04$$,
  $$People feel confident that their views or concerns will be taken seriously and they will be treated compassionately, without negative repercussions.$$,
  NULL, 233, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 51–53: RESPONSIVE ▸ Timely and equitable access ──────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Timely and equitable access$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-TA-01$$,
  $$People can access care, support and treatment, including physically, when they need it and in a way that works for them, which promotes equality, removes barriers or delays and protects their rights.$$,
  NULL, 241, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Timely and equitable access$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-TA-02$$,
  $$Reasonable adjustments are understood and made to ensure equal access to the service for all. This removes barriers for people who find it hard to access services.$$,
  NULL, 242, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Timely and equitable access$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-TA-03$$,
  $$The service is designed to be accessible and available for people at the point of need, including those most likely to have difficulty accessing care. When there are barriers that prevent equitable access, they are removed.$$,
  NULL, 243, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 54–56: RESPONSIVE ▸ Equity in experiences ────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Equity in experiences$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-EE-01$$,
  $$Leaders and staff work collaboratively to achieve equity. They do this by recognising barriers, collecting and acting on evidence, including people's experiences, and allocating resources to reduce barriers and improve this.$$,
  NULL, 251, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Equity in experiences$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-EE-02$$,
  $$Interpreting and translation are provided or accessed for people who don't speak English as a first language and for people who use British Sign Language.$$,
  NULL, 252, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Equity in experiences$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$RES-EE-03$$,
  $$Staff are supported to develop the skills they need to remove barriers to effective communication with the people they support.$$,
  NULL, 253, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 57–59: WELL-LED ▸ Strategic direction ────────────────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Strategic direction$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-SD-01$$,
  $$The values of the service are clear, understood and supported by staff. They are demonstrated through the behaviour of leaders and in practices within the service. They include key principles such as openness, involvement, respect, human rights, inclusion, diversity and equality.$$,
  NULL, 261, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Strategic direction$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-SD-02$$,
  $$Leaders learn from staff who work directly with people, to build trust and mutual understanding. Feedback is valued and used to track progress, shape priorities and drive improvements.$$,
  NULL, 262, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Strategic direction$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-SD-03$$,
  $$The strategy supports the stability and operational sustainability of the service.$$,
  NULL, 263, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 60–62: WELL-LED ▸ Workforce equity and culture ───────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-WE-01$$,
  $$The service is committed to workforce equality, understands equity and proactively works to promote equality, diversity and inclusion. Wellbeing, inclusion, trust and open communication are embedded in the culture of the service.$$,
  NULL, 271, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-WE-02$$,
  $$Staff and volunteers are actively encouraged to give feedback, raise concerns, and contribute to improvements through formal speaking up processes. They are confident that they will be treated with compassion and understanding, and will not be blamed, or treated negatively if they do so - including in relation to issues of racism and discrimination.$$,
  NULL, 272, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-WE-03$$,
  $$Staff wellbeing is promoted by providing personalised support, such as making reasonable adjustments, enabling flexible working, ensuring adequate rest, and providing a positive work environment. There is support if people are struggling at work.$$,
  NULL, 273, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 63–66: WELL-LED ▸ Capable and compassionate leaders ─────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Capable and compassionate leaders$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-CL-01$$,
  $$Where required, there is a registered manager in post. They understand their responsibilities and are supported by the board, trustees or directors and other managers to deliver good, effective, high-quality care.$$,
  NULL, 281, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Capable and compassionate leaders$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-CL-02$$,
  $$High-quality leadership is sustained through safe, effective, and inclusive recruitment and succession planning.$$,
  NULL, 282, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Capable and compassionate leaders$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-CL-03$$,
  $$Leaders are knowledgeable about issues and priorities that affect the quality of the service and have access to appropriate development in their role. They seek support or independent scrutiny where required.$$,
  NULL, 283, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Capable and compassionate leaders$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-CL-04$$,
  $$When something goes wrong, people receive a sincere and timely apology and are told about any actions being taken to prevent the same thing happening again.$$,
  NULL, 284, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 67–69: WELL-LED ▸ Governance and management (additional) ─────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Governance and management$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-GM-04$$,
  $$There are thorough business continuity plans in place for emergencies or natural disasters, such as adverse weather events, and staff know how to put these into practice.$$,
  NULL, 291, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Governance and management$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-GM-05$$,
  $$Data or notifications are consistently submitted to external partners as required.$$,
  NULL, 292, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Governance and management$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-GM-06$$,
  $$There are clear and effective governance, management and accountability arrangements. Staff understand their roles and responsibilities. Managers can account for the actions, behaviours and performance of staff.$$,
  NULL, 293, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 70–72: WELL-LED ▸ Partnerships and communities ───────────────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Partnerships and communities$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-PC-01$$,
  $$The service maintains positive relationships with the local community and works well with community partners.$$,
  NULL, 301, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Partnerships and communities$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-PC-02$$,
  $$Staff and leaders work in partnership with people and other organisations, so that services work as seamlessly as possible for people.$$,
  NULL, 302, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Partnerships and communities$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-PC-03$$,
  $$The service has strong external relationships and all staff including leaders engage early with people, communities, and partners to share learning with each other, which results in continuous improvements to the service.$$,
  NULL, 303, NULL
) ON CONFLICT DO NOTHING;

-- ── GAP 73–75: WELL-LED ▸ Improvement, innovation and learning ───────────────

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Improvement, innovation and learning$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-IL-01$$,
  $$Staff and leaders understand how to drive improvement through consistent approaches that enable the right environment for improvement, measuring outcomes and impact.$$,
  NULL, 311, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Improvement, innovation and learning$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-IL-02$$,
  $$Leaders foster a culture of trust by encouraging staff to speak up with ideas for improvement and innovation, and by actively investing time to listen and engage.$$,
  NULL, 312, NULL
) ON CONFLICT DO NOTHING;

INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Improvement, innovation and learning$$),
  (SELECT id FROM public.service_types WHERE name = $$Residential Rehabilitation Service$$),
  $$Core$$, $$WEL-IL-03$$,
  $$Staff and leaders engage with external work, including research, and embed evidence-based good practice in the service.$$,
  NULL, 313, NULL
) ON CONFLICT DO NOTHING;
