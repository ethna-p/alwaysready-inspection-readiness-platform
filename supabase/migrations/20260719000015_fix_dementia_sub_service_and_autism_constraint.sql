-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Fix dementia sub_service NULL values + expand constraint for Autism
--
-- BUG: Migrations 20260719000010–20260719000014 (Shared Lives Scheme, Supported
-- Living, Specialist College, Residential Rehabilitation Service, Community Drug
-- and Alcohol Service) incorrectly seeded Dementia sub-service items with
-- sub_service = NULL instead of sub_service = 'Dementia'. This meant those items
-- were shown to all organisations regardless of whether they had the Dementia
-- sub-service enabled.
--
-- FIX: UPDATE all rows where ref starts with 'DEM-' and sub_service IS NULL
-- to set sub_service = 'Dementia'.
--
-- CONSTRAINT: Expand the sub_service check constraint to also allow 'Autism',
-- ready for the autism sub-service migration that follows.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Step 1: Fix sub_service = NULL on all Dementia items ─────────────────────

UPDATE public.klo_checklist_items
SET sub_service = 'Dementia'
WHERE ref LIKE 'DEM-%'
  AND sub_service IS NULL;

-- ── Step 2: Expand constraint to include 'Autism' ────────────────────────────

ALTER TABLE public.klo_checklist_items
  DROP CONSTRAINT klo_checklist_items_sub_service_check;

ALTER TABLE public.klo_checklist_items
  ADD CONSTRAINT klo_checklist_items_sub_service_check
  CHECK (sub_service IN ('Residential', 'Nursing', 'Joint', 'Dementia', 'Autism'));
