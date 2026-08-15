-- Migration: report_snapshots
-- Stores one RAG + action snapshot per organisation per report view per day.
-- Used by the Reports module to show "progress vs last run" deltas.

create table if not exists report_snapshots (
  id              uuid        primary key default gen_random_uuid(),
  organisation_id uuid        not null references organisations(id) on delete cascade,
  view_key        text        not null,
  green           int         not null default 0,
  amber           int         not null default 0,
  red             int         not null default 0,
  grey            int         not null default 0,
  total           int         not null default 0,
  open_actions    int         not null default 0,
  overdue_actions int         not null default 0,
  captured_date   date        not null default current_date,
  captured_at     timestamptz not null default now()
);

-- One snapshot per org per view per calendar day
create unique index if not exists report_snapshots_org_view_day
  on report_snapshots (organisation_id, view_key, captured_date);

-- Index for fast "previous snapshot" queries
create index if not exists report_snapshots_org_view_time
  on report_snapshots (organisation_id, view_key, captured_at desc);

-- RLS
alter table report_snapshots enable row level security;

-- Admins read their own org's snapshots
create policy "Admins can read their org snapshots"
  on report_snapshots for select
  using (
    organisation_id = (
      select organisation_id from users where id = auth.uid()
    )
    and exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    )
  );

-- Admins insert/update their own org's snapshots
create policy "Admins can upsert their org snapshots"
  on report_snapshots for insert
  with check (
    organisation_id = (
      select organisation_id from users where id = auth.uid()
    )
    and exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update their org snapshots"
  on report_snapshots for update
  using (
    organisation_id = (
      select organisation_id from users where id = auth.uid()
    )
    and exists (
      select 1 from users where id = auth.uid() and role = 'admin'
    )
  );
