-- Seeds a cron_heartbeats row for the new storage-backup job (nightly Supabase
-- Storage -> Cloudflare R2 mirror, see lib/storage-backup.ts). Safe to run
-- immediately, on both projects, in any order relative to the code deploy: this
-- is a new job the current live code doesn't know about yet, so an extra row
-- existing early is simply ignored, unlike removing a row a job still expects.

INSERT INTO public.cron_heartbeats (job) VALUES ('storage-backup')
ON CONFLICT (job) DO NOTHING;
