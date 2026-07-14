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
