/**
 * assertSuperadmin — throws if the current session user is not the superadmin.
 *
 * Call at the top of every superadmin server action. This provides a
 * self-contained auth check independent of middleware, so the action is safe
 * even if called directly rather than via the superadmin UI.
 *
 * Identity alone isn't enough here: this gates the single most destructive
 * account on the platform (impersonate any customer, permanently delete any
 * organisation and all its data). Every other sensitive server action in
 * this app gets AAL2 enforcement via getCurrentUserProfile() -> isAAL2Satisfied()
 * (see lib/session.ts's own doc comment on exactly this "independent of
 * middleware" reasoning) -- this function's own stated purpose was the same,
 * but it only ever replicated the identity half of that check, not the MFA
 * half. A superadmin session that's authenticated but hasn't completed MFA
 * this session (aal1) passed every check here.
 */
import { createClient } from '@/lib/supabase/server'
import { isAAL2Satisfied } from '@/lib/session'

export async function assertSuperadmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (!user || !superadminEmail || user.email !== superadminEmail) {
    throw new Error('Unauthorised')
  }

  if (!(await isAAL2Satisfied(supabase))) {
    throw new Error('Unauthorised')
  }
}
