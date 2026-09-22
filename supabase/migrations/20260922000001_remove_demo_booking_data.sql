-- Removes the leftover demo-booking data now that the platform's demo-booking tools (the
-- inbound-demo and inbound-zeeg routes, the nightly cron/demo-reminder, and the Superadmin
-- Demo Pipeline) have been deleted from the app. Demo bookings are managed entirely in Zeeg
-- going forward, not through this platform.
--
-- Timing matters here. Run on preview as soon as this migration is committed, as usual --
-- nothing there is externally monitored. On PRODUCTION, run this only once the corresponding
-- code deploy is live, never before: the currently-live app still queries demo_leads and
-- zeeg_bookings on two Superadmin pages, and lib/cron-health.ts still lists 'demo-reminder' as
-- a job that must have a cron_heartbeats row -- dropping the tables early would break those
-- pages, and deleting the heartbeat row early would make /api/health report a false "job never
-- ran" failure and trigger a false down alert.

DELETE FROM public.cron_heartbeats WHERE job = 'demo-reminder';

DROP TABLE IF EXISTS public.demo_leads;
DROP TABLE IF EXISTS public.zeeg_bookings;
