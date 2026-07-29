/**
 * assertSuperadmin — throws if the current session user is not the superadmin.
 *
 * Call at the top of every superadmin server action. This provides a
 * self-contained auth check independent of middleware, so the action is safe
 * even if called directly rather than via the superadmin UI.
 */
import { createClient } from '@/lib/supabase/server'

export async function assertSuperadmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (!user || !superadminEmail || user.email !== superadminEmail) {
    throw new Error('Unauthorised')
  }
}
