-- M16: Scope seven RLS policies to the authenticated role instead of PUBLIC.
--
-- These policies were created without a TO clause, so they applied to every
-- role including the unauthenticated anon role. They were never exploitable,
-- because every one of them compares against auth.uid() (NULL for anon, so no
-- row ever matches), but a policy that names its audience is safer: it no
-- longer relies on a NULL comparison to keep anonymous callers out, and it
-- matches how every other policy in this schema is written.
--
-- ALTER POLICY changes only the role list; the USING and WITH CHECK
-- expressions are untouched, so behaviour for logged-in users is identical.

ALTER POLICY "Admins can view their org notification log" ON public.notification_log TO authenticated;

ALTER POLICY "admins can delete sub_services"     ON public.organisation_sub_services TO authenticated;
ALTER POLICY "admins can insert sub_services"     ON public.organisation_sub_services TO authenticated;
ALTER POLICY "org members can read sub_services"  ON public.organisation_sub_services TO authenticated;

ALTER POLICY "Admins can read their org snapshots"   ON public.report_snapshots TO authenticated;
ALTER POLICY "Admins can update their org snapshots" ON public.report_snapshots TO authenticated;
ALTER POLICY "Admins can upsert their org snapshots" ON public.report_snapshots TO authenticated;
