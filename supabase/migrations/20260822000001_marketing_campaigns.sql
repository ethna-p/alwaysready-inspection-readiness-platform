-- Marketing campaigns: track outreach campaigns and contact/suppression records

create table marketing_campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  status      text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  created_at  timestamptz not null default now()
);

create table campaign_contacts (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references marketing_campaigns(id) on delete cascade,
  location_id     text,
  location_name   text not null,
  provider_name   text,
  street_address  text,
  city            text,
  postcode        text,
  region          text,
  service_type    text,
  cqc_profile_url text,
  contact_method  text not null default 'letter' check (contact_method in ('letter', 'email')),
  contacted_at    timestamptz,
  notes           text,
  suppressed_at   timestamptz,
  created_at      timestamptz not null default now()
);

create index campaign_contacts_campaign_id_idx on campaign_contacts(campaign_id);
create index campaign_contacts_postcode_idx on campaign_contacts(postcode);
create index campaign_contacts_location_id_idx on campaign_contacts(location_id);

create table marketing_suppressions (
  id                  uuid primary key default gen_random_uuid(),
  location_name       text not null,
  postcode            text,
  email               text,
  source              text not null default 'optout_form' check (source in ('optout_form', 'manual')),
  campaign_contact_id uuid references campaign_contacts(id) on delete set null,
  created_at          timestamptz not null default now()
);

create index marketing_suppressions_postcode_idx on marketing_suppressions(postcode);
