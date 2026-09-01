-- Allow staff to read and update their own HR profile row.
-- They may only touch next_of_kin_name and next_of_kin_phone via the
-- saveOwnProfile server action (enforced at the application layer).
-- This policy provides the RLS layer of defence.

CREATE POLICY "hr_staff_profiles_self_select"
  ON public.hr_staff_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "hr_staff_profiles_self_update"
  ON public.hr_staff_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
