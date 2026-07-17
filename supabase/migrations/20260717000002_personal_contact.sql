-- =============================================================
-- Personal contact details on users
-- =============================================================
-- Adds optional personal_email and mobile_number columns so staff
-- can receive notifications at a personal address / WhatsApp number.
--
-- personal_email  — used for password change notifications and
--                   future KLOE overdue alerts
-- mobile_number   — stored for future WhatsApp notifications via Twilio
-- =============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS personal_email TEXT,
  ADD COLUMN IF NOT EXISTS mobile_number  TEXT;
