-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: People's Voice module
-- Date: 2026-07-19
--
-- Adds two tables:
--   i_statements       — 19 authentic TLAP "I" statements published by CQC
--                        as part of the draft 2026 assessment framework.
--                        Read-only reference data; not editable by orgs.
--   i_statement_evidence — per-org evidence recorded against each statement.
--
-- Source: CQC draft assessment framework v9 (2026), TLAP "I" statements.
-- Only authentic TLAP statements are included. Two statements flagged as
-- non-authentic in the AlwaysReady reference CSV are excluded entirely.
-- Well-Led has no published "I" statements in the current draft.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Reference table: i_statements ─────────────────────────────────────────

CREATE TABLE public.i_statements (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_question     text        NOT NULL,
  statement_order  int         NOT NULL,
  statement_text   text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key_question, statement_order)
);

-- ── 2. Tenant table: i_statement_evidence ────────────────────────────────────

CREATE TABLE public.i_statement_evidence (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  i_statement_id   uuid        NOT NULL REFERENCES public.i_statements(id)  ON DELETE CASCADE,
  confidence       text        NOT NULL DEFAULT 'not_assessed'
                               CHECK (confidence IN ('green', 'amber', 'red', 'not_assessed')),
  evidence_summary text,
  action_needed    text,
  last_updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by       uuid        REFERENCES public.users(id),
  UNIQUE (organisation_id, i_statement_id)
);

CREATE INDEX i_statement_evidence_org_idx ON public.i_statement_evidence (organisation_id);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.i_statements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i_statement_evidence ENABLE ROW LEVEL SECURITY;

-- i_statements: readable by all authenticated users
CREATE POLICY "i_statements_select_authenticated"
  ON public.i_statements FOR SELECT TO authenticated USING (true);

-- i_statement_evidence: scoped to the user's organisation
CREATE POLICY "i_statement_evidence_select"
  ON public.i_statement_evidence FOR SELECT TO authenticated
  USING (organisation_id = get_user_org_id());

CREATE POLICY "i_statement_evidence_insert"
  ON public.i_statement_evidence FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
  );

CREATE POLICY "i_statement_evidence_update"
  ON public.i_statement_evidence FOR UPDATE TO authenticated
  USING  (organisation_id = get_user_org_id())
  WITH CHECK (
    organisation_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'user')
  );

-- ── 4. Seed: 19 authentic TLAP statements ────────────────────────────────────
-- Statement order preserved from the CQC draft framework.
-- Safe #4 and Responsive #3 are omitted (not authentic TLAP statements).

INSERT INTO public.i_statements (key_question, statement_order, statement_text) VALUES
  -- Safe (5 statements; #4 omitted)
  ('Safe', 1, 'I feel safe and am supported to understand and manage any risks.'),
  ('Safe', 2, 'I know what to do and who I can contact when I realise that things might be at risk of going wrong or my health condition may be worsening.'),
  ('Safe', 3, 'I can plan ahead and stay in control in emergencies. I know who to contact and how to contact them and people follow my advance wishes and decisions as much as possible.'),
  ('Safe', 5, 'When I move between services, settings or areas, there is a plan for what happens next and who will do what, and all the practical arrangements are in place.'),
  ('Safe', 6, 'I have considerate support delivered by competent people.'),

  -- Effective (4 statements)
  ('Effective', 1, 'I can get information and advice about my health, care and support and how I can be as well as possible – physically, mentally and emotionally.'),
  ('Effective', 2, 'I have care and support that is co-ordinated, and everyone works well together and with me.'),
  ('Effective', 3, 'I am supported by people who listen carefully, so they know what matters to me and how to support me to live the life I want.'),
  ('Effective', 4, 'I can live the life I want and do the things that are important to me as independently as possible.'),

  -- Caring (7 statements)
  ('Caring', 1, 'I am treated with respect and dignity.'),
  ('Caring', 2, 'I am supported to manage my health in a way that makes sense to me.'),
  ('Caring', 3, 'I am in control of planning my care and support. If I need help with this, people who know and care about me are involved.'),
  ('Caring', 4, 'I can keep in touch and meet up with people who are important to me, including family, friends and people who share my interests, identity and culture.'),
  ('Caring', 5, 'I can live the life I want and do the things that are important to me as independently as possible.'),
  ('Caring', 6, 'I am supported to plan ahead for important changes in life that I can anticipate.'),
  ('Caring', 7, 'I am supported to make decisions by people who see things from my point of view, with concern for what matters to me, my wellbeing and health.'),

  -- Responsive (3 statements; #3 omitted)
  ('Responsive', 1, 'I have care and support that is co-ordinated, and everyone works well together and with me.'),
  ('Responsive', 2, 'I can get information and advice that is accurate, up to date and provided in a way that I can understand.'),
  ('Responsive', 4, 'I can get information and advice that helps me think about and plan my life.');
