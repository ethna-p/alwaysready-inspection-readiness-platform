-- Record zeeg_bookings.scheduled_at in migrations.
--
-- The column was added to the production database by hand (Demo Pipeline work,
-- 2026-09-19) and no migration file was ever written for it, so the preview
-- project never got it. On preview every insert into zeeg_bookings that names
-- scheduled_at fails, and addZeegBooking does not check the insert result, so
-- the failure was silent (found when e2e/superadmin-leads.spec.ts could not see
-- the booking it had just added).
--
-- IF NOT EXISTS makes this a no-op on production, where the column already exists.
-- lib/types.ts already has scheduled_at on zeeg_bookings, so no types change.

ALTER TABLE public.zeeg_bookings
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
