-- Migration: org logo upload support
-- Adds logo_url column to organisations and creates the org-logos storage bucket.

alter table organisations
  add column if not exists logo_url text;

-- Storage bucket: public read, authenticated write
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-logos',
  'org-logos',
  true,
  2097152,  -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- RLS: any authenticated user can read (bucket is public, but belt-and-braces)
create policy "Public read org logos"
  on storage.objects for select
  using ( bucket_id = 'org-logos' );

-- Admins can upload/replace their own org's logo
create policy "Admins can upload org logo"
  on storage.objects for insert
  with check (
    bucket_id = 'org-logos'
    and (select role from users where id = auth.uid() limit 1) = 'admin'
  );

-- Admins can delete their own org's logo
create policy "Admins can delete org logo"
  on storage.objects for delete
  using (
    bucket_id = 'org-logos'
    and (select role from users where id = auth.uid() limit 1) = 'admin'
  );
