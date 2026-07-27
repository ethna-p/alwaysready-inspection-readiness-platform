-- Migration: waitlist_leads
--
-- Stores warm leads from the alwaysready.uk/waitlist form.
-- These are people who have actively requested to be notified at launch —
-- treated as higher priority than general contact enquiries.
--
-- Separate from blog_subscribers (which captures general marketing opt-ins)
-- and support_tickets (which captures contact enquiries).

CREATE TABLE public.waitlist_leads (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name        text        NOT NULL,
  email             text        NOT NULL UNIQUE,
  marketing_opt_in  boolean     NOT NULL DEFAULT false,
  source            text        NOT NULL DEFAULT 'website_waitlist',
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.waitlist_leads IS
  'Warm leads collected from the alwaysready.uk/waitlist form.
   These people have actively requested early access — contact them first at launch.';

-- No RLS needed — accessed only via service-role admin client.
CREATE INDEX waitlist_leads_email_idx    ON public.waitlist_leads (email);
CREATE INDEX waitlist_leads_created_idx  ON public.waitlist_leads (created_at DESC);
