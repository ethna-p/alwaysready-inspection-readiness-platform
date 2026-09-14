-- Fix: mock_inspections.conducted_by had no ON DELETE behaviour at all
-- (defaults to NO ACTION), so deleting the auth.users row of anyone who had
-- ever run a mock inspection was permanently blocked by this FK -- found
-- directly when e2e/mock-inspections.spec.ts's own test run left exactly
-- one such row behind and the next `npm run test:e2e:seed` failed with
-- "Database error deleting user" trying to delete the fixture admin.
--
-- SET NULL (not CASCADE): deleting the user who conducted a mock inspection
-- should not delete the inspection itself -- that would silently destroy
-- real self-assessment history for a reason (staff departure, account
-- cleanup) that has nothing to do with the inspection's own validity.
-- Losing only the "who ran it" attribution is the right trade-off. The
-- column is already nullable (no NOT NULL constraint), so this is safe.

ALTER TABLE public.mock_inspections
  DROP CONSTRAINT mock_inspections_conducted_by_fkey,
  ADD CONSTRAINT mock_inspections_conducted_by_fkey
    FOREIGN KEY (conducted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
