-- Migration 1: Static reference tables
-- key_questions (the 5 CQC key questions) and service_types (11 adult social care types)
-- These are seeded once and are not subscriber-editable.

-- ─────────────────────────────────────────────
-- key_questions
-- ─────────────────────────────────────────────
CREATE TABLE public.key_questions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL UNIQUE,
  display_order int         NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Seed: 5 CQC key questions in standard display order
INSERT INTO public.key_questions (name, display_order) VALUES
  ('Safe',       1),
  ('Effective',  2),
  ('Caring',     3),
  ('Responsive', 4),
  ('Well-led',   5);

-- ─────────────────────────────────────────────
-- service_types
-- ─────────────────────────────────────────────
CREATE TABLE public.service_types (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed: all 11 adult social care service types
INSERT INTO public.service_types (name) VALUES
  ('Residential Care Home'),
  ('Nursing Home'),
  ('Dual-Registered Care Home'),
  ('ARBD Specialist Care Home'),
  ('Homecare Agency'),
  ('Extra Care Housing'),
  ('Shared Lives Scheme'),
  ('Supported Living'),
  ('Specialist College'),
  ('Residential Rehabilitation Service'),
  ('Community Drug and Alcohol Service');

-- ─────────────────────────────────────────────
-- RLS + GRANTs
-- Reference tables are read-only for all authenticated users.
-- No RLS filtering needed (no org-scoped data here), but we
-- enable RLS with an open SELECT policy so the pattern is
-- consistent and these tables remain protected from writes
-- via the API.
-- ─────────────────────────────────────────────
ALTER TABLE public.key_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read key_questions"
  ON public.key_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read service_types"
  ON public.service_types FOR SELECT
  TO authenticated
  USING (true);

-- Explicit grants (required for new Supabase projects post-May 2026)
GRANT SELECT ON public.key_questions TO authenticated;
GRANT SELECT ON public.service_types TO authenticated;
