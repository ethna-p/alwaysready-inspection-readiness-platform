-- Migration: drop the now-unused personal_email and mobile_number columns
-- from public.users
--
-- These backed a "Notification contact details" feature (PersonalContactForm,
-- the account Notifications tab) that was built but never shipped -- the tab
-- was commented out in app/dashboard/account/page.tsx pending inbound email
-- threading and WhatsApp notifications, so no real user could ever set
-- these fields through the app. AJ confirmed: the "no real work email"
-- onboarding path these were meant to serve was removed a long time ago
-- (every team member now onboards with a real work email -- see
-- team-actions.ts's own doc comment), and there are no live customers on
-- the platform yet, so there is no production data at risk.
--
-- All code references (PersonalContactForm.tsx, updatePersonalContact(),
-- the changePassword/KLOE-assignment/support-ticket notification fallbacks
-- that preferred these over the real work email) were removed in the same
-- change as this migration. This is the platform's own users table --
-- hr_staff_profiles' own personal contact fields (a separate table, for
-- care-home staff HR records) are untouched and still in active,
-- intentional use.

ALTER TABLE public.users
  DROP COLUMN IF EXISTS personal_email,
  DROP COLUMN IF EXISTS mobile_number;
