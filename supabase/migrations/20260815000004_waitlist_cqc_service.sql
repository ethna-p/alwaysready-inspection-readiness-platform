-- Add CQC location fields and service_type to waitlist_leads
-- Mirrors the CQC columns already on the organisations table.

alter table waitlist_leads
  add column if not exists cqc_location_id   text,
  add column if not exists cqc_location_name text,
  add column if not exists cqc_rating        text,
  add column if not exists service_type      text;
