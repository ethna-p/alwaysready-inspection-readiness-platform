'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Marks the current user's onboarding checklist as complete.
 * Called when they dismiss the first-login checklist.
 */
export async function dismissOnboarding(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('users')
    .update({ onboarding_complete: true })
    .eq('id', user.id)
}
