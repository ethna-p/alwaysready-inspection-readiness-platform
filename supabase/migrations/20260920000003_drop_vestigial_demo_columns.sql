-- M15: Remove the vestigial demo columns from organisations.
--
-- is_demo and demo_expires_at came from an abandoned per-session demo feature
-- (July 2026). The product is trial to subscription only, nothing in app code
-- or lib/types.ts references either column, and the functions that used them
-- were dropped in 20260920000001. Production never had them; only the preview
-- project (and a from-scratch local replay) did, so this makes the schemas
-- identical. IF EXISTS makes it a no-op wherever the columns are already gone.
--
-- Checked before writing: nothing depends on either column apart from their
-- own default expressions, so a plain DROP (no CASCADE) is safe and would
-- refuse loudly if that ever stopped being true.

ALTER TABLE public.organisations
  DROP COLUMN IF EXISTS is_demo,
  DROP COLUMN IF EXISTS demo_expires_at;
