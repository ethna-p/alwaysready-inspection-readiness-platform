-- Add marketing_opt_out column to users table
-- Controls whether non-transactional emails (trial tips, onboarding sequence) are sent
-- Transactional emails (billing, security, account notices) are never gated by this flag

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS marketing_opt_out boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.marketing_opt_out IS
  'When true, the user has unsubscribed from non-transactional emails (trial tips, onboarding sequence). Transactional emails (billing, security) are always sent regardless of this flag.';
