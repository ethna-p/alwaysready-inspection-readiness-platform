-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: organisation_sub_services
-- Allows organisations to opt into sub-service overlays (e.g. Dementia care).
-- Sub-service checklist items (sub_service IS NOT NULL in klo_checklist_items)
-- are only shown to organisations that have opted into that sub-service.
--
-- Designed to be extensible: future sub-services (e.g. 'End of Life', 'Autism',
-- 'Bariatric') can be added without any schema change — just new rows.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.organisation_sub_services (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  sub_service     text        NOT NULL CHECK (char_length(sub_service) > 0),
  created_at      timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT organisation_sub_services_unique UNIQUE (organisation_id, sub_service)
);

-- ── Index ─────────────────────────────────────────────────────────────────────
CREATE INDEX organisation_sub_services_org_idx
  ON public.organisation_sub_services (organisation_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.organisation_sub_services ENABLE ROW LEVEL SECURITY;

-- All org members can read their org's enabled sub-services
CREATE POLICY "org members can read sub_services"
  ON public.organisation_sub_services
  FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Only admins can enable a sub-service
CREATE POLICY "admins can insert sub_services"
  ON public.organisation_sub_services
  FOR INSERT
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can remove a sub-service
CREATE POLICY "admins can delete sub_services"
  ON public.organisation_sub_services
  FOR DELETE
  USING (
    organisation_id IN (
      SELECT organisation_id FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── API grants ─────────────────────────────────────────────────────────────────
GRANT SELECT         ON public.organisation_sub_services TO authenticated;
GRANT INSERT, DELETE ON public.organisation_sub_services TO authenticated;
