-- Migration: saved_report_views
-- Allows orgs to save named report configurations.
-- System views (is_system = true, org_id = NULL) are seeded here and
-- are visible to all orgs but cannot be edited or deleted by users.

create table if not exists saved_report_views (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organisations(id) on delete cascade,
  name        text not null,
  config      jsonb not null default '{}'::jsonb,
  is_system   boolean not null default false,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Org views: each org sees only their own custom views
create index if not exists saved_report_views_org_idx
  on saved_report_views(org_id)
  where org_id is not null;

-- RLS
alter table saved_report_views enable row level security;

-- Anyone authenticated can read system views or their org's views
create policy "Read own org views and system views"
  on saved_report_views for select
  using (
    is_system = true
    or org_id = (
      select organisation_id from users where id = auth.uid() limit 1
    )
  );

-- Admins can insert custom views for their org
create policy "Admins can create views"
  on saved_report_views for insert
  with check (
    is_system = false
    and org_id = (
      select organisation_id from users where id = auth.uid() limit 1
    )
    and (
      select role from users where id = auth.uid() limit 1
    ) = 'admin'
  );

-- Admins can delete their org's custom views (not system views)
create policy "Admins can delete custom views"
  on saved_report_views for delete
  using (
    is_system = false
    and org_id = (
      select organisation_id from users where id = auth.uid() limit 1
    )
    and (
      select role from users where id = auth.uid() limit 1
    ) = 'admin'
  );

-- ── Seed system views ────────────────────────────────────────────────────────
-- selectedKQs: "all" means apply all key questions for the org at runtime.
-- showHr: false in non-HR views — HR section is admin-only regardless.

insert into saved_report_views (org_id, name, config, is_system, created_by) values

  -- 1. Governance Summary — full picture for board/management packs
  (null, 'Governance Summary', '{
    "selectedKQs":    "all",
    "showKloes":      true,
    "showActions":    true,
    "showHr":         true,
    "showAnnualReview": true,
    "actionStatus":   "all"
  }'::jsonb, true, null),

  -- 2. Attention Needed — open actions + overdue KLOEs only
  (null, 'Attention Needed', '{
    "selectedKQs":    "all",
    "showKloes":      true,
    "showActions":    true,
    "showHr":         false,
    "showAnnualReview": false,
    "actionStatus":   "open"
  }'::jsonb, true, null),

  -- 3. Evidence Gaps — KLOE summary only, for identifying missing evidence
  (null, 'Evidence Gaps', '{
    "selectedKQs":    "all",
    "showKloes":      true,
    "showActions":    false,
    "showHr":         false,
    "showAnnualReview": false,
    "actionStatus":   "all"
  }'::jsonb, true, null),

  -- 4. HR Compliance — staff DBS, training, supervision, appraisal (admin only)
  (null, 'HR Compliance', '{
    "selectedKQs":    "all",
    "showKloes":      false,
    "showActions":    false,
    "showHr":         true,
    "showAnnualReview": false,
    "actionStatus":   "all"
  }'::jsonb, true, null);
