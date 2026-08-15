'use server'

/**
 * Password reset server action for the login page.
 *
 * All users log in with a real email address. Supabase's resetPasswordForEmail
 * sends the reset link directly. We always return { success: true } to prevent
 * enumeration of valid email addresses.
 */

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type ResetRequestResult =
  | { success: true }
  | { success: false; error: string }

export async function requestPasswordReset(
  loginId: string
): Promise<ResetRequestResult> {
  if (!loginId?.trim()) {
    return { success: false, error: 'Please enter your email address.' }
  }

  const email = loginId.trim()

  // Build the redirect URL dynamically so it works on localhost, preview, and prod
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const siteUrl = `${protocol}://${host}`
  const redirectTo = `${siteUrl}/auth/callback?next=/login/new-password`

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) {
    // Log for ops visibility, but don't reveal to the caller
    console.error('[requestPasswordReset] email reset error:', error)
  }

  // Always succeed — don't reveal whether the email is registered
  return { success: true }
}
