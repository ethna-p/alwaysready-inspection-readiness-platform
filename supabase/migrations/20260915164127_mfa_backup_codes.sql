-- ── MFA backup codes ────────────────────────────────────────────────────────
--
-- Self-service recovery for a sole admin who loses their authenticator
-- device and has no other admin in their org to reset it for them (no
-- resetTeamMemberMfa target). 10 single-use codes are generated once,
-- alongside real TOTP enrolment (app/dashboard/account/mfa/setup/page.tsx)
-- and shown to the user exactly once — only a SHA-256 hash of each is ever
-- stored. Redeeming a valid, unused code (app/login/mfa/actions.ts's
-- redeemBackupCode) deletes the stuck TOTP factor and every remaining code
-- for that user, routing them through mandatory re-enrolment the same way
-- an admin- or superadmin-initiated MFA reset already does — no new
-- AAL-upgrade mechanism needed, this reuses that existing path.
--
-- Deliberately no RLS policies granted to `authenticated`: every read and
-- write goes through a 'use server' action on the service-role admin
-- client (the same pattern already used for every other MFA mutation in
-- this app), so the safest default is that the table is invisible to any
-- client-side query entirely, not merely restricted to "own rows" — a
-- backup-code hash is exactly the kind of row a same-user client query
-- should never be able to read back.

CREATE TABLE IF NOT EXISTS public.mfa_backup_codes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash  text NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mfa_backup_codes_user_idx ON public.mfa_backup_codes (user_id);

-- One row per distinct code hash. In the astronomically unlikely event two
-- generated codes collide, a UNIQUE violation on insert just means "generate
-- again" — never a silently-shared code between two accounts.
CREATE UNIQUE INDEX IF NOT EXISTS mfa_backup_codes_hash_idx ON public.mfa_backup_codes (code_hash);

ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only, by design (see comment above).
