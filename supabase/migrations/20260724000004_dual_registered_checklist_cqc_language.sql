-- ============================================================
-- Migration: 20260724000004_dual_registered_checklist_cqc_language.sql
-- ============================================================
-- Purpose
-- -------
-- Replaces all Dual-Registered Care Home Core checklist items
-- with exact CQC Good-level wording drawn from the CQC Draft
-- Assessment Framework ASC v9.
--
-- Source of truth
-- ---------------
-- 20260724000001_nursing_home_checklist_cqc_language.sql
-- 20260724000002_residential_care_home_checklist_cqc_language.sql
--
-- Scope
-- -----
-- 1. UPDATE checklist_item for all 84 Residential sub-service items.
-- 2. UPDATE checklist_item for all 84 Nursing sub-service items
--    (same CQC text as Residential for each ref — the framework
--    makes no service-type distinction).
-- 3. DELETE all 12 DEM-prefixed Dementia sub-service items (AI-
--    written; no CQC Good-level source text exists for them).
-- 4. DELETE the CAR-PC-04 Joint item (item_type = Dementia Care;
--    same AI-written dementia content, no CQC source text).
-- 5. INSERT 56 gap items (28 CQC Good-level characteristics that
--    had no existing checklist entry, each inserted twice: once
--    for Residential sub-service and once for Nursing sub-service).
--
-- Dollar-quoting is used throughout; no single-quote string
-- literals appear anywhere in this file.
-- ============================================================


-- ============================================================
-- PART 1 — UPDATES (168 statements: 84 Residential + 84 Nursing)
-- ============================================================

-- ── SAFE ▸ Safety culture ──────────────────────────────────────

-- SAF-SC-01
UPDATE public.klo_checklist_items
SET checklist_item = $$All incidents are recorded, investigated and outcomes are communicated to those involved. If harm has occurred, people are given full details of what happened, why, and what has been learned.$$
WHERE ref = $$SAF-SC-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$All incidents are recorded, investigated and outcomes are communicated to those involved. If harm has occurred, people are given full details of what happened, why, and what has been learned.$$
WHERE ref = $$SAF-SC-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SC-02
UPDATE public.klo_checklist_items
SET checklist_item = $$There is a good understanding of the duty of candour. When an incident has happened, staff are open and transparent with people and those close to them.$$
WHERE ref = $$SAF-SC-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a good understanding of the duty of candour. When an incident has happened, staff are open and transparent with people and those close to them.$$
WHERE ref = $$SAF-SC-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SC-03
UPDATE public.klo_checklist_items
SET checklist_item = $$There is a strong learning culture in which incidents that have caused harm, or could cause harm, are treated as opportunities to improve.$$
WHERE ref = $$SAF-SC-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a strong learning culture in which incidents that have caused harm, or could cause harm, are treated as opportunities to improve.$$
WHERE ref = $$SAF-SC-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SC-04
UPDATE public.klo_checklist_items
SET checklist_item = $$Complaints, concerns and other feedback about safety are welcomed and prioritised as key sources used to identify and manage safety risks before safety incidents happen.$$
WHERE ref = $$SAF-SC-04$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Complaints, concerns and other feedback about safety are welcomed and prioritised as key sources used to identify and manage safety risks before safety incidents happen.$$
WHERE ref = $$SAF-SC-04$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SC-05
UPDATE public.klo_checklist_items
SET checklist_item = $$The service looks for safety-related themes and trends. Patient safety alerts are consistently reviewed and acted on, and learning from external safety incidents is embedded in the delivery of care.$$
WHERE ref = $$SAF-SC-05$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service looks for safety-related themes and trends. Patient safety alerts are consistently reviewed and acted on, and learning from external safety incidents is embedded in the delivery of care.$$
WHERE ref = $$SAF-SC-05$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── SAFE ▸ Managing risks during care and treatment ───────────

-- SAF-MR-01
UPDATE public.klo_checklist_items
SET checklist_item = $$People's care plans reflect any foreseeable risks and how they should be managed. Deterioration, emergencies and clinical risks are anticipated where possible and managed to reduce the potential for harm.$$
WHERE ref = $$SAF-MR-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People's care plans reflect any foreseeable risks and how they should be managed. Deterioration, emergencies and clinical risks are anticipated where possible and managed to reduce the potential for harm.$$
WHERE ref = $$SAF-MR-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-MR-02
UPDATE public.klo_checklist_items
SET checklist_item = $$People are respected and protected from avoidable harm because care is provided in line with recognised good practice guidance.$$
WHERE ref = $$SAF-MR-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are respected and protected from avoidable harm because care is provided in line with recognised good practice guidance.$$
WHERE ref = $$SAF-MR-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-MR-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Care, support and treatment are discussed with people so they understand the potential risks and side effects. Where appropriate, people and those close to them are actively involved in managing their own risks.$$
WHERE ref = $$SAF-MR-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Care, support and treatment are discussed with people so they understand the potential risks and side effects. Where appropriate, people and those close to them are actively involved in managing their own risks.$$
WHERE ref = $$SAF-MR-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-MR-04
UPDATE public.klo_checklist_items
SET checklist_item = $$The service has a process to ensure that any restrictions on people's freedom, choice and control are necessary, proportionate and safe. This particularly includes where people lack mental capacity.$$
WHERE ref = $$SAF-MR-04$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service has a process to ensure that any restrictions on people's freedom, choice and control are necessary, proportionate and safe. This particularly includes where people lack mental capacity.$$
WHERE ref = $$SAF-MR-04$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── SAFE ▸ Safe systems, pathways and transitions ─────────────

-- SAF-SP-01
UPDATE public.klo_checklist_items
SET checklist_item = $$Plans and information for care during transitions are established and shared before people move between services. Plans consider people's individual needs, circumstances, ongoing care arrangements and expected outcomes.$$
WHERE ref = $$SAF-SP-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Plans and information for care during transitions are established and shared before people move between services. Plans consider people's individual needs, circumstances, ongoing care arrangements and expected outcomes.$$
WHERE ref = $$SAF-SP-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SP-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Safety and continuity are maintained across people's care journeys through collaborative working with people, staff and partners. This includes where people are moving between or accessing multiple services.$$
WHERE ref = $$SAF-SP-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Safety and continuity are maintained across people's care journeys through collaborative working with people, staff and partners. This includes where people are moving between or accessing multiple services.$$
WHERE ref = $$SAF-SP-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SP-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff work together proactively with teams in other services, commissioners and people using the service to deliver co-ordinated, timely, consistent and person-centred care, support and treatment. Actions are appropriately owned and followed up.$$
WHERE ref = $$SAF-SP-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff work together proactively with teams in other services, commissioners and people using the service to deliver co-ordinated, timely, consistent and person-centred care, support and treatment. Actions are appropriately owned and followed up.$$
WHERE ref = $$SAF-SP-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SP-04
UPDATE public.klo_checklist_items
SET checklist_item = $$When people have needs that are outside of the service's remit, staff adapt support and escalate issues to relevant agencies.$$
WHERE ref = $$SAF-SP-04$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$When people have needs that are outside of the service's remit, staff adapt support and escalate issues to relevant agencies.$$
WHERE ref = $$SAF-SP-04$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── SAFE ▸ Safeguarding ───────────────────────────────────────

-- SAF-SG-01
UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective safeguarding systems, processes and practices, managed by appropriately trained staff, which protect people from abuse, neglect, harassment and breaches of their dignity. These operate in line with legislation and guidance, are communicated effectively and are accessible to people, staff and visitors to the service.$$
WHERE ref = $$SAF-SG-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective safeguarding systems, processes and practices, managed by appropriately trained staff, which protect people from abuse, neglect, harassment and breaches of their dignity. These operate in line with legislation and guidance, are communicated effectively and are accessible to people, staff and visitors to the service.$$
WHERE ref = $$SAF-SG-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SG-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff can identify abuse and improper treatment. They recognise early indicators of potential abuse or poor care, even when these do not meet the threshold for formal safeguarding concerns. Staff act quickly and appropriately to protect people, working closely with partners.$$
WHERE ref = $$SAF-SG-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff can identify abuse and improper treatment. They recognise early indicators of potential abuse or poor care, even when these do not meet the threshold for formal safeguarding concerns. Staff act quickly and appropriately to protect people, working closely with partners.$$
WHERE ref = $$SAF-SG-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SG-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Information about people who have suffered harm or are at risk of harm is shared appropriately with other agencies, such as the local authority, in a timely way. Staff use appropriate escalation pathways when concerns are not addressed.$$
WHERE ref = $$SAF-SG-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Information about people who have suffered harm or are at risk of harm is shared appropriately with other agencies, such as the local authority, in a timely way. Staff use appropriate escalation pathways when concerns are not addressed.$$
WHERE ref = $$SAF-SG-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── SAFE ▸ Safe environments and IPC ─────────────────────────

-- SAF-EI-01
UPDATE public.klo_checklist_items
SET checklist_item = $$Fire safety procedures are effective. Concerns are escalated appropriately where the service is not directly responsible for the premises.$$
WHERE ref = $$SAF-EI-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Fire safety procedures are effective. Concerns are escalated appropriately where the service is not directly responsible for the premises.$$
WHERE ref = $$SAF-EI-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-EI-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Where the provider is responsible, there is a comprehensive system to proactively manage the safety and upkeep of the premises (including communal and personal spaces) and equipment, and risks are assessed and controlled. Professionally qualified and competent people complete the necessary environmental and equipment checks and maintenance.$$
WHERE ref = $$SAF-EI-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Where the provider is responsible, there is a comprehensive system to proactively manage the safety and upkeep of the premises (including communal and personal spaces) and equipment, and risks are assessed and controlled. Professionally qualified and competent people complete the necessary environmental and equipment checks and maintenance.$$
WHERE ref = $$SAF-EI-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-EI-03
UPDATE public.klo_checklist_items
SET checklist_item = $$The service manages the control and prevention of infection well. Infection prevention and control roles are clear. The risk of infection is minimised because premises and equipment are kept clean and hygienic.$$
WHERE ref = $$SAF-EI-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service manages the control and prevention of infection well. Infection prevention and control roles are clear. The risk of infection is minimised because premises and equipment are kept clean and hygienic.$$
WHERE ref = $$SAF-EI-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-EI-04
UPDATE public.klo_checklist_items
SET checklist_item = $$The service monitors and acts on equipment alerts, recalls and safety information.$$
WHERE ref = $$SAF-EI-04$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service monitors and acts on equipment alerts, recalls and safety information.$$
WHERE ref = $$SAF-EI-04$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-EI-05
UPDATE public.klo_checklist_items
SET checklist_item = $$Facilities, equipment (including special or adaptive equipment) and technology that are the responsibility of the service are maintained, stored and used in line with good practice and guidance.$$
WHERE ref = $$SAF-EI-05$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Facilities, equipment (including special or adaptive equipment) and technology that are the responsibility of the service are maintained, stored and used in line with good practice and guidance.$$
WHERE ref = $$SAF-EI-05$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── SAFE ▸ Safe staffing ──────────────────────────────────────

-- SAF-SS-01
UPDATE public.klo_checklist_items
SET checklist_item = $$There are appropriate staffing levels and skill mix to meet people's needs. Individual needs are taken into consideration so that when people receive one-to-one support, the skills and experience of staff are matched to the person's needs.$$
WHERE ref = $$SAF-SS-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are appropriate staffing levels and skill mix to meet people's needs. Individual needs are taken into consideration so that when people receive one-to-one support, the skills and experience of staff are matched to the person's needs.$$
WHERE ref = $$SAF-SS-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SS-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Thorough and safe recruitment practices ensure staff, including agency staff and volunteers, are suitably experienced, qualified and competent to carry out their roles.$$
WHERE ref = $$SAF-SS-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Thorough and safe recruitment practices ensure staff, including agency staff and volunteers, are suitably experienced, qualified and competent to carry out their roles.$$
WHERE ref = $$SAF-SS-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SS-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Actions are taken to protect staff from fatigue, and leaders understand its impact on the safety of those who use services.$$
WHERE ref = $$SAF-SS-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Actions are taken to protect staff from fatigue, and leaders understand its impact on the safety of those who use services.$$
WHERE ref = $$SAF-SS-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-SS-04
UPDATE public.klo_checklist_items
SET checklist_item = $$There are induction, supervision and appraisal processes to support staff to develop and improve services (including professional revalidation where needed).$$
WHERE ref = $$SAF-SS-04$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are induction, supervision and appraisal processes to support staff to develop and improve services (including professional revalidation where needed).$$
WHERE ref = $$SAF-SS-04$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── SAFE ▸ Safe medicines and treatments ─────────────────────

-- SAF-MT-01
UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear approach to the safe use of medicines, and roles and responsibilities are understood.$$
WHERE ref = $$SAF-MT-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear approach to the safe use of medicines, and roles and responsibilities are understood.$$
WHERE ref = $$SAF-MT-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-MT-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Controlled drugs are stored, recorded, administered and disposed of in line with legislation and guidance.$$
WHERE ref = $$SAF-MT-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Controlled drugs are stored, recorded, administered and disposed of in line with legislation and guidance.$$
WHERE ref = $$SAF-MT-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-MT-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Where the service is responsible, medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance.$$
WHERE ref = $$SAF-MT-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Where the service is responsible, medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance.$$
WHERE ref = $$SAF-MT-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- SAF-MT-04
UPDATE public.klo_checklist_items
SET checklist_item = $$The administration of PRN medicines (medicines taken when required) is guided by clear protocols, and there are timely reviews.$$
WHERE ref = $$SAF-MT-04$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The administration of PRN medicines (medicines taken when required) is guided by clear protocols, and there are timely reviews.$$
WHERE ref = $$SAF-MT-04$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── EFFECTIVE ▸ Assessing needs ──────────────────────────────

-- EFF-AN-01
UPDATE public.klo_checklist_items
SET checklist_item = $$People's needs are comprehensively assessed, and reflect their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics.$$
WHERE ref = $$EFF-AN-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People's needs are comprehensively assessed, and reflect their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics.$$
WHERE ref = $$EFF-AN-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- EFF-AN-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Assessments are regularly reviewed and updated to make sure staff have current information, so that care, support and treatment is meeting people's needs and individual outcomes as expected.$$
WHERE ref = $$EFF-AN-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Assessments are regularly reviewed and updated to make sure staff have current information, so that care, support and treatment is meeting people's needs and individual outcomes as expected.$$
WHERE ref = $$EFF-AN-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- EFF-AN-03
UPDATE public.klo_checklist_items
SET checklist_item = $$People's communication needs are assessed and met to maximise the effectiveness of care, support and treatment.$$
WHERE ref = $$EFF-AN-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People's communication needs are assessed and met to maximise the effectiveness of care, support and treatment.$$
WHERE ref = $$EFF-AN-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── EFFECTIVE ▸ Evidence-based care and equitable outcomes ────

-- EFF-EB-01
UPDATE public.klo_checklist_items
SET checklist_item = $$People's nutritional and hydration needs are met in line with current standards and good practice guidance. Where applicable, there is positive feedback from dietetic professionals that the service asks for their advice and applies it properly.$$
WHERE ref = $$EFF-EB-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People's nutritional and hydration needs are met in line with current standards and good practice guidance. Where applicable, there is positive feedback from dietetic professionals that the service asks for their advice and applies it properly.$$
WHERE ref = $$EFF-EB-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- EFF-EB-02
UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to plan and manage their dietary needs and associated risks, including risks of poor nutrition, dehydration, swallowing problems and other medical conditions that affect their health.$$
WHERE ref = $$EFF-EB-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to plan and manage their dietary needs and associated risks, including risks of poor nutrition, dehydration, swallowing problems and other medical conditions that affect their health.$$
WHERE ref = $$EFF-EB-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- EFF-EB-03
UPDATE public.klo_checklist_items
SET checklist_item = $$There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment and the service takes action to continuously improve it.$$
WHERE ref = $$EFF-EB-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment and the service takes action to continuously improve it.$$
WHERE ref = $$EFF-EB-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- EFF-EB-04
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff monitor and evaluate outcomes related to people's health and quality of life, including those linked to their aspirations and skill development, and act to improve them when possible.$$
WHERE ref = $$EFF-EB-04$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff monitor and evaluate outcomes related to people's health and quality of life, including those linked to their aspirations and skill development, and act to improve them when possible.$$
WHERE ref = $$EFF-EB-04$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── EFFECTIVE ▸ Supporting people to live healthier lives ─────

-- EFF-HL-01
UPDATE public.klo_checklist_items
SET checklist_item = $$The service works with people who use services and professionals to plan and enable access to health and social care support to achieve good health and wellbeing outcomes. This includes facilitating reasonable adjustments, supporting people to access health checks or to complete healthcare passports.$$
WHERE ref = $$EFF-HL-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service works with people who use services and professionals to plan and enable access to health and social care support to achieve good health and wellbeing outcomes. This includes facilitating reasonable adjustments, supporting people to access health checks or to complete healthcare passports.$$
WHERE ref = $$EFF-HL-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- EFF-HL-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Risks to people's health and wellbeing are identified and support to prevent deterioration is prioritised. This includes understanding specific risks for a person due to their needs and specific health conditions, keeping well in hot and cold weather and supporting people to remain as active and mobile as possible.$$
WHERE ref = $$EFF-HL-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Risks to people's health and wellbeing are identified and support to prevent deterioration is prioritised. This includes understanding specific risks for a person due to their needs and specific health conditions, keeping well in hot and cold weather and supporting people to remain as active and mobile as possible.$$
WHERE ref = $$EFF-HL-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- EFF-HL-03
UPDATE public.klo_checklist_items
SET checklist_item = $$People are encouraged and supported to make healthier choices relating to diet, lifestyle, physical activity, personal and oral hygiene.$$
WHERE ref = $$EFF-HL-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are encouraged and supported to make healthier choices relating to diet, lifestyle, physical activity, personal and oral hygiene.$$
WHERE ref = $$EFF-HL-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── EFFECTIVE ▸ Consent to care and treatment ─────────────────

-- EFF-CT-01
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff know the importance of consent and relevant legal requirements. They make sure people understand what they are consenting to before they deliver care, support or treatment. People are given the appropriate information, support and time they need to make an informed decision.$$
WHERE ref = $$EFF-CT-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff know the importance of consent and relevant legal requirements. They make sure people understand what they are consenting to before they deliver care, support or treatment. People are given the appropriate information, support and time they need to make an informed decision.$$
WHERE ref = $$EFF-CT-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- EFF-CT-02
UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear understanding of the requirements of the Mental Capacity Act 2005 and guidance relating to capacity and consent, and staff demonstrate how they put these into practice effectively. People are supported to understand information, communicate and make decisions about their life, care, support and treatment in line with the Mental Capacity Act 2005, involving their representatives and advocates when needed.$$
WHERE ref = $$EFF-CT-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear understanding of the requirements of the Mental Capacity Act 2005 and guidance relating to capacity and consent, and staff demonstrate how they put these into practice effectively. People are supported to understand information, communicate and make decisions about their life, care, support and treatment in line with the Mental Capacity Act 2005, involving their representatives and advocates when needed.$$
WHERE ref = $$EFF-CT-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- EFF-CT-03
UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to access independent advocacy, including statutory or non-statutory when available, and advocates are appropriately involved by the service.$$
WHERE ref = $$EFF-CT-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to access independent advocacy, including statutory or non-statutory when available, and advocates are appropriately involved by the service.$$
WHERE ref = $$EFF-CT-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── CARING ▸ Kindness, compassion and dignity ─────────────────

-- CAR-KD-01
UPDATE public.klo_checklist_items
SET checklist_item = $$There is a culture of kindness and respect across teams. People feel cared for with kindness, compassion, dignity and respect.$$
WHERE ref = $$CAR-KD-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a culture of kindness and respect across teams. People feel cared for with kindness, compassion, dignity and respect.$$
WHERE ref = $$CAR-KD-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- CAR-KD-02
UPDATE public.klo_checklist_items
SET checklist_item = $$People's privacy, confidentiality, and respect are consistently upheld. Staff are discreet and challenge behaviour and practices that fall short of this. Staff have a clear understanding of the boundaries of confidentiality and work within these.$$
WHERE ref = $$CAR-KD-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People's privacy, confidentiality, and respect are consistently upheld. Staff are discreet and challenge behaviour and practices that fall short of this. Staff have a clear understanding of the boundaries of confidentiality and work within these.$$
WHERE ref = $$CAR-KD-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- CAR-KD-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff genuinely care about people's wellbeing and show it in a thoughtful, meaningful way. They promptly respond to people's emotions, discomfort, distress, or urgent needs in a positive way.$$
WHERE ref = $$CAR-KD-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff genuinely care about people's wellbeing and show it in a thoughtful, meaningful way. They promptly respond to people's emotions, discomfort, distress, or urgent needs in a positive way.$$
WHERE ref = $$CAR-KD-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── CARING ▸ Person-centred care ─────────────────────────────

-- CAR-PC-01
UPDATE public.klo_checklist_items
SET checklist_item = $$People are at the centre of how their care, support and treatment is delivered. Care is tailored to the individual and is not task-focused.$$
WHERE ref = $$CAR-PC-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are at the centre of how their care, support and treatment is delivered. Care is tailored to the individual and is not task-focused.$$
WHERE ref = $$CAR-PC-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- CAR-PC-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff treat people as individuals, considering any relevant protected equality characteristics and ensuring their personal, cultural, social, spiritual and religious needs are understood and met.$$
WHERE ref = $$CAR-PC-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff treat people as individuals, considering any relevant protected equality characteristics and ensuring their personal, cultural, social, spiritual and religious needs are understood and met.$$
WHERE ref = $$CAR-PC-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── CARING ▸ Independence, choice and control ─────────────────

-- CAR-IC-01
UPDATE public.klo_checklist_items
SET checklist_item = $$If people wish to, they are encouraged and enabled to access meaningful activities, hobbies and interests in a personalised way. People are offered meaningful and genuine choices.$$
WHERE ref = $$CAR-IC-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$If people wish to, they are encouraged and enabled to access meaningful activities, hobbies and interests in a personalised way. People are offered meaningful and genuine choices.$$
WHERE ref = $$CAR-IC-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- CAR-IC-02
UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to establish and maintain relationships and networks that are important to them, with access to family, friends, cultural connections, and advocacy support while using the service. When applicable, visiting restrictions are limited to exceptional circumstances in accordance with guidance and legislation.$$
WHERE ref = $$CAR-IC-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to establish and maintain relationships and networks that are important to them, with access to family, friends, cultural connections, and advocacy support while using the service. When applicable, visiting restrictions are limited to exceptional circumstances in accordance with guidance and legislation.$$
WHERE ref = $$CAR-IC-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- CAR-IC-03
UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to make decisions about end of life preferences and advance decisions if they wish to. People who may be approaching the end of their life are identified to ensure their needs are met, in line with their preferences and choices, and the right support is provided.$$
WHERE ref = $$CAR-IC-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to make decisions about end of life preferences and advance decisions if they wish to. People who may be approaching the end of their life are identified to ensure their needs are met, in line with their preferences and choices, and the right support is provided.$$
WHERE ref = $$CAR-IC-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- CAR-IC-04
UPDATE public.klo_checklist_items
SET checklist_item = $$There is a compassionate and supportive approach towards those close to the person, or staff, before and after a person dies.$$
WHERE ref = $$CAR-IC-04$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a compassionate and supportive approach towards those close to the person, or staff, before and after a person dies.$$
WHERE ref = $$CAR-IC-04$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- CAR-IC-05
UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to plan for important life changes, including those relating to potential medical and psychological needs. They can have enough time and accessible information to make informed decisions about their future.$$
WHERE ref = $$CAR-IC-05$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to plan for important life changes, including those relating to potential medical and psychological needs. They can have enough time and accessible information to make informed decisions about their future.$$
WHERE ref = $$CAR-IC-05$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── RESPONSIVE ▸ Care provision, integration and continuity ───

-- RES-CC-01
UPDATE public.klo_checklist_items
SET checklist_item = $$The service understands the diverse needs of the people who use it and tailors their support accordingly. This includes recognising and responding to the needs of people with protected equality characteristics and those most at risk of experiencing poorer care or facing barriers to accessing care.$$
WHERE ref = $$RES-CC-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service understands the diverse needs of the people who use it and tailors their support accordingly. This includes recognising and responding to the needs of people with protected equality characteristics and those most at risk of experiencing poorer care or facing barriers to accessing care.$$
WHERE ref = $$RES-CC-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- RES-CC-02
UPDATE public.klo_checklist_items
SET checklist_item = $$The service works collaboratively and flexibly with others. People experience continuity of care, support and treatment; this includes working with commissioners to manage continuity of care.$$
WHERE ref = $$RES-CC-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service works collaboratively and flexibly with others. People experience continuity of care, support and treatment; this includes working with commissioners to manage continuity of care.$$
WHERE ref = $$RES-CC-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- RES-CC-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Where support is provided by more than one service, or by unpaid carers, staff work in a planned, coordinated and flexible way to make sure care is joined up and meets people's needs.$$
WHERE ref = $$RES-CC-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Where support is provided by more than one service, or by unpaid carers, staff work in a planned, coordinated and flexible way to make sure care is joined up and meets people's needs.$$
WHERE ref = $$RES-CC-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── RESPONSIVE ▸ Listening to and responding to feedback ──────

-- RES-LF-01
UPDATE public.klo_checklist_items
SET checklist_item = $$People and those close to them understand how to give feedback, make suggestions or complain about care, support and treatment. They can do this in a way that meets their needs.$$
WHERE ref = $$RES-LF-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People and those close to them understand how to give feedback, make suggestions or complain about care, support and treatment. They can do this in a way that meets their needs.$$
WHERE ref = $$RES-LF-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- RES-LF-02
UPDATE public.klo_checklist_items
SET checklist_item = $$The staff and service welcome feedback, concerns or complaints as an opportunity to improve the service and the quality of care people receive. Learning from feedback, concerns or complaints is incorporated into practice.$$
WHERE ref = $$RES-LF-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The staff and service welcome feedback, concerns or complaints as an opportunity to improve the service and the quality of care people receive. Learning from feedback, concerns or complaints is incorporated into practice.$$
WHERE ref = $$RES-LF-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- RES-LF-03
UPDATE public.klo_checklist_items
SET checklist_item = $$The service keeps people informed about how their feedback has been addressed and any action taken including a full explanation when it has not been acted on. It does this in line with established processes, and people are given information on how to escalate their complaints to the relevant Ombudsman at the end of its complaint process.$$
WHERE ref = $$RES-LF-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service keeps people informed about how their feedback has been addressed and any action taken including a full explanation when it has not been acted on. It does this in line with established processes, and people are given information on how to escalate their complaints to the relevant Ombudsman at the end of its complaint process.$$
WHERE ref = $$RES-LF-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── RESPONSIVE ▸ Timely and equitable access ──────────────────

-- RES-TA-01
UPDATE public.klo_checklist_items
SET checklist_item = $$People can access care, support and treatment, including physically, when they need it and in a way that works for them, which promotes equality, removes barriers or delays and protects their rights.$$
WHERE ref = $$RES-TA-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People can access care, support and treatment, including physically, when they need it and in a way that works for them, which promotes equality, removes barriers or delays and protects their rights.$$
WHERE ref = $$RES-TA-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- RES-TA-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Reasonable adjustments are understood and made to ensure equal access to the service for all. This removes barriers for people who find it hard to access services.$$
WHERE ref = $$RES-TA-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Reasonable adjustments are understood and made to ensure equal access to the service for all. This removes barriers for people who find it hard to access services.$$
WHERE ref = $$RES-TA-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- RES-TA-03
UPDATE public.klo_checklist_items
SET checklist_item = $$The service is designed to be accessible and available for people at the point of need, including those most likely to have difficulty accessing care. When there are barriers that prevent equitable access, they are removed.$$
WHERE ref = $$RES-TA-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service is designed to be accessible and available for people at the point of need, including those most likely to have difficulty accessing care. When there are barriers that prevent equitable access, they are removed.$$
WHERE ref = $$RES-TA-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── RESPONSIVE ▸ Equity in experiences ───────────────────────

-- RES-EE-01
UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders and staff work collaboratively to achieve equity. They do this by recognising barriers, collecting and acting on evidence, including people's experiences, and allocating resources to reduce barriers and improve this.$$
WHERE ref = $$RES-EE-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders and staff work collaboratively to achieve equity. They do this by recognising barriers, collecting and acting on evidence, including people's experiences, and allocating resources to reduce barriers and improve this.$$
WHERE ref = $$RES-EE-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- RES-EE-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Interpreting and translation are provided or accessed for people who don't speak English as a first language and for people who use British Sign Language.$$
WHERE ref = $$RES-EE-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Interpreting and translation are provided or accessed for people who don't speak English as a first language and for people who use British Sign Language.$$
WHERE ref = $$RES-EE-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- RES-EE-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff are supported to develop the skills they need to remove barriers to effective communication with the people they support.$$
WHERE ref = $$RES-EE-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff are supported to develop the skills they need to remove barriers to effective communication with the people they support.$$
WHERE ref = $$RES-EE-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── WELL-LED ▸ Strategic direction ───────────────────────────

-- WEL-SD-01
UPDATE public.klo_checklist_items
SET checklist_item = $$The values of the service are clear, understood and supported by staff. They are demonstrated through the behaviour of leaders and in practices within the service. They include key principles such as openness, involvement, respect, human rights, inclusion, diversity and equality.$$
WHERE ref = $$WEL-SD-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The values of the service are clear, understood and supported by staff. They are demonstrated through the behaviour of leaders and in practices within the service. They include key principles such as openness, involvement, respect, human rights, inclusion, diversity and equality.$$
WHERE ref = $$WEL-SD-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-SD-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders learn from staff who work directly with people, to build trust and mutual understanding. Feedback is valued and used to track progress, shape priorities and drive improvements.$$
WHERE ref = $$WEL-SD-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders learn from staff who work directly with people, to build trust and mutual understanding. Feedback is valued and used to track progress, shape priorities and drive improvements.$$
WHERE ref = $$WEL-SD-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-SD-03
UPDATE public.klo_checklist_items
SET checklist_item = $$The strategy supports the stability and operational sustainability of the service.$$
WHERE ref = $$WEL-SD-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The strategy supports the stability and operational sustainability of the service.$$
WHERE ref = $$WEL-SD-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── WELL-LED ▸ Workforce equity and culture ───────────────────

-- WEL-WE-01
UPDATE public.klo_checklist_items
SET checklist_item = $$The service is committed to workforce equality, understands equity and proactively works to promote equality, diversity and inclusion. Wellbeing, inclusion, trust and open communication are embedded in the culture of the service.$$
WHERE ref = $$WEL-WE-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service is committed to workforce equality, understands equity and proactively works to promote equality, diversity and inclusion. Wellbeing, inclusion, trust and open communication are embedded in the culture of the service.$$
WHERE ref = $$WEL-WE-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-WE-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and volunteers are actively encouraged to give feedback, raise concerns, and contribute to improvements through formal speaking up processes. They are confident that they will be treated with compassion and understanding, and will not be blamed, or treated negatively if they do so - including in relation to issues of racism and discrimination.$$
WHERE ref = $$WEL-WE-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and volunteers are actively encouraged to give feedback, raise concerns, and contribute to improvements through formal speaking up processes. They are confident that they will be treated with compassion and understanding, and will not be blamed, or treated negatively if they do so - including in relation to issues of racism and discrimination.$$
WHERE ref = $$WEL-WE-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-WE-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff wellbeing is promoted by providing personalised support, such as making reasonable adjustments, enabling flexible working, ensuring adequate rest, and providing a positive work environment. There is support if people are struggling at work.$$
WHERE ref = $$WEL-WE-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff wellbeing is promoted by providing personalised support, such as making reasonable adjustments, enabling flexible working, ensuring adequate rest, and providing a positive work environment. There is support if people are struggling at work.$$
WHERE ref = $$WEL-WE-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── WELL-LED ▸ Capable and compassionate leaders ─────────────

-- WEL-CL-01
UPDATE public.klo_checklist_items
SET checklist_item = $$Where required, there is a registered manager in post. They understand their responsibilities and are supported by the board, trustees or directors and other managers to deliver good, effective, high-quality care.$$
WHERE ref = $$WEL-CL-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Where required, there is a registered manager in post. They understand their responsibilities and are supported by the board, trustees or directors and other managers to deliver good, effective, high-quality care.$$
WHERE ref = $$WEL-CL-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-CL-02
UPDATE public.klo_checklist_items
SET checklist_item = $$High-quality leadership is sustained through safe, effective, and inclusive recruitment and succession planning.$$
WHERE ref = $$WEL-CL-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$High-quality leadership is sustained through safe, effective, and inclusive recruitment and succession planning.$$
WHERE ref = $$WEL-CL-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-CL-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders are knowledgeable about issues and priorities that affect the quality of the service and have access to appropriate development in their role. They seek support or independent scrutiny where required.$$
WHERE ref = $$WEL-CL-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders are knowledgeable about issues and priorities that affect the quality of the service and have access to appropriate development in their role. They seek support or independent scrutiny where required.$$
WHERE ref = $$WEL-CL-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── WELL-LED ▸ Governance and management ─────────────────────

-- WEL-GM-01
UPDATE public.klo_checklist_items
SET checklist_item = $$The service has an accurate statement of purpose that clearly reflects current service provision.$$
WHERE ref = $$WEL-GM-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service has an accurate statement of purpose that clearly reflects current service provision.$$
WHERE ref = $$WEL-GM-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-GM-02
UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective systems for monitoring and managing service performance, risk and learning from incidents that support innovation while maintaining the quality of care at the service.$$
WHERE ref = $$WEL-GM-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective systems for monitoring and managing service performance, risk and learning from incidents that support innovation while maintaining the quality of care at the service.$$
WHERE ref = $$WEL-GM-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-GM-03
UPDATE public.klo_checklist_items
SET checklist_item = $$There are secure and reliable arrangements for the availability, integrity and confidentiality of data, records and data management systems. Information is used effectively to monitor and improve the quality of care. Staff understand their responsibilities when collecting and sharing information.$$
WHERE ref = $$WEL-GM-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are secure and reliable arrangements for the availability, integrity and confidentiality of data, records and data management systems. Information is used effectively to monitor and improve the quality of care. Staff understand their responsibilities when collecting and sharing information.$$
WHERE ref = $$WEL-GM-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-GM-04
UPDATE public.klo_checklist_items
SET checklist_item = $$There are thorough business continuity plans in place for emergencies or natural disasters, such as adverse weather events, and staff know how to put these into practice.$$
WHERE ref = $$WEL-GM-04$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are thorough business continuity plans in place for emergencies or natural disasters, such as adverse weather events, and staff know how to put these into practice.$$
WHERE ref = $$WEL-GM-04$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-GM-05
UPDATE public.klo_checklist_items
SET checklist_item = $$Data or notifications are consistently submitted to external partners as required.$$
WHERE ref = $$WEL-GM-05$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Data or notifications are consistently submitted to external partners as required.$$
WHERE ref = $$WEL-GM-05$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── WELL-LED ▸ Partnerships and communities ───────────────────

-- WEL-PC-01
UPDATE public.klo_checklist_items
SET checklist_item = $$The service maintains positive relationships with the local community and works well with community partners.$$
WHERE ref = $$WEL-PC-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service maintains positive relationships with the local community and works well with community partners.$$
WHERE ref = $$WEL-PC-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-PC-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders work in partnership with people and other organisations, so that services work as seamlessly as possible for people.$$
WHERE ref = $$WEL-PC-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders work in partnership with people and other organisations, so that services work as seamlessly as possible for people.$$
WHERE ref = $$WEL-PC-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-PC-03
UPDATE public.klo_checklist_items
SET checklist_item = $$The service has strong external relationships and all staff including leaders engage early with people, communities, and partners to share learning with each other, which results in continuous improvements to the service.$$
WHERE ref = $$WEL-PC-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service has strong external relationships and all staff including leaders engage early with people, communities, and partners to share learning with each other, which results in continuous improvements to the service.$$
WHERE ref = $$WEL-PC-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- ── WELL-LED ▸ Improvement, innovation and learning ──────────

-- WEL-IL-01
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders understand how to drive improvement through consistent approaches that enable the right environment for improvement, measuring outcomes and impact.$$
WHERE ref = $$WEL-IL-01$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders understand how to drive improvement through consistent approaches that enable the right environment for improvement, measuring outcomes and impact.$$
WHERE ref = $$WEL-IL-01$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-IL-02
UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders foster a culture of trust by encouraging staff to speak up with ideas for improvement and innovation, and by actively investing time to listen and engage.$$
WHERE ref = $$WEL-IL-02$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders foster a culture of trust by encouraging staff to speak up with ideas for improvement and innovation, and by actively investing time to listen and engage.$$
WHERE ref = $$WEL-IL-02$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- WEL-IL-03
UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders engage with external work, including research, and embed evidence-based good practice in the service.$$
WHERE ref = $$WEL-IL-03$$ AND sub_service = $$Residential$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders engage with external work, including research, and embed evidence-based good practice in the service.$$
WHERE ref = $$WEL-IL-03$$ AND sub_service = $$Nursing$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);


-- ============================================================
-- PART 2 — DELETES
-- ============================================================

-- Delete all 12 DEM-prefixed Dementia sub-service items.
-- These were AI-written; no CQC Good-level source text exists.
DELETE FROM public.klo_checklist_items
WHERE ref LIKE $$DEM-%$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);

-- Delete the CAR-PC-04 Joint item (item_type = Dementia Care).
-- This is AI-written dementia-specific content with no CQC
-- Good-level source text.
DELETE FROM public.klo_checklist_items
WHERE ref = $$CAR-PC-04$$
  AND sub_service = $$Joint$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$);


-- ============================================================
-- PART 3 — INSERTS (56 statements: 28 gap items × 2 sub-services)
-- ============================================================
-- display_order values: SAF gaps start at 100, EFF at 50,
-- CAR at 50, RES at 50, WEL at 100 — all clear of existing items.
-- ============================================================

-- ── SAF-SC-06: Closed cultures ────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-SC-06$$,
  $$Staff and leaders understand what constitutes a closed culture and the risks to people, including organisational abuse; systems are in place to identify concerns and prevent closed cultures from developing.$$,
  NULL, 100, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-SC-06$$,
  $$Staff and leaders understand what constitutes a closed culture and the risks to people, including organisational abuse; systems are in place to identify concerns and prevent closed cultures from developing.$$,
  NULL, 101, $$Nursing$$
);

-- ── SAF-MR-05: Positive risk-taking ──────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Managing risks during care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MR-05$$,
  $$There is a balanced and proportionate approach to risk; people's rights and choices are respected and people are supported to take carefully managed risks to live fulfilling lives.$$,
  NULL, 102, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Managing risks during care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MR-05$$,
  $$There is a balanced and proportionate approach to risk; people's rights and choices are respected and people are supported to take carefully managed risks to live fulfilling lives.$$,
  NULL, 103, $$Nursing$$
);

-- ── SAF-MR-06: Restrictive practices ─────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Managing risks during care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MR-06$$,
  $$The service has a process to ensure restrictions on people's freedom, choice and control are necessary, proportionate and safe; restraint is only used as a last resort with a clear commitment to minimising restrictive interventions.$$,
  NULL, 104, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Managing risks during care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MR-06$$,
  $$The service has a process to ensure restrictions on people's freedom, choice and control are necessary, proportionate and safe; restraint is only used as a last resort with a clear commitment to minimising restrictive interventions.$$,
  NULL, 105, $$Nursing$$
);

-- ── SAF-MR-07: Deterioration recognition ─────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Managing risks during care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MR-07$$,
  $$Clinical deterioration is anticipated and managed using validated assessment tools, with a clear escalation process to reduce the potential for harm.$$,
  NULL, 106, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Managing risks during care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MR-07$$,
  $$Clinical deterioration is anticipated and managed using validated assessment tools, with a clear escalation process to reduce the potential for harm.$$,
  NULL, 107, $$Nursing$$
);

-- ── SAF-SG-04: Deprivation of Liberty Safeguards ─────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-SG-04$$,
  $$People are deprived of their liberty lawfully; any potential deprivation of liberty is recognised promptly and appropriate DoLS authorisation is sought; conditions are regularly reviewed and met.$$,
  NULL, 108, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-SG-04$$,
  $$People are deprived of their liberty lawfully; any potential deprivation of liberty is recognised promptly and appropriate DoLS authorisation is sought; conditions are regularly reviewed and met.$$,
  NULL, 109, $$Nursing$$
);

-- ── SAF-SG-05: Sexual safety ──────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-SG-05$$,
  $$People are empowered to develop and maintain safe intimate relationships, where they choose to, in accordance with their rights; staff are trained to support this appropriately.$$,
  NULL, 110, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-SG-05$$,
  $$People are empowered to develop and maintain safe intimate relationships, where they choose to, in accordance with their rights; staff are trained to support this appropriately.$$,
  NULL, 111, $$Nursing$$
);

-- ── SAF-SG-06: Online safety ──────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-SG-06$$,
  $$Online safety is considered and people are supported to understand how they can protect themselves when using the internet or digital devices.$$,
  NULL, 112, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-SG-06$$,
  $$Online safety is considered and people are supported to understand how they can protect themselves when using the internet or digital devices.$$,
  NULL, 113, $$Nursing$$
);

-- ── SAF-EI-06: Equipment alerts and recalls ───────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-EI-06$$,
  $$The service monitors and acts on equipment alerts, recalls and safety information in a timely way.$$,
  NULL, 114, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-EI-06$$,
  $$The service monitors and acts on equipment alerts, recalls and safety information in a timely way.$$,
  NULL, 115, $$Nursing$$
);

-- ── SAF-SS-05: Staff fatigue ──────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe staffing$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-SS-05$$,
  $$Actions are taken to protect staff from fatigue and leaders understand its impact on the safety of people who use services; working patterns are monitored.$$,
  NULL, 116, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe staffing$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-SS-05$$,
  $$Actions are taken to protect staff from fatigue and leaders understand its impact on the safety of people who use services; working patterns are monitored.$$,
  NULL, 117, $$Nursing$$
);

-- ── SAF-MT-05: STOMP/STAMP ────────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MT-05$$,
  $$The service actively considers opportunities to reduce the over-medication of people, in line with STOMP/STAMP principles where applicable.$$,
  NULL, 118, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MT-05$$,
  $$The service actively considers opportunities to reduce the over-medication of people, in line with STOMP/STAMP principles where applicable.$$,
  NULL, 119, $$Nursing$$
);

-- ── SAF-MT-06: PRN medicines protocols ───────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MT-06$$,
  $$The administration of PRN medicines (medicines taken when required) is guided by clear protocols; protocols are reviewed in a timely way.$$,
  NULL, 120, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MT-06$$,
  $$The administration of PRN medicines (medicines taken when required) is guided by clear protocols; protocols are reviewed in a timely way.$$,
  NULL, 121, $$Nursing$$
);

-- ── SAF-MT-07: Self-medication ────────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MT-07$$,
  $$People's capacity and preference for self-medication is assessed and clearly documented in care records; involvement in decisions about medicines is supported.$$,
  NULL, 122, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MT-07$$,
  $$People's capacity and preference for self-medication is assessed and clearly documented in care records; involvement in decisions about medicines is supported.$$,
  NULL, 123, $$Nursing$$
);

-- ── SAF-MT-08: Covert administration ─────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MT-08$$,
  $$Where covert administration of medicines is used, this is supported in line with the Mental Capacity Act 2005 and clearly documented with a best interests decision.$$,
  NULL, 124, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$SAF-MT-08$$,
  $$Where covert administration of medicines is used, this is supported in line with the Mental Capacity Act 2005 and clearly documented with a best interests decision.$$,
  NULL, 125, $$Nursing$$
);

-- ── EFF-AN-04: Trauma-informed approach ──────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Assessing needs$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$EFF-AN-04$$,
  $$Assessments focus on people's strengths and there is a trauma-informed approach to understanding people's needs.$$,
  NULL, 50, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Assessing needs$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$EFF-AN-04$$,
  $$Assessments focus on people's strengths and there is a trauma-informed approach to understanding people's needs.$$,
  NULL, 51, $$Nursing$$
);

-- ── EFF-EB-05: Equitable outcomes ────────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$EFF-EB-05$$,
  $$The service empowers people to understand their legal rights to equity of care; staff recognise barriers that prevent equity and resources are allocated to reduce these barriers and improve outcomes.$$,
  NULL, 52, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$EFF-EB-05$$,
  $$The service empowers people to understand their legal rights to equity of care; staff recognise barriers that prevent equity and resources are allocated to reduce these barriers and improve outcomes.$$,
  NULL, 53, $$Nursing$$
);

-- ── EFF-HL-04: Avoidable hospital admissions ─────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Supporting people to live healthier lives$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$EFF-HL-04$$,
  $$The service progresses advice and recommendations from other professionals or commissioners to prevent deterioration in health and wellbeing and avoidable hospital admissions.$$,
  NULL, 54, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Supporting people to live healthier lives$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$EFF-HL-04$$,
  $$The service progresses advice and recommendations from other professionals or commissioners to prevent deterioration in health and wellbeing and avoidable hospital admissions.$$,
  NULL, 55, $$Nursing$$
);

-- ── EFF-CT-04: Best interests decisions ──────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Consent to care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$EFF-CT-04$$,
  $$The service makes lawful decisions in people's best interests when required; people are involved and their feelings, beliefs and values are considered, with those close to them kept informed.$$,
  NULL, 56, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Consent to care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$EFF-CT-04$$,
  $$The service makes lawful decisions in people's best interests when required; people are involved and their feelings, beliefs and values are considered, with those close to them kept informed.$$,
  NULL, 57, $$Nursing$$
);

-- ── CAR-KD-04: Anticipating comfort needs ────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Kindness, compassion and dignity$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$CAR-KD-04$$,
  $$Staff prioritise and anticipate people's comfort and wellbeing needs, using appropriate tools and communication to avoid preventable discomfort, concern or distress.$$,
  NULL, 50, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Kindness, compassion and dignity$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$CAR-KD-04$$,
  $$Staff prioritise and anticipate people's comfort and wellbeing needs, using appropriate tools and communication to avoid preventable discomfort, concern or distress.$$,
  NULL, 51, $$Nursing$$
);

-- ── CAR-PC-03: Reasonable adjustments ────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Person-centred care$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$CAR-PC-03$$,
  $$People receive the most appropriate and personalised care as the service makes reasonable adjustments where necessary, including for communication, accessibility and cultural preferences.$$,
  NULL, 52, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Person-centred care$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$CAR-PC-03$$,
  $$People receive the most appropriate and personalised care as the service makes reasonable adjustments where necessary, including for communication, accessibility and cultural preferences.$$,
  NULL, 53, $$Nursing$$
);

-- ── CAR-IC-06: Intimate relationships ────────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$CAR-IC-06$$,
  $$People's right to a personal life is appropriately considered and respected, including supporting them to have close and intimate relationships where they choose.$$,
  NULL, 54, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$CAR-IC-06$$,
  $$People's right to a personal life is appropriately considered and respected, including supporting them to have close and intimate relationships where they choose.$$,
  NULL, 55, $$Nursing$$
);

-- ── CAR-IC-07: Equipment and technology for independence ──────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$CAR-IC-07$$,
  $$Equipment and technology are used to support and maximise people's independence; people are helped to make choices about adaptive equipment appropriate to their needs.$$,
  NULL, 56, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$CAR-IC-07$$,
  $$Equipment and technology are used to support and maximise people's independence; people are helped to make choices about adaptive equipment appropriate to their needs.$$,
  NULL, 57, $$Nursing$$
);

-- ── RES-LF-04: Ombudsman escalation pathway ──────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$RES-LF-04$$,
  $$At the end of the complaints process, people are given information on how to escalate their complaint to the relevant Ombudsman.$$,
  NULL, 50, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$RES-LF-04$$,
  $$At the end of the complaints process, people are given information on how to escalate their complaint to the relevant Ombudsman.$$,
  NULL, 51, $$Nursing$$
);

-- ── RES-LF-05: Advocacy for complaints ───────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$RES-LF-05$$,
  $$The service supports people to give their feedback or make a complaint, including supporting access to independent advocacy.$$,
  NULL, 52, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$RES-LF-05$$,
  $$The service supports people to give their feedback or make a complaint, including supporting access to independent advocacy.$$,
  NULL, 53, $$Nursing$$
);

-- ── WEL-SD-04: Co-production of vision and values ────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Strategic direction$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$WEL-SD-04$$,
  $$The vision, values and strategy have been developed through structured planning and co-production with people who use the service, staff and partners.$$,
  NULL, 100, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Strategic direction$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$WEL-SD-04$$,
  $$The vision, values and strategy have been developed through structured planning and co-production with people who use the service, staff and partners.$$,
  NULL, 101, $$Nursing$$
);

-- ── WEL-WE-04: Workforce inequality monitoring ───────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$WEL-WE-04$$,
  $$The service identifies workforce inequalities against equality, diversity and inclusion objectives; interventions to address these are monitored to evaluate their impact.$$,
  NULL, 102, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$WEL-WE-04$$,
  $$The service identifies workforce inequalities against equality, diversity and inclusion objectives; interventions to address these are monitored to evaluate their impact.$$,
  NULL, 103, $$Nursing$$
);

-- ── WEL-WE-05: Support for staff facing discrimination ───────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$WEL-WE-05$$,
  $$The service supports staff who face discrimination and takes action against those who discriminate, supported by clear policies and processes.$$,
  NULL, 104, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$WEL-WE-05$$,
  $$The service supports staff who face discrimination and takes action against those who discriminate, supported by clear policies and processes.$$,
  NULL, 105, $$Nursing$$
);

-- ── WEL-PC-04: Co-production in service design ───────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Partnerships and communities$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$WEL-PC-04$$,
  $$People who use the service are meaningfully involved in how it is designed, delivered and evaluated, including through co-production with residents and families.$$,
  NULL, 106, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Partnerships and communities$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$WEL-PC-04$$,
  $$People who use the service are meaningfully involved in how it is designed, delivered and evaluated, including through co-production with residents and families.$$,
  NULL, 107, $$Nursing$$
);

-- ── WEL-IL-04: Collective problem-solving ────────────────────
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Improvement, innovation and learning$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$WEL-IL-04$$,
  $$Leaders encourage collective problem-solving and innovation; staff at all levels are involved in identifying and addressing problems to achieve consistency in the quality of care.$$,
  NULL, 108, $$Residential$$
);
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Improvement, innovation and learning$$),
  (SELECT id FROM public.service_types WHERE name = $$Dual-Registered Care Home$$),
  $$Core$$, $$WEL-IL-04$$,
  $$Leaders encourage collective problem-solving and innovation; staff at all levels are involved in identifying and addressing problems to achieve consistency in the quality of care.$$,
  NULL, 109, $$Nursing$$
);
