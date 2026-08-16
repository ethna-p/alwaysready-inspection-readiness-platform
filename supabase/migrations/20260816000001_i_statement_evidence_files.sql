-- Migration: i_statement_evidence_files
--
-- Stores metadata for files uploaded as evidence against "I" statements
-- (People's Voice module). Actual file bytes live in Supabase Storage
-- under the existing `evidence` bucket at:
--   {organisation_id}/i-statements/{i_statement_id}/{timestamp}-{filename}
--
-- Mirrors the kloe_evidence table in structure and RLS pattern.

create table if not exists i_statement_evidence_files (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisations(id) on delete cascade,
  i_statement_id   uuid not null references i_statements(id) on delete cascade,
  uploaded_by      uuid references auth.users(id) on delete set null,
  file_name        text not null,
  storage_path     text not null unique,
  file_size        bigint,
  mime_type        text,
  scan_status      text not null default 'clean',
  uploaded_at      timestamptz not null default now()
);

-- Index for the most common query: all files for a given org + statement
create index if not exists i_statement_evidence_files_org_stmt_idx
  on i_statement_evidence_files (organisation_id, i_statement_id);

-- RLS
alter table i_statement_evidence_files enable row level security;

-- Users can read files belonging to their organisation
create policy "org members can read i_statement_evidence_files"
  on i_statement_evidence_files for select
  using (
    organisation_id = (
      select organisation_id from users where id = auth.uid()
    )
  );

-- Admins and users (not viewers) can insert
create policy "non-viewers can insert i_statement_evidence_files"
  on i_statement_evidence_files for insert
  with check (
    organisation_id = (
      select organisation_id from users where id = auth.uid()
    )
    and (
      select role from users where id = auth.uid()
    ) in ('admin', 'user')
  );

-- Only admins can delete
create policy "admins can delete i_statement_evidence_files"
  on i_statement_evidence_files for delete
  using (
    organisation_id = (
      select organisation_id from users where id = auth.uid()
    )
    and (
      select role from users where id = auth.uid()
    ) = 'admin'
  );
