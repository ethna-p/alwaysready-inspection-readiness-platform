-- Migration: fix kloe_evidence.uploaded_by's self-contradicting constraint
--
-- kloe_evidence.uploaded_by (20260717000001_kloe_evidence.sql) was declared:
--   UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL
--
-- NOT NULL and ON DELETE SET NULL on the same column can never both hold:
-- the moment a referenced user is actually deleted while an evidence row
-- still points at them, Postgres tries to null the column to satisfy the FK
-- action and the NOT NULL constraint rejects that same write in the same
-- statement, so the whole deletion fails outright with a generic constraint
-- error that gives no hint which of the two clauses is really at fault.
--
-- Nothing in the app currently deletes a single team member's account (only
-- whole-organisation deletion exists today, app/superadmin/organisations/actions.ts,
-- which already clears kloe_evidence before deleting users — this table was
-- in its directTables list from the start, so that path was never at risk).
-- This is a latent trap for whenever a "remove this one team member"
-- feature is eventually added, not a live incident — caught by the E2E
-- test seed script hitting it directly (its own re-seed step deletes a
-- fixture user who had just uploaded evidence in the previous run).
--
-- Fix: drop NOT NULL, so the existing ON DELETE SET NULL can actually do
-- what it was always declared to do — preserve the evidence record with an
-- unknown/deleted uploader rather than block the deletion. This matches how
-- hr_training_certificates.uploaded_by (20260718000001_hr_module.sql) was
-- already correctly declared nullable with the same ON DELETE SET NULL.

ALTER TABLE public.kloe_evidence
  ALTER COLUMN uploaded_by DROP NOT NULL;
