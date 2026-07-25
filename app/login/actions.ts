'use server'

/**
 * Password reset server actions for the login page.
 *
 * Two flows:
 *   1. Email user (admin / viewer / superadmin) — calls Supabase resetPasswordForEmail,
 *      which sends the reset email directly.
 *   2. Staff username — admin client looks up the staff auth email and personal_email,
 *      generates a recovery link, and sends it via Resend to their personal inbox
 *      (since username@staff.alwaysready.uk is not a real email address).
 *
 * In both cases we always return { success: true } to prevent enumeration of
 * valid email addresses or usernames.
 */

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export type ResetRequestResult =
  | { success: true }
  | { success: false; error: string }

export async function requestPasswordReset(
  loginId: string
): Promise<ResetRequestResult> {
  if (!loginId?.trim()) {
    return { success: false, error: 'Please enter your email address or login ID.' }
  }

  const input = loginId.trim()
  const isEmail = input.includes('@')

  // Build the redirect URL dynamically so it works on localhost, preview, and prod
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const siteUrl = `${protocol}://${host}`
  const redirectTo = `${siteUrl}/auth/callback?next=/login/new-password`

  // ── Email user ──────────────────────────────────────────────────────────────
  if (isEmail) {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(input, { redirectTo })

    if (error) {
      // Log for ops visibility, but don't reveal to the caller
      console.error('[requestPasswordReset] email reset error:', error)
    }

    // Always succeed — don't reveal whether the email is registered
    return { success: true }
  }

  // ── Staff username ──────────────────────────────────────────────────────────
  // Staff auth emails are fabricated (username@staff.alwaysready.uk) and don't
  // receive real mail. We send the reset link to their personal_email instead.

  const admin = createAdminClient()

  // Look up by username in public.users
  const { data: userRow, error: lookupError } = await admin
    .from('users')
    .select('personal_email, username')
    .eq('username', input)
    .maybeSingle()

  if (lookupError) {
    console.error('[requestPasswordReset] username lookup error:', lookupError)
    return { success: true }
  }

  if (!userRow?.personal_email) {
    // No personal email on file — can't send a reset link.
    // Log for ops visibility; return success to avoid username enumeration.
    console.warn(
      '[requestPasswordReset] no personal_email for username:',
      input,
      '— user must ask their admin to reset their password.'
    )
    return { success: true }
  }

  // Generate a one-time recovery link for the staff auth email
  const staffAuthEmail = `${input}@staff.alwaysready.uk`
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: staffAuthEmail,
    options: { redirectTo },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error('[requestPasswordReset] generateLink error:', linkError)
    return { success: true }
  }

  // Send the link to the staff member's personal email
  try {
    await sendEmail({
      to: userRow.personal_email,
      subject: 'Reset your AlwaysReady password',
      bodyHtml: `
        <p>We received a request to reset the password for your AlwaysReady account
        (login ID: <strong>${input}</strong>).</p>
        <p style="color:#555;font-size:14px">Click the button below to set a new password. This link expires in 1 hour.</p>
        <p>
          <a href="${linkData.properties.action_link}"
             style="display:inline-block;background:#014D4E;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px">
            Reset my password
          </a>
        </p>
        <p style="font-size:12px;color:#999;margin-top:24px">
          If you didn't request this, you can safely ignore this email. Your password will not change.
        </p>
      `,
      type: 'transactional',
    })
  } catch (emailError) {
    console.error('[requestPasswordReset] email send error:', emailError)
  }

  return { success: true }
}
