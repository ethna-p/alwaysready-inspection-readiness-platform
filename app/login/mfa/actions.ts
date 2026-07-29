'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Returns the correct post-MFA redirect destination for the current user.
 * The superadmin email comparison is done server-side so the value is never
 * baked into the client JS bundle (avoids NEXT_PUBLIC_ exposure).
 */
export async function getPostMfaDestination(): Promise<'/superadmin' | '/dashboard'> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (superadminEmail && user?.email === superadminEmail) {
    return '/superadmin'
  }
  return '/dashboard'
}
