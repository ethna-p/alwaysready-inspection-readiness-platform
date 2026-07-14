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


-- ─────────────────────────────────────────────

-- Migration 2: organisations table
-- One row per customer (or per demo session for shadow orgs).
-- is_demo + demo_expires_at support the per-session demo isolation
-- mechanism (Step 10 in the build order) — the flag costs nothing
-- now and avoids a schema change later.

CREATE TABLE public.organisations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  cqc_location_id   text,                          -- nullable: not all orgs will have one yet
  service_type_id   uuid        NOT NULL REFERENCES public.service_types(id),
  subscription_tier text        NOT NULL DEFAULT 'trial'
                    CHECK (subscription_tier IN ('trial', 'starter', 'pro')),
  is_demo           boolean     NOT NULL DEFAULT false,
  demo_expires_at   timestamptz,                   -- null for real orgs; set for shadow orgs
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- RLS
-- Users may only see their own organisation.
-- The helper function get_user_org_id() is defined in migration 4
-- (after public.users exists). RLS policies that reference it are
-- also in migration 4 to keep dependencies in order.
-- ─────────────────────────────────────────────
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- GRANT (required for new Supabase projects post-May 2026)
GRANT SELECT ON public.organisations TO authenticated;


-- ─────────────────────────────────────────────

-- Migration 3: public.users table
-- Extends Supabase's auth.users with app-level profile data.
-- id is a foreign key to auth.users — when an auth account is deleted,
-- the public.users row is deleted too (CASCADE).
--
-- There is intentionally NO trigger to auto-create this row on signup.
-- organisation_id is not available at signup time in a multi-tenant
-- invite model, so the row is created explicitly as part of the
-- invite / onboarding flow (or demo session setup for shadow orgs).

CREATE TABLE public.users (
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id uuid        NOT NULL REFERENCES public.organisations(id),
  email           text        NOT NULL,
  role            text        NOT NULL DEFAULT 'rcm'
                  CHECK (role IN ('admin', 'rcm')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index speeds up the RLS helper and every org-scoped query
CREATE INDEX users_organisation_id_idx ON public.users(organisation_id);

-- ─────────────────────────────────────────────
-- RLS
-- Policies are in migration 4 (after the helper function is defined).
-- ─────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- GRANTs (required for new Supabase projects post-May 2026)
-- authenticated users can SELECT and UPDATE their own row;
-- INSERT/DELETE are restricted to service-role (backend/invite flow only).
GRANT SELECT, UPDATE ON public.users TO authenticated;


-- ─────────────────────────────────────────────

-- Migration 4: RLS helper function + all org-scoped policies
-- This runs after both organisations and users tables exist.

-- ─────────────────────────────────────────────
-- Helper: get the current user's organisation_id
-- SECURITY DEFINER so it can read public.users even when the
-- caller's RLS policies haven't been evaluated yet (avoids
-- infinite recursion). STABLE because it won't change within
-- a single query.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id
  FROM   public.users
  WHERE  id = auth.uid()
  LIMIT  1
$$;

-- ─────────────────────────────────────────────
-- organisations policies
-- ─────────────────────────────────────────────
CREATE POLICY "Users can view their own organisation"
  ON public.organisations
  FOR SELECT
  TO authenticated
  USING (id = public.get_user_org_id());

-- ─────────────────────────────────────────────
-- users policies
-- ─────────────────────────────────────────────

-- Users can read all members of their own organisation
-- (useful for showing "who last updated" in audit trails)
CREATE POLICY "Users can view members of their organisation"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (organisation_id = public.get_user_org_id());

-- Users can update their own row only (e.g. email change in future)
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─────────────────────────────────────────────
-- Grant EXECUTE on the helper function to authenticated role
-- ─────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO authenticated;
