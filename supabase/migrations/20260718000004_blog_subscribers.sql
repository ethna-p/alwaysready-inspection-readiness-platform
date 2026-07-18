-- Migration: Blog subscribers
--
-- Captures email signups from the alwaysready.uk marketing website
-- via the POST /api/blog-subscribe webhook. These are people who want
-- blog updates but have not yet started a trial or become customers.
--
-- They receive broadcasts alongside platform users (marketing_opt_out = false).
-- Unsubscribes set unsubscribed_at rather than deleting the row.

CREATE TABLE public.blog_subscribers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text        NOT NULL UNIQUE,
  full_name        text,
  source           text        NOT NULL DEFAULT 'website_form',
  subscribed_at    timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at  timestamptz             -- NULL = active subscriber
);

COMMENT ON TABLE public.blog_subscribers IS
  'Email addresses collected from the marketing website blog signup form.
   Separate from platform users — these people may not have an account.';

COMMENT ON COLUMN public.blog_subscribers.unsubscribed_at IS
  'Set when the subscriber clicks their unsubscribe link. NULL = active.';

-- No RLS needed — this table is only accessed via the service-role admin client.
-- The public API route uses createAdminClient() which bypasses RLS.

CREATE INDEX blog_subscribers_email_idx ON public.blog_subscribers (email);
CREATE INDEX blog_subscribers_active_idx ON public.blog_subscribers (unsubscribed_at)
  WHERE unsubscribed_at IS NULL;
