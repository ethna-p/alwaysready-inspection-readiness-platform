-- ============================================================
-- Migration: 20260724000001_nursing_home_checklist_cqc_language.sql
-- ============================================================
-- Purpose
-- -------
-- Replaces all 84 Nursing Home Core checklist items with exact
-- CQC Good-level wording drawn from the CQC Draft Assessment
-- Framework ASC v9.  Every previous item paraphrased the CQC
-- framework to some degree; this migration adopts verbatim
-- (or minimally-adapted composite) CQC language throughout.
--
-- Source document
-- ---------------
-- REFERENCE/nursing_home_checklist_review_v2.md
-- "Nursing Home Checklist Cross-Reference Review v2 — CQC Exact
--  Language Audit"  (all 84 items flagged as Revise)
--
-- Scope
-- -----
-- 1. UPDATE checklist_item for all 84 existing Nursing Home Core
--    items (matched by ref + service_type_id).  evidence_notes
--    are not touched -- they were selectively corrected in the
--    20260719000001 migration.
-- 2. INSERT 33 new items covering CQC Good-level characteristics
--    that had no corresponding checklist item (Gaps section).
--
-- Dollar-quoting is used throughout; no single-quote string
-- literals appear anywhere in this file.
-- ============================================================

-- ============================================================
-- PART 1 -- UPDATES (84 existing items)
-- ============================================================

-- --- SAF-SC -- Safety Culture ---------------------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$All incidents are recorded, investigated, and the service looks for safety-related themes and trends to drive improvement.$$
WHERE ref = $$SAF-SC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a good understanding of the duty of candour; staff are open and transparent with people and those close to them when incidents occur.$$
WHERE ref = $$SAF-SC-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Patient safety alerts are consistently reviewed and acted on, and learning from external safety incidents is embedded in the delivery of care.$$
WHERE ref = $$SAF-SC-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Complaints, concerns and other feedback about safety are welcomed and prioritised as key sources to identify and manage safety risks.$$
WHERE ref = $$SAF-SC-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a strong learning culture in which incidents that have caused harm, or could cause harm, are treated as opportunities to improve.$$
WHERE ref = $$SAF-SC-05$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- SAF-MR -- Managing Risks During Care and Treatment -------

UPDATE public.klo_checklist_items
SET checklist_item = $$Care plans reflect foreseeable risks including pressure ulcer risk; clinical risks are anticipated and managed to reduce the potential for harm, in line with recognised good practice.$$
WHERE ref = $$SAF-MR-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Care plans reflect moving and handling risks; care is provided in line with recognised good practice guidance, using appropriate specialist equipment.$$
WHERE ref = $$SAF-MR-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Falls risk is reflected in care plans; deterioration and emergencies are anticipated and managed to reduce the potential for harm, including prompt post-fall review.$$
WHERE ref = $$SAF-MR-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Choking and dysphagia risks are identified and care is provided in line with recognised good practice guidance, including appropriate specialist referral, to protect residents from avoidable harm.$$
WHERE ref = $$SAF-MR-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- SAF-SP -- Safe Systems, Pathways and Transitions ---------

UPDATE public.klo_checklist_items
SET checklist_item = $$Plans and information for care are established and shared before people move into the service, considering individual needs, circumstances and expected outcomes.$$
WHERE ref = $$SAF-SP-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Plans and information for care during transitions are established and shared before people move between services to ensure continuity and a smooth process.$$
WHERE ref = $$SAF-SP-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff work proactively with teams in other services to deliver co-ordinated, timely and person-centred care; actions are appropriately owned and followed up.$$
WHERE ref = $$SAF-SP-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Shared systems and processes for safe care, including handover, are managed collaboratively, with proactive risk identification, monitoring and learning.$$
WHERE ref = $$SAF-SP-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- SAF-SG -- Safeguarding -----------------------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective safeguarding systems, processes and practices, accessible to people, staff and visitors to the service, operating in line with legislation and guidance.$$
WHERE ref = $$SAF-SG-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Safeguarding systems are managed by appropriately trained staff; training is appropriate to role, refreshed at regular intervals, with competency assessed.$$
WHERE ref = $$SAF-SG-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Information about people who have suffered harm or are at risk is shared with the local authority in a timely way; staff use appropriate escalation pathways when concerns are not addressed.$$
WHERE ref = $$SAF-SG-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- SAF-EI -- Safe Environments and IPC ---------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$Fire safety procedures are effective; Personal Emergency Evacuation Plans are in place and reflect the individual clinical and mobility needs of all residents.$$
WHERE ref = $$SAF-EI-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a comprehensive system to proactively manage the safety and upkeep of the premises; professionally qualified and competent people complete all required environmental checks and maintenance.$$
WHERE ref = $$SAF-EI-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service manages the control and prevention of infection well; infection prevention and control roles are clear and the risk of infection is minimised because premises and equipment are kept clean and hygienic.$$
WHERE ref = $$SAF-EI-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Equipment, including special or adaptive equipment, is maintained, stored and used in line with good practice and guidance; the service monitors and acts on equipment alerts, recalls and safety information.$$
WHERE ref = $$SAF-EI-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The environment and clinical waste arrangements meet current legislation and good practice guidance; the service is kept clean and hygienic to minimise the risk of infection.$$
WHERE ref = $$SAF-EI-05$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- SAF-SS -- Safe Staffing ---------------------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$There are appropriate staffing levels and skill mix, including registered nurse cover on every shift, to meet people's needs; contingency arrangements are in place for staff absence.$$
WHERE ref = $$SAF-SS-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are processes to support professional revalidation where needed; NMC registration and revalidation dates are verified and tracked for all registered nurses.$$
WHERE ref = $$SAF-SS-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Thorough and safe recruitment practices are in place, including DBS checks and references, ensuring staff and volunteers are suitably experienced, qualified and competent.$$
WHERE ref = $$SAF-SS-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are supervision and appraisal processes to support nursing staff to develop and improve services; competency is assessed to maintain knowledge and skills in line with good practice.$$
WHERE ref = $$SAF-SS-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- SAF-MT -- Safe Medicines and Treatments -----------------

UPDATE public.klo_checklist_items
SET checklist_item = $$Medicines are ordered, administered, recorded, stored and disposed of safely in line with legislation and guidance; medication records are audited regularly for accuracy and gaps.$$
WHERE ref = $$SAF-MT-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Controlled drugs are stored, recorded, administered and disposed of in line with legislation and guidance, with dual sign-off on all controlled drug transactions.$$
WHERE ref = $$SAF-MT-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a clear approach to the safe use of medicines; roles and responsibilities for advanced administration, including syringe drivers and IV medicines, are understood and staff hold current competency.$$
WHERE ref = $$SAF-MT-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Medicines are stored safely in line with legislation and guidance, including temperature-controlled storage; storage checks are completed and recorded regularly.$$
WHERE ref = $$SAF-MT-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- EFF-AN -- Assessing Needs --------------------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$People's needs are comprehensively assessed, reflecting their wishes and physical, mental, emotional, sensory, social and communication needs, including those related to protected equality characteristics.$$
WHERE ref = $$EFF-AN-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Assessments and care plans are regularly reviewed and updated to make sure staff have current information, so that care is meeting people's needs and individual outcomes as expected.$$
WHERE ref = $$EFF-AN-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People's communication needs are assessed and met to maximise the effectiveness of care, support and treatment, in line with the Accessible Information Standard.$$
WHERE ref = $$EFF-AN-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- EFF-EB -- Evidence-Based Care and Equitable Outcomes -----

UPDATE public.klo_checklist_items
SET checklist_item = $$People's nutritional and hydration needs are met in line with current standards and good practice guidance; dietary risks including poor nutrition, dehydration and swallowing problems are identified and managed.$$
WHERE ref = $$EFF-EB-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff monitor and evaluate outcomes related to people's health, including clinical markers, and act to improve them where possible.$$
WHERE ref = $$EFF-EB-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment; the service takes action to continuously improve it, evidenced by a clinical audit programme with documented improvements.$$
WHERE ref = $$EFF-EB-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff monitor and evaluate outcomes related to people's health and quality of life over time, using outcome data to act and improve care where possible.$$
WHERE ref = $$EFF-EB-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- EFF-HL -- Supporting People to Live Healthier Lives ------

UPDATE public.klo_checklist_items
SET checklist_item = $$The service works with residents and professionals to plan and enable access to health and social care support; residents are supported to access health checks and healthcare passports are completed where appropriate.$$
WHERE ref = $$EFF-HL-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Risks to residents' health and wellbeing are identified and support to prevent deterioration is prioritised, including progressing advice from other professionals to prevent avoidable hospital admissions.$$
WHERE ref = $$EFF-HL-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Residents are encouraged and supported to make healthier choices relating to diet, lifestyle and physical activity, including through activity and rehabilitation opportunities where clinically appropriate.$$
WHERE ref = $$EFF-HL-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- EFF-CT -- Consent to Care and Treatment -----------------

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff know the importance of consent and ensure people understand what they are consenting to before care or treatment is delivered, with appropriate information and time given to support informed decisions.$$
WHERE ref = $$EFF-CT-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff actively consider whether people have the mental capacity to give consent; where there is reason to doubt capacity, assessments are completed in line with the Mental Capacity Act 2005, recorded, and DoLS applied where appropriate.$$
WHERE ref = $$EFF-CT-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to access independent advocacy, including statutory or non-statutory when available, and advocates are appropriately involved by the service.$$
WHERE ref = $$EFF-CT-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- CAR-KD -- Kindness, Compassion and Dignity ---------------

UPDATE public.klo_checklist_items
SET checklist_item = $$People feel cared for with kindness, compassion, dignity and respect; privacy and dignity are consistently upheld during all clinical procedures and personal care, and any shortfalls are challenged.$$
WHERE ref = $$CAR-KD-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People's privacy and confidentiality are consistently upheld; staff have a clear understanding of the boundaries of confidentiality and work within these.$$
WHERE ref = $$CAR-KD-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff promptly respond to people's emotions, discomfort, distress and urgent needs in a positive way that protects their rights and dignity; staff learn the causes of distress to prevent recurrence.$$
WHERE ref = $$CAR-KD-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- CAR-PC -- Person-Centred Care ---------------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$Care is tailored to the individual and is not task-focused; nursing care plans are person-centred and regularly updated with the involvement of residents and those close to them.$$
WHERE ref = $$CAR-PC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff treat people as individuals, ensuring their personal, cultural, social, spiritual and religious needs are understood and met, with due regard for protected equality characteristics.$$
WHERE ref = $$CAR-PC-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- CAR-IC -- Independence, Choice and Control ---------------

UPDATE public.klo_checklist_items
SET checklist_item = $$Residents are encouraged and enabled to access meaningful activities, hobbies and interests in a personalised way, with genuine choices offered and adaptations made for clinical or mobility needs.$$
WHERE ref = $$CAR-IC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to maintain access to family, friends and cultural connections; when applicable, visiting restrictions are limited to exceptional circumstances in accordance with guidance and legislation.$$
WHERE ref = $$CAR-IC-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to make decisions about end of life preferences and advance decisions if they wish to; DNACPR and ReSPECT decisions are clearly recorded and accessible to clinical staff.$$
WHERE ref = $$CAR-IC-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People approaching the end of their life are identified and their needs are met in line with their preferences and choices; there is a compassionate and supportive approach before and after a person dies.$$
WHERE ref = $$CAR-IC-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People are supported to plan for the future and make advance decisions if they wish to; where people do not wish to discuss end of life, steps are taken to establish what to do in an emergency.$$
WHERE ref = $$CAR-IC-05$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- RES-CC -- Care Provision, Integration and Continuity -----

UPDATE public.klo_checklist_items
SET checklist_item = $$Where support is provided by more than one service, staff work in a planned, coordinated and flexible way to make sure care is joined up and meets residents' needs.$$
WHERE ref = $$RES-CC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People experience continuity of care, support and treatment; a key worker or named nurse system ensures residents have a consistent point of contact throughout their stay.$$
WHERE ref = $$RES-CC-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Internal transitions in care level are planned collaboratively with residents and those close to them; people experience continuity of care and a smooth process throughout.$$
WHERE ref = $$RES-CC-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- RES-LF -- Listening to and Responding to Feedback --------

UPDATE public.klo_checklist_items
SET checklist_item = $$People and those close to them understand how to give feedback, make suggestions or complain about care and treatment; they can do so in a way that meets their needs, including with access to independent advocacy.$$
WHERE ref = $$RES-LF-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service welcomes feedback, concerns and complaints as an opportunity to improve; learning from feedback is incorporated into practice and people feel confident their concerns will be taken seriously.$$
WHERE ref = $$RES-LF-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The service actively seeks feedback and keeps people informed about how it has been addressed and any action taken; people are given information on how to escalate complaints to the relevant Ombudsman.$$
WHERE ref = $$RES-LF-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- RES-TA -- Timely and Equitable Access --------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$The service is designed to be accessible and available at the point of need; barriers that prevent equitable access to the admission process are identified and removed.$$
WHERE ref = $$RES-TA-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Reasonable adjustments are understood and made to ensure equal access to the service for all; premises are accessible and adapted to meet the needs of people who find it hard to access services.$$
WHERE ref = $$RES-TA-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$People's individual communication and information needs are appropriately identified and up-to-date information is routinely provided in an accessible way.$$
WHERE ref = $$RES-TA-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- RES-EE -- Equity in Experiences -------------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders and staff work collaboratively to achieve equity by recognising barriers, collecting and acting on evidence including people's experiences, and allocating resources to reduce barriers.$$
WHERE ref = $$RES-EE-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Interpreting and translation are provided or accessed for people who don't speak English as a first language and for people who use British Sign Language.$$
WHERE ref = $$RES-EE-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff are supported to develop the skills they need to remove barriers to effective communication; where applicable, the requirements of the Accessible Information Standard are met.$$
WHERE ref = $$RES-EE-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- WEL-SD -- Strategic Direction ---------------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$The values of the service are clear, understood and supported by staff, demonstrated through the behaviour of leaders and in day-to-day practices within the service.$$
WHERE ref = $$WEL-SD-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders learn from staff who work directly with people; feedback is valued and used to track progress, shape priorities and drive improvements.$$
WHERE ref = $$WEL-SD-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$The strategy supports the stability and operational sustainability of the service; succession planning ensures high-quality leadership is sustained.$$
WHERE ref = $$WEL-SD-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- WEL-WE -- Workforce Equity and Culture -------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$The service is committed to workforce equality and proactively works to promote equality, diversity and inclusion, applied to recruitment, development and progression.$$
WHERE ref = $$WEL-WE-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff are actively encouraged to raise concerns through formal speaking up processes and are confident they will be treated with compassion and will not be blamed or treated negatively for doing so.$$
WHERE ref = $$WEL-WE-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff wellbeing is promoted through personalised support, including reasonable adjustments, flexible working and ensuring adequate rest; there is support when staff are struggling at work.$$
WHERE ref = $$WEL-WE-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- WEL-CL -- Capable and Compassionate Leaders --------------

UPDATE public.klo_checklist_items
SET checklist_item = $$Where required, there is a registered manager in post who understands their responsibilities and is supported by directors and other managers to deliver good, effective, high-quality care.$$
WHERE ref = $$WEL-CL-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$High-quality leadership is sustained through safe and effective recruitment; Fit and Proper Person Requirement checks are completed for the registered manager and all directors.$$
WHERE ref = $$WEL-CL-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Leaders are knowledgeable about priorities that affect quality and have access to appropriate development in their role; they seek support or independent scrutiny where required.$$
WHERE ref = $$WEL-CL-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- WEL-GM -- Governance and Management ----------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$The service has an accurate statement of purpose that clearly reflects current service provision, including the nursing care it provides.$$
WHERE ref = $$WEL-GM-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are effective systems for monitoring and managing service performance, risk and learning from incidents, including a quality assurance audit programme across all key care areas.$$
WHERE ref = $$WEL-GM-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are secure and reliable arrangements for the availability, integrity and confidentiality of data and records; the Data Security and Protection Toolkit is submitted and cyber security arrangements are reviewed.$$
WHERE ref = $$WEL-GM-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$There are thorough business continuity plans in place for emergencies, and staff know how to put these into practice, including continuity of medicines supply and nurse staffing.$$
WHERE ref = $$WEL-GM-04$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Data and notifications are consistently submitted to external partners as required; regulatory requirements are understood and consistently met.$$
WHERE ref = $$WEL-GM-05$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- WEL-PC -- Partnerships and Communities -------------------

UPDATE public.klo_checklist_items
SET checklist_item = $$The service maintains positive relationships with the local community and works well with community partners.$$
WHERE ref = $$WEL-PC-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders work in partnership with other organisations, including local health services, so that care works as seamlessly as possible for people.$$
WHERE ref = $$WEL-PC-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders engage with people, communities and partners to share learning with each other, which results in continuous improvements to the service.$$
WHERE ref = $$WEL-PC-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

-- --- WEL-IL -- Improvement, Innovation and Learning -----------

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders drive improvement through consistent approaches that enable the right environment for improvement, measuring outcomes and impact; quality improvement projects demonstrate measurable results.$$
WHERE ref = $$WEL-IL-01$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff are consistently encouraged to contribute to improvement and innovation initiatives; leaders foster a culture of trust by actively investing time to listen to ideas for improvement.$$
WHERE ref = $$WEL-IL-02$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);

UPDATE public.klo_checklist_items
SET checklist_item = $$Staff and leaders engage with external work, including research, and embed evidence-based good practice in the service.$$
WHERE ref = $$WEL-IL-03$$
  AND service_type_id = (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$);


-- ============================================================
-- PART 2 -- INSERTS (33 new gap items)
-- ============================================================
-- display_order values continue after the current maximum for
-- each key question area:
--   SAF existing max = 29  -> new items start at 30
--   EFF existing max = 13  -> new items start at 14
--   CAR existing max = 10  -> new items start at 11
--   RES existing max = 12  -> new items start at 13
--   WEL existing max = 20  -> new items start at 21
-- ============================================================

-- --- SAF-SC -- Safety Culture --------------------------------

-- SAF-SC-06: Closed cultures
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safety culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SC-06$$,
  $$Staff and leaders understand what constitutes a closed culture and the risks to people, including organisational abuse; systems are in place to identify concerns and prevent closed cultures from developing.$$,
  NULL,
  30,
  NULL
);

-- --- SAF-MR -- Managing Risks During Care and Treatment ------

-- SAF-MR-05: Positive risk-taking
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Managing risks during care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MR-05$$,
  $$There is a balanced and proportionate approach to risk; people's rights and choices are respected and people are supported to take carefully managed risks to live fulfilling lives.$$,
  NULL,
  31,
  NULL
);

-- SAF-MR-06: Restrictive practices
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Managing risks during care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MR-06$$,
  $$The service has a process to ensure restrictions on people's freedom, choice and control are necessary, proportionate and safe; restraint is only used as a last resort with a clear commitment to minimising restrictive interventions.$$,
  NULL,
  32,
  NULL
);

-- SAF-MR-07: Deterioration recognition
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Managing risks during care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MR-07$$,
  $$Clinical deterioration is anticipated and managed using validated assessment tools, with a clear escalation process to reduce the potential for harm.$$,
  NULL,
  33,
  NULL
);

-- --- SAF-SG -- Safeguarding ----------------------------------

-- SAF-SG-04: Deprivation of Liberty Safeguards
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SG-04$$,
  $$People are deprived of their liberty lawfully; any potential deprivation of liberty is recognised promptly and appropriate DoLS authorisation is sought; conditions are regularly reviewed and met.$$,
  NULL,
  34,
  NULL
);

-- SAF-SG-05: Sexual safety
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SG-05$$,
  $$People are empowered to develop and maintain safe intimate relationships, where they choose to, in accordance with their rights; staff are trained to support this appropriately.$$,
  NULL,
  35,
  NULL
);

-- SAF-SG-06: Online safety
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safeguarding$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SG-06$$,
  $$Online safety is considered and people are supported to understand how they can protect themselves when using the internet or digital devices.$$,
  NULL,
  36,
  NULL
);

-- --- SAF-EI -- Safe Environments and IPC ---------------------

-- SAF-EI-06: Equipment alerts and recalls
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-EI-06$$,
  $$The service monitors and acts on equipment alerts, recalls and safety information in a timely way.$$,
  NULL,
  37,
  NULL
);

-- SAF-EI-07: Digital and technology assurance
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe environments and infection prevention and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-EI-07$$,
  $$Digital systems and technology used to deliver care are secure, reliable and appropriate to individual people's needs; data records are available, accurate and confidential.$$,
  NULL,
  38,
  NULL
);

-- --- SAF-SS -- Safe Staffing ---------------------------------

-- SAF-SS-05: Staff fatigue
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe staffing$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SS-05$$,
  $$Actions are taken to protect staff from fatigue and leaders understand its impact on the safety of people who use services; working patterns are monitored.$$,
  NULL,
  39,
  NULL
);

-- SAF-SS-06: Allegations against people in positions of trust
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe staffing$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-SS-06$$,
  $$The service has systems for investigating allegations against people in positions of trust; actions are taken to address any risk to people using the service.$$,
  NULL,
  40,
  NULL
);

-- --- SAF-MT -- Safe Medicines and Treatments -----------------

-- SAF-MT-05: STOMP/STAMP
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MT-05$$,
  $$The service actively considers opportunities to reduce the over-medication of people, in line with STOMP/STAMP principles where applicable.$$,
  NULL,
  41,
  NULL
);

-- SAF-MT-06: PRN medicines protocols
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MT-06$$,
  $$The administration of PRN medicines (medicines taken when required) is guided by clear protocols; protocols are reviewed in a timely way.$$,
  NULL,
  42,
  NULL
);

-- SAF-MT-07: Self-medication
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MT-07$$,
  $$People's capacity and preference for self-medication is assessed and clearly documented in care records; involvement in decisions about medicines is supported.$$,
  NULL,
  43,
  NULL
);

-- SAF-MT-08: Covert administration
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Safe medicines and treatments$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$SAF-MT-08$$,
  $$Where covert administration of medicines is used, this is supported in line with the Mental Capacity Act 2005 and clearly documented with a best interests decision.$$,
  NULL,
  44,
  NULL
);

-- --- EFF-AN -- Assessing Needs --------------------------------

-- EFF-AN-04: Trauma-informed approach
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Assessing needs$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-AN-04$$,
  $$Assessments focus on people's strengths and there is a trauma-informed approach to understanding people's needs.$$,
  NULL,
  14,
  NULL
);

-- --- EFF-EB -- Evidence-Based Care and Equitable Outcomes -----

-- EFF-EB-05: Equitable outcomes
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Evidence-based care and equitable outcomes$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-EB-05$$,
  $$The service empowers people to understand their legal rights to equity of care; staff recognise barriers that prevent equity and resources are allocated to reduce these barriers and improve outcomes.$$,
  NULL,
  15,
  NULL
);

-- --- EFF-HL -- Supporting People to Live Healthier Lives ------

-- EFF-HL-04: Avoidable hospital admissions
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Supporting people to live healthier lives$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-HL-04$$,
  $$The service progresses advice and recommendations from other professionals or commissioners to prevent deterioration in health and wellbeing and avoidable hospital admissions.$$,
  NULL,
  16,
  NULL
);

-- --- EFF-CT -- Consent to Care and Treatment -----------------

-- EFF-CT-04: Best interests decisions
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Consent to care and treatment$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$EFF-CT-04$$,
  $$The service makes lawful decisions in people's best interests when required; people are involved and their feelings, beliefs and values are considered, with those close to them kept informed.$$,
  NULL,
  17,
  NULL
);

-- --- CAR-KD -- Kindness, Compassion and Dignity ---------------

-- CAR-KD-04: Anticipating comfort needs
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Kindness, compassion and dignity$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-KD-04$$,
  $$Staff prioritise and anticipate people's comfort and wellbeing needs, using appropriate tools and communication to avoid preventable discomfort, concern or distress.$$,
  NULL,
  11,
  NULL
);

-- --- CAR-PC -- Person-Centred Care ---------------------------

-- CAR-PC-03: Reasonable adjustments for care delivery
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Person-centred care$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-PC-03$$,
  $$People receive the most appropriate and personalised care as the service makes reasonable adjustments where necessary, including for communication, accessibility and cultural preferences.$$,
  NULL,
  12,
  NULL
);

-- --- CAR-IC -- Independence, Choice and Control ---------------

-- CAR-IC-06: Intimate relationships
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-IC-06$$,
  $$People's right to a personal life is appropriately considered and respected, including supporting them to have close and intimate relationships where they choose.$$,
  NULL,
  13,
  NULL
);

-- CAR-IC-07: Equipment and technology for independence
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Independence, choice and control$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$CAR-IC-07$$,
  $$Equipment and technology are used to support and maximise people's independence; people are helped to make choices about adaptive equipment appropriate to their needs.$$,
  NULL,
  14,
  NULL
);

-- --- RES-LF -- Listening to and Responding to Feedback --------

-- RES-LF-04: Ombudsman escalation pathway
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-LF-04$$,
  $$At the end of the complaints process, people are given information on how to escalate their complaint to the relevant Ombudsman.$$,
  NULL,
  13,
  NULL
);

-- RES-LF-05: Advocacy for complaints
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Listening to and responding to feedback$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$RES-LF-05$$,
  $$The service supports people to give their feedback or make a complaint, including supporting access to independent advocacy.$$,
  NULL,
  14,
  NULL
);

-- --- WEL-SD -- Strategic Direction ---------------------------

-- WEL-SD-04: Co-production of vision and values
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Strategic direction$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-SD-04$$,
  $$The vision, values and strategy have been developed through structured planning and co-production with people who use the service, staff and partners.$$,
  NULL,
  21,
  NULL
);

-- --- WEL-WE -- Workforce Equity and Culture -------------------

-- WEL-WE-04: Workforce inequality monitoring
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-WE-04$$,
  $$The service identifies workforce inequalities against equality, diversity and inclusion objectives; interventions to address these are monitored to evaluate their impact.$$,
  NULL,
  22,
  NULL
);

-- WEL-WE-05: Support for staff facing discrimination
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Workforce equity and culture$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-WE-05$$,
  $$The service supports staff who face discrimination and takes action against those who discriminate, supported by clear policies and processes.$$,
  NULL,
  23,
  NULL
);

-- --- WEL-CL -- Capable and Compassionate Leaders --------------

-- WEL-CL-04: Sincere and timely apology
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Capable and compassionate leaders$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-CL-04$$,
  $$When something goes wrong, people receive a sincere and timely apology and are told about the actions being taken to prevent the same thing happening again.$$,
  NULL,
  24,
  NULL
);

-- --- WEL-GM -- Governance and Management ----------------------

-- WEL-GM-06: Workforce planning
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Governance and management$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-GM-06$$,
  $$There are effective workforce planning arrangements to ensure appropriate staffing levels, skill mix and succession; risks to staffing capacity are identified and managed.$$,
  NULL,
  25,
  NULL
);

-- WEL-GM-07: Records management and GDPR
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Governance and management$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-GM-07$$,
  $$Records and data management systems meet data protection and GDPR requirements; records are complete, accurate, stored securely and staff understand their data protection responsibilities.$$,
  NULL,
  26,
  NULL
);

-- --- WEL-PC -- Partnerships and Communities -------------------

-- WEL-PC-04: Co-production in service design
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Partnerships and communities$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-PC-04$$,
  $$People who use the service are meaningfully involved in how it is designed, delivered and evaluated, including through co-production with residents and families.$$,
  NULL,
  27,
  NULL
);

-- --- WEL-IL -- Improvement, Innovation and Learning -----------

-- WEL-IL-04: Collective problem-solving
INSERT INTO public.klo_checklist_items
  (klo_item_id, service_type_id, item_type, ref, checklist_item, evidence_notes, display_order, sub_service)
VALUES (
  (SELECT id FROM public.klo_items WHERE title = $$Improvement, innovation and learning$$),
  (SELECT id FROM public.service_types WHERE name = $$Nursing Home$$),
  $$Core$$,
  $$WEL-IL-04$$,
  $$Leaders encourage collective problem-solving and innovation; staff at all levels are involved in identifying and addressing problems to achieve consistency in the quality of care.$$,
  NULL,
  28,
  NULL
);
