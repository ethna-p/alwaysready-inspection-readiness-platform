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
import { Resend } from 'resend'

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

  // Send the link to the staff member's personal email via Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'AlwaysReady <onboarding@resend.dev>',
        to: userRow.personal_email,
        subject: 'Reset your AlwaysReady password',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
            <div style="background:#014D4E;padding:24px 32px">
              <span style="color:#fff;font-size:20px;font-weight:bold">AlwaysReady</span>
            </div>
            <div style="padding:32px">
              <p style="font-size:16px;margin:0 0 16px">
                We received a request to reset the password for your AlwaysReady account
                (login ID: <strong>${input}</strong>).
              </p>
              <p style="font-size:14px;color:#555;margin:0 0 24px">
                Click the button below to set a new password. This link expires in 1 hour.
              </p>
              <a
                href="${linkData.properties.action_link}"
                style="
                  display:inline-block;background:#014D4E;color:#fff;
                  text-decoration:none;font-size:14px;font-weight:600;
                  padding:12px 24px;border-radius:8px;
                "
              >
                Reset my password
              </a>
              <p style="font-size:12px;color:#999;margin:24px 0 0">
                If you didn&apos;t request this, you can safely ignore this email.
                Your password will not change.
              </p>
            </div>
            <div style="border-top:1px solid #eee;padding:16px 32px">
              <p style="font-size:12px;color:#999;margin:0">
                AlwaysReady Inspection Readiness Platform
              </p>
            </div>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('[requestPasswordReset] Resend error:', emailError)
    }
  } else {
    console.warn('[requestPasswordReset] RESEND_API_KEY not set — skipping email send')
  }

  return { success: true }
}
