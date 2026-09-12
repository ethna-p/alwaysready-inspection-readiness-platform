-- Add a short, human-typeable opt-out code alongside the existing
-- optout_token (a full UUID — fine for a clickable email link, unusable for
-- someone typing it by hand off a printed letter).
--
-- Charset excludes ambiguous characters (0/O, 1/I/L) since this is meant to
-- be read off paper and typed back in. 6 chars from a 32-character alphabet
-- is ~1 billion combinations — not guessable, especially combined with the
-- existing per-IP rate limit on /api/inbound-optout.

CREATE OR REPLACE FUNCTION public.generate_optout_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O, 1/I/L
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

ALTER TABLE public.campaign_contacts
  ADD COLUMN IF NOT EXISTS optout_code text NOT NULL DEFAULT public.generate_optout_code();

-- Backfill existing rows (DEFAULT only applies to rows inserted after this point)
UPDATE public.campaign_contacts SET optout_code = public.generate_optout_code() WHERE optout_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS campaign_contacts_optout_code_idx
  ON public.campaign_contacts (optout_code);
