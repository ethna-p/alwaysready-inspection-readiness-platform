-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260724000003_arbd_checklist_cqc_language
-- Purpose : Replace all AI-written ARBD Specialist Care Home overrides with
--           the CQC's exact Good-level characteristic language from the Adult
--           Social Care Assessment Framework (Draft v9).
--           Remove 2 non-CQC net-new items. Add 15 gap items identical to
--           those already applied to Residential Care Home.
-- Rule    : Every checklist_item is a direct quote from CQC Good characteristics.
--           No paraphrasing. No ARBD-specific additions. The CQC framework has
--           no ARBD-specific Good-level characteristics.
-- Source  : 20260724000002_residential_care_home_checklist_cqc_language.sql
--           (same CQC text reused verbatim for ARBD — same framework applies)
-- Net change: 2 DELETEs + 39 UPDATEs + 15 INSERTs → 99 total ARBD items
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: DELETE the 2 non-CQC net-new ARBD items
-- ═══════════════════════════════════════════════════════════════════════════

-- SAF-MR-04 behaviour support plans (non-CQC, no equivalent in Good characteristics)
-- WEL-GM-06 dry house / alcohol abstinence policy (non-CQC, no equivalent in Good characteristics)

DELETE FROM public.klo_checklist_items
WHERE ref IN ($$SAF-MR-04$$, $$WEL-GM-06$$)
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: UPDATE ARBD overrides — revert to exact CQC Good-level language
-- ═══════════════════════════════════════════════════════════════════════════

-- ── SAFE ▸ Safety culture ────────────────────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a strong learning culture in which incidents that have caused harm, or could cause harm, are treated as opportunities to improve.$$
WHERE ref = $$SAF-SC-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── SAFE ▸ Managing risks during care and treatment ─────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People's care plans reflect any foreseeable risks and how they should be managed. Deterioration, emergencies and clinical risks are anticipated where possible and managed to reduce the potential for harm.$$
WHERE ref = $$SAF-MR-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Care, support and treatment are discussed with people so they understand the potential risks and side effects. Where appropriate, people and those close to them are actively involved in managing their own risks.$$
WHERE ref = $$SAF-MR-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- SAF-MR-05 in ARBD was the bed-rails item renamed from SAF-MR-04 by the ARBD
-- seed migration. It must now carry the CQC restraint characteristic, matching
-- RC's SAF-MR-05 gap item.
UPDATE public.klo_checklist_items
SET checklist_item = $$Restraint is only ever used as a last resort and there is a clear commitment from all staff to minimising the use of restrictive interventions in the service. If staff use restraint, it is lawful, for a legitimate purpose, safe and necessary, and staff follow good practice.$$
WHERE ref = $$SAF-MR-05$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── SAFE ▸ Safe systems, pathways and transitions ───────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$Plans and information for care during transitions are established and shared before people move between services. Plans consider people's individual needs, circumstances, ongoing care arrangements and expected outcomes.$$
WHERE ref = $$SAF-SP-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Safety and continuity are maintained across people's care journeys through collaborative working with people, staff and partners. This includes where people are moving between or accessing multiple services.$$
WHERE ref = $$SAF-SP-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff work together proactively with teams in other services, commissioners and people using the service to deliver co-ordinated, timely, consistent and person-centred care, support and treatment. Actions are appropriately owned and followed up.$$
WHERE ref = $$SAF-SP-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$When people have needs that are outside of the service's remit, staff adapt support and escalate issues to relevant agencies.$$
WHERE ref = $$SAF-SP-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── SAFE ▸ Safe environments and infection prevention and control ─────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service manages the control and prevention of infection well. Infection prevention and control roles are clear. The risk of infection is minimised because premises and equipment are kept clean and hygienic.$$
WHERE ref = $$SAF-EI-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── SAFE ▸ Safe staffing ─────────────────────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There are appropriate staffing levels and skill mix to meet people's needs. Individual needs are taken into consideration so that when people receive one-to-one support, the skills and experience of staff are matched to the person's needs.$$
WHERE ref = $$SAF-SS-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── SAFE ▸ Safe medicines and treatments ─────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear approach to the safe use of medicines, and roles and responsibilities are understood.$$
WHERE ref = $$SAF-MT-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Where the service is responsible, medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance.$$
WHERE ref = $$SAF-MT-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── EFFECTIVE ▸ Assessing needs ──────────────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People's needs are comprehensively assessed, and reflect their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics.$$
WHERE ref = $$EFF-AN-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Assessments are regularly reviewed and updated to make sure staff have current information, so that care, support and treatment is meeting people's needs and individual outcomes as expected.$$
WHERE ref = $$EFF-AN-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People's communication needs are assessed and met to maximise the effectiveness of care, support and treatment.$$
WHERE ref = $$EFF-AN-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── EFFECTIVE ▸ Evidence-based care and equitable outcomes ───────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People's nutritional and hydration needs are met in line with current standards and good practice guidance. Where applicable, there is positive feedback from dietetic professionals that the service asks for their advice and applies it properly.$$
WHERE ref = $$EFF-EB-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment and the service takes action to continuously improve it.$$
WHERE ref = $$EFF-EB-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff monitor and evaluate outcomes related to people's health and quality of life, including those linked to their aspirations and skill development, and act to improve them when possible.$$
WHERE ref = $$EFF-EB-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── EFFECTIVE ▸ Supporting people to live healthier lives ────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service works with people who use services and professionals to plan and enable access to health and social care support to achieve good health and wellbeing outcomes. This includes facilitating reasonable adjustments, supporting people to access health checks or to complete healthcare passports.$$
WHERE ref = $$EFF-HL-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Risks to people's health and wellbeing are identified and support to prevent deterioration is prioritised. This includes understanding specific risks for a person due to their needs and specific health conditions, keeping well in hot and cold weather and supporting people to remain as active and mobile as possible.$$
WHERE ref = $$EFF-HL-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are encouraged and supported to make healthier choices relating to diet, lifestyle, physical activity, personal and oral hygiene.$$
WHERE ref = $$EFF-HL-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── EFFECTIVE ▸ Consent to care and treatment ────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear understanding of the requirements of the Mental Capacity Act 2005 and guidance relating to capacity and consent, and staff demonstrate how they put these into practice effectively. People are supported to understand information, communicate and make decisions about their life, care, support and treatment in line with the Mental Capacity Act 2005, involving their representatives and advocates when needed.$$
WHERE ref = $$EFF-CT-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── CARING ▸ Kindness, compassion and dignity ────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People's privacy, confidentiality, and respect are consistently upheld. Staff are discreet and challenge behaviour and practices that fall short of this. Staff have a clear understanding of the boundaries of confidentiality and work within these.$$
WHERE ref = $$CAR-KD-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── CARING ▸ Person-centred care ─────────────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People are at the centre of how their care, support and treatment is delivered. Care is tailored to the individual and is not task-focused.$$
WHERE ref = $$CAR-PC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── CARING ▸ Independence, choice and control ────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$If people wish to, they are encouraged and enabled to access meaningful activities, hobbies and interests in a personalised way. People are offered meaningful and genuine choices.$$
WHERE ref = $$CAR-IC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to plan for important life changes, including those relating to potential medical and psychological needs. They can have enough time and accessible information to make informed decisions about their future.$$
WHERE ref = $$CAR-IC-05$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── RESPONSIVE ▸ Care provision, integration and continuity ──────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service understands the diverse needs of the people who use it and tailors their support accordingly. This includes recognising and responding to the needs of people with protected equality characteristics and those most at risk of experiencing poorer care or facing barriers to accessing care.$$
WHERE ref = $$RES-CC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service works collaboratively and flexibly with others. People experience continuity of care, support and treatment; this includes working with commissioners to manage continuity of care.$$
WHERE ref = $$RES-CC-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Where support is provided by more than one service, or by unpaid carers, staff work in a planned, coordinated and flexible way to make sure care is joined up and meets people's needs.$$
WHERE ref = $$RES-CC-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── RESPONSIVE ▸ Listening to and responding to feedback ─────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The staff and service welcome feedback, concerns or complaints as an opportunity to improve the service and the quality of care people receive. Learning from feedback, concerns or complaints is incorporated into practice.$$
WHERE ref = $$RES-LF-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── RESPONSIVE ▸ Timely and equitable access ─────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$People can access care, support and treatment, including physically, when they need it and in a way that works for them, which promotes equality, removes barriers or delays and protects their rights.$$
WHERE ref = $$RES-TA-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service is designed to be accessible and available for people at the point of need, including those most likely to have difficulty accessing care. When there are barriers that prevent equitable access, they are removed.$$
WHERE ref = $$RES-TA-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── RESPONSIVE ▸ Equity in experiences ───────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff are supported to develop the skills they need to remove barriers to effective communication with the people they support.$$
WHERE ref = $$RES-EE-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── WELL-LED ▸ Strategic direction ───────────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The values of the service are clear, understood and supported by staff. They are demonstrated through the behaviour of leaders and in practices within the service. They include key principles such as openness, involvement, respect, human rights, inclusion, diversity and equality.$$
WHERE ref = $$WEL-SD-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── WELL-LED ▸ Governance and management ─────────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service has an accurate statement of purpose that clearly reflects current service provision.$$
WHERE ref = $$WEL-GM-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective systems for monitoring and managing service performance, risk and learning from incidents that support innovation while maintaining the quality of care at the service.$$
WHERE ref = $$WEL-GM-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── WELL-LED ▸ Partnerships and communities ───────────────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$The service maintains positive relationships with the local community and works well with community partners.$$
WHERE ref = $$WEL-PC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders work in partnership with people and other organisations, so that services work as seamlessly as possible for people.$$
WHERE ref = $$WEL-PC-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ── WELL-LED ▸ Improvement, innovation and learning ──────────────────────────

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders engage with external work, including research, and embed evidence-based good practice in the service.$$
WHERE ref = $$WEL-IL-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: INSERT gap items
-- These are the 15 CQC Good-level characteristics present in RC but absent
-- from ARBD (either because the ARBD seed pre-dates the RC gap migration, or
-- because ARBD's rename/net-new displaced the ref).
-- Text is identical to 20260724000002_residential_care_home_checklist_cqc_language.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── GAP 1: Managing risks — restrictions on freedom (SAF-MR-04) ──────────────
-- The ARBD seed renamed the original SAF-MR-04 to SAF-MR-05; re-insert with
-- its CQC Good-level text so the sequence is complete.
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Managing risks during care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MR-04$$,
  $$The service has a process to ensure that any restrictions on people's freedom, choice and control are necessary, proportionate and safe. This particularly includes where people lack mental capacity.$$,
  NULL, 9, NULL
);

-- ── GAP 2: Safety culture — closed culture (SAF-SC-06) ───────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SC-06$$,
  $$Staff and leaders understand what constitutes a closed culture and the risks to people, including organisational abuse. There are systems and processes in place to identify concerns and prevent closed cultures from developing, and appropriate action is taken when needed.$$,
  NULL, 34, NULL
);

-- ── GAP 3: Safe systems — delegated healthcare activities (SAF-SP-05) ────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe systems, pathways and transitions$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SP-05$$,
  $$The service has appropriate systems and processes to manage its responsibilities in relation to delegated healthcare activities safely, in line with good practice.$$,
  NULL, 36, NULL
);

-- ── GAP 4: Safeguarding — Deprivation of Liberty Safeguards (SAF-SG-04) ──────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SG-04$$,
  $$People are deprived of their liberty lawfully. Any potential deprivation of liberty is recognised promptly and appropriate authorisation is sought. Where applicable, the Deprivation of Liberty Safeguards (DoLS) are used appropriately and only when it is in the best interests of the person.$$,
  NULL, 37, NULL
);

-- ── GAP 5: Safeguarding — people empowered to raise concerns (SAF-SG-05) ─────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-SG-05$$,
  $$People are supported to understand what safeguarding means and how to raise concerns on behalf of themselves and others, and are encouraged and empowered to do so.$$,
  NULL, 38, NULL
);

-- ── GAP 6: Safe medicines — involvement in medicines decisions (SAF-MT-05) ────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MT-05$$,
  $$People and their representatives are involved in assessments, reviews and decisions, including the level of support needed and self-medication. This is clearly documented in care records.$$,
  NULL, 39, NULL
);

-- ── GAP 7: Safe medicines — STOMP/STAMP (SAF-MT-06) ─────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$SAF-MT-06$$,
  $$The service actively considers opportunities to reduce the over-medication of people, in line with STOMP/STAMP principles where applicable.$$,
  NULL, 40, NULL
);

-- ── GAP 8: Assessing needs — people involved in assessment (EFF-AN-04) ───────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Assessing needs$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-AN-04$$,
  $$People are involved as much as possible in their needs assessment and their needs are fully identified and understood. Where people need support to be involved, this is provided.$$,
  NULL, 15, NULL
);

-- ── GAP 9: Evidence-based — food choices and preferences (EFF-EB-05) ─────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-EB-05$$,
  $$Staff are aware of individual preferences in relation to eating and drinking and there is flexibility when needed or requested. There are good quality food choices and these respect individual wishes, including those relating to sensory, cultural, religious and ethical preferences.$$,
  NULL, 16, NULL
);

-- ── GAP 10: Consent — best interests decisions (EFF-CT-04) ───────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Consent to care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$EFF-CT-04$$,
  $$The service makes lawful decisions in people's best interests when required. People are involved and their feelings, beliefs and values are considered. Those close to the person and their advocates are involved and kept informed of any changes as appropriate.$$,
  NULL, 17, NULL
);

-- ── GAP 11: Independence — choice and control (CAR-IC-06) ────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$CAR-IC-06$$,
  $$People have choice and control over their own care and are empowered to make decisions about their care, support, treatment and wellbeing.$$,
  NULL, 13, NULL
);

-- ── GAP 12: Care provision — identify gaps in provision (RES-CC-04) ──────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Care provision, integration and continuity$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-CC-04$$,
  $$Staff can identify and take appropriate action when there is a gap in care provision. This includes identifying and taking appropriate action where people are eligible to receive more care or support.$$,
  NULL, 13, NULL
);

-- ── GAP 13: Listening — people feel confident concerns taken seriously (RES-LF-04)
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$RES-LF-04$$,
  $$People feel confident that their views or concerns will be taken seriously and they will be treated compassionately, without negative repercussions.$$,
  NULL, 14, NULL
);

-- ── GAP 14: Governance — clear roles and accountability (WEL-GM-06) ──────────
-- Re-insert WEL-GM-06 with CQC Good-level text after deleting the ARBD
-- dry-house version above.
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Governance and management$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-GM-06$$,
  $$There are clear and effective governance, management and accountability arrangements. Staff understand their roles and responsibilities. Managers can account for the actions, behaviours and performance of staff.$$,
  NULL, 21, NULL
);

-- ── GAP 15: Capable leaders — apology when things go wrong (WEL-CL-04) ───────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Capable and compassionate leaders$$),
  (SELECT id FROM public.service_types WHERE name = $$ARBD Specialist Care Home$$),
  $$Core$$, $$WEL-CL-04$$,
  $$When something goes wrong, people receive a sincere and timely apology and are told about any actions being taken to prevent the same thing happening again.$$,
  NULL, 22, NULL
);
