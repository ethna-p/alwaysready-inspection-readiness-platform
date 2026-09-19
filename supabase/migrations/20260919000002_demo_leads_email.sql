-- Add email to demo_leads so intake responses can be matched to Zeeg bookings.
ALTER TABLE public.demo_leads
  ADD COLUMN IF NOT EXISTS email TEXT;
