-- M11: Prevent duplicate trial organisations for the same CQC location.
-- A unique partial index on cqc_location_id (where not null) ensures one org
-- per registered location. The application pre-checks before insert so the
-- user sees a friendly error rather than a Postgres constraint violation.

CREATE UNIQUE INDEX IF NOT EXISTS organisations_cqc_location_id_unique
  ON public.organisations (cqc_location_id)
  WHERE cqc_location_id IS NOT NULL;
