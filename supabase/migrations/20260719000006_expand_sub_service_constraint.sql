-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: expand sub_service check constraint on klo_checklist_items
--
-- The original constraint only allowed 'Residential' | 'Nursing' | 'Joint'
-- (values used for the Dual-Registered Care Home split). The sub-service overlay
-- pattern (e.g. 'Dementia') requires the constraint to be widened.
--
-- Run this before 20260719000005_dementia_sub_service.sql if not already applied.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.klo_checklist_items
  DROP CONSTRAINT klo_checklist_items_sub_service_check;

ALTER TABLE public.klo_checklist_items
  ADD CONSTRAINT klo_checklist_items_sub_service_check
  CHECK (sub_service IN ('Residential', 'Nursing', 'Joint', 'Dementia'));
