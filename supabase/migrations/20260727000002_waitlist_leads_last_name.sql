ALTER TABLE public.waitlist_leads
  ADD COLUMN IF NOT EXISTS last_name text;
