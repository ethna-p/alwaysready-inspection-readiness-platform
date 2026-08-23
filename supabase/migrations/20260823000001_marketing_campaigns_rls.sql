-- Enable RLS on marketing campaign tables.
--
-- These tables are superadmin-only and are accessed exclusively via the
-- service-role admin client (createAdminClient), which bypasses RLS.
-- Enabling RLS with no policies means any direct query from an authenticated
-- user returns zero rows — defence-in-depth on top of the assertSuperadmin()
-- check on every server action.

alter table public.marketing_campaigns    enable row level security;
alter table public.campaign_contacts      enable row level security;
alter table public.marketing_suppressions enable row level security;
