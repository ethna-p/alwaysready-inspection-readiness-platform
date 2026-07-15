-- =============================================================
-- Step 13: Team management
-- =============================================================
--
-- Changes:
--   1. Add full_name to users — display name shown throughout the UI
--      and in the audit trail instead of the auth email address
--   2. Add username to users — the short login identifier handed to
--      staff (e.g. sarah.jones.f7a2e1). Unique across the platform.
--      Staff log in by entering their username; the login page appends
--      @staff.alwaysready.uk to resolve the Supabase auth email.
--   3. Update get_user_org_id and get_user_role grants (idempotent)
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. full_name — human-readable display name
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS full_name TEXT;


-- ─────────────────────────────────────────────────────────────
-- 2. username — staff login identifier
--    Unique, nullable (admin accounts may use a real email and
--    have no username; staff accounts always have one).
--    Format: firstname.lastname.{6-char org prefix}
--    e.g.  sarah.jones.f7a2e1
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique
  ON public.users (username)
  WHERE username IS NOT NULL;


-- ─────────────────────────────────────────────────────────────
-- 3. Allow authenticated users to read full_name and username
--    (needed for assignment dropdowns and audit trail display)
--    GRANT on the table was already issued in earlier migrations;
--    this is a no-op if already granted, safe to re-run.
-- ─────────────────────────────────────────────────────────────
GRANT SELECT ON public.users TO authenticated;
