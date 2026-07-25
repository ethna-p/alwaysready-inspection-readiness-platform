-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: klo_items corrections — issues identified in audit
--
-- 1. Workforce equity and culture (Well-Led) — rating_good
--    Missing final sentence: "This has a positive impact on the care they
--    deliver to people." (omitted by previous Claude session)
--
-- 2. Evidence-based care and equitable outcomes (Effective) — rating_good
--    Single quotation marks around 'good practice' omitted by previous session.
--
-- 3. Evidence-based care and equitable outcomes (Effective) — rating_ri
--    Four nutrition bullets were condensed/dropped. Restoring full CQC text.
--
-- Note: Two other partial matches (Consent to care and treatment; Timely and
-- equitable access) were correctly left as-is — the database fixes genuine
-- typos in the CQC source document and is more accurate than the raw text.
--
-- Source: CQC Draft Assessment Framework ASC v9 (verbatim)
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Workforce equity and culture — rating_good ────────────────────────────
-- Append missing final sentence to the last Good bullet.

UPDATE public.klo_items
SET rating_good = $$The service is committed to workforce equality, understands equity and proactively works to promote equality, diversity and inclusion. Wellbeing, inclusion, trust and open communication are embedded in the culture of the service. Leaders of the service set and review their performance against equality, diversity and inclusion objectives. Experiences of staff are listened to with compassion and effective action is taken to ensure continuous improvement and maximise staff equity, inclusion and wellbeing. Staff have access to personalised support that recognises the diversity of the workforce. Active efforts are made to avoid discrimination and unconscious bias. All staff have equitable opportunities, including fair access to development, progression and leadership opportunities. The service supports staff who face discrimination, whether from managers, colleagues, people using the service or those close to them. Action is taken against people who discriminate against staff, supported by policies and processes. Leaders make reasonable adjustments to support disabled staff to carry out their roles. The service identifies workforce inequalities against relevant equality, diversity and inclusion objectives. Interventions to address these are monitored to evaluate their impact. Leaders ensure there are effective and proactive ways to engage with and involve staff, with a focus on listening to the voices of staff who may experience discrimination based on their protected equality characteristics and those who may be excluded, marginalised or least heard from within their service. Staff and volunteers are actively encouraged to give feedback, raise concerns, and contribute to improvements through formal speaking up processes. They are confident that they will be treated with compassion and understanding, and will not be blamed, or treated negatively if they do so - including in relation to issues of racism and discrimination. Where necessary, leaders provide a timely and considered response. Staff wellbeing is promoted by providing personalised support, such as making reasonable adjustments, enabling flexible working, ensuring adequate rest, and providing a positive work environment. There is support if people are struggling at work. This has a positive impact on the care they deliver to people.$$
WHERE title = $$Workforce equity and culture$$;


-- ── 2. Evidence-based care and equitable outcomes — rating_good ──────────────
-- Restore single quotation marks around 'good practice' (CQC verbatim).

UPDATE public.klo_items
SET rating_good = $$People receive care, support and treatment aligned to recognised good practice standards. Staff and leaders understand the current legislation, standards and good practice relevant to their service and apply these effectively. They have good systems to ensure they keep up-to-date and embed this in their service. People understand how current 'good practice' is relevant to their outcomes, and they are involved in planning how this is reflected in their care, support and treatment. The service understands what people expect from their care and what good outcomes look like for them. These outcomes are regularly achieved. The service empowers people to understand their legal rights to equity of care and outcomes. Staff recognise barriers that prevent equity. Information is collected and acted on, and resources are allocated, to reduce these barriers and improve people's outcomes. There is a rigorous approach to monitoring the effectiveness of people's care, support and treatment and the service takes action to continuously improve it. Staff monitor and evaluate outcomes related to people's health and quality of life, including those linked to their aspirations and skill development, and act to improve them when possible. People's nutritional and hydration needs are met in line with current standards and good practice guidance. Where applicable, there is positive feedback from dietetic professionals that the service asks for their advice and applies it properly. People are supported to plan and manage their dietary needs and associated risks, including risks of poor nutrition, dehydration, swallowing problems and other medical conditions that affect their health. Staff are aware of individual preferences in relation to eating and drinking and there is flexibility when needed or requested. There are good quality food choices and these respect individual wishes, including those relating to sensory, cultural, religious and ethical preferences.$$
WHERE title = $$Evidence-based care and equitable outcomes$$;


-- ── 3. Evidence-based care and equitable outcomes — rating_ri ────────────────
-- Restore four nutrition bullets dropped by previous Claude session.

UPDATE public.klo_items
SET rating_ri = $$The service doesn't always recognise, understand or implement current relevant recognised good practice guidance, legislation and standards and it is not always reflected in people's care, support and treatment. The service doesn't routinely support people in understanding what good practice means for them and their outcomes. This can mean people have a limited understanding of the expected outcomes of their care. Not all people feel enabled to fully give their views or they feel that their rights are not respected in relation to their experience and outcomes of their care. This is particularly the case where people feel they are treated inequitably based on their protected equality characteristics. Staff and leaders do not have a good understanding of the people using their service who are most likely to experience discrimination and inequality in experience or outcomes. The service will miss opportunities or does not consistently take appropriate steps to promote and provide equitable experiences or outcomes for people. The service does not adequately monitor and evaluate the effectiveness of people's care, support and treatment consistently. Opportunities to improve care can be missed, or people do not have the best possible outcomes from their care. People's nutritional needs are not always met in line with relevant standards and good practice. People do not always have enough food or drink and it is not always nutritious or well presented. People's diets are not always balanced and do not always reflect individual needs and preferences. People are not always supported or involved in planning meals. People's cultural, ethical and religious needs in relation to food or drink are not well understood. The service does not sufficiently monitor or manage the risks associated with eating and drinking, including poor hydration and nutrition and swallowing difficulties.$$
WHERE title = $$Evidence-based care and equitable outcomes$$;
