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
