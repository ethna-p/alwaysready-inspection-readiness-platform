import fs from 'fs'
import path from 'path'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildUnsubscribeUrl, buildSubscriberUnsubscribeUrl } from '@/lib/unsubscribe-token'

/**
 * Email types.
 *
 * 'transactional' — billing notices, security alerts, account changes.
 *   Never gated by marketing_opt_out. No unsubscribe footer.
 *   Examples: password changed, trial ending, subscription confirmed, account suspended.
 *
 * 'marketing' — feature tips, onboarding sequence, check-ins.
 *   Gated by marketing_opt_out. Includes unsubscribe footer and List-Unsubscribe header.
 *   Examples: trial day 1/3/5/7/9, all 12 onboarding weeks.
 */
export type EmailType = 'transactional' | 'marketing'

export interface SendEmailOptions {
  to: string
  subject: string
  /** Body content as HTML — do NOT include the outer wrapper; this function adds it. */
  bodyHtml: string
  type: EmailType
  /**
   * The Supabase user ID of the recipient.
   * Required for marketing emails to platform users (checks marketing_opt_out).
   * Not used for blog subscriber emails — use subscriberEmail instead.
   */
  userId?: string
  /**
   * The email address of a blog subscriber (not a platform user).
   * When set, skips the users table opt-out check (caller already filtered
   * by unsubscribed_at IS NULL) and generates a subscriber unsubscribe URL.
   * Mutually exclusive with userId.
   */
  subscriberEmail?: string
}

export interface SendEmailResult {
  sent: boolean
  skipped?: 'opted_out' | 'no_api_key'
  error?: string
}

function logoImg(): string {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.alwaysready.uk').replace(/\/$/, '')
  return `<img src="${baseUrl}/logo-email.png" alt="AlwaysReady" width="220" height="48" style="display:block;height:40px;width:auto;border:0">`
}

function buildHtml(bodyHtml: string, unsubscribeUrl?: string, footerNote?: string): string {
  const note = footerNote ?? 'You are receiving this email because you have an active AlwaysReady account.'
  const unsubscribeFooter = unsubscribeUrl
    ? `<p style="margin:12px 0 0;font-size:12px;color:#888">
         ${note}
         <a href="${unsubscribeUrl}" style="color:#014D4E">Unsubscribe</a> from non-essential emails.
       </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#faf9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(1,77,78,0.12)">

          <!-- Header -->
          <tr>
            <td style="background-color:#014D4E;padding:28px 40px;border-bottom:4px solid #ffd700">
              ${logoImg()}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 0;color:#1a1a1a;font-size:15px;line-height:1.7">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:24px 40px 32px">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom:12px;border-bottom:1px solid #e8e6e0">
                    <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1a1a1a">Ethna Parker PhD</p>
                    <p style="margin:0;font-size:13px;color:#555555">Founder - AlwaysReady</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px">
                    <p style="margin:0 0 6px;font-size:13px;color:#555555">
                      <img src="cid:email-icon-mail" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;margin-right:7px">
                      <a href="mailto:support@alwaysready.uk" style="color:#555555;text-decoration:none;vertical-align:middle">support@alwaysready.uk</a>
                    </p>
                    <p style="margin:0 0 6px;font-size:13px;color:#555555">
                      <img src="cid:email-icon-globe" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;margin-right:7px">
                      <a href="https://www.alwaysready.uk" style="color:#555555;text-decoration:none;vertical-align:middle">www.alwaysready.uk</a>
                    </p>
                    <p style="margin:0;font-size:13px;color:#555555">
                      <img src="cid:email-icon-pin" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;margin-right:7px">
                      <span style="vertical-align:middle">82A James Carter Road, Mildenhall, IP28 7DE</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#faf9f6;border-top:1px solid #e8e6e0;padding:20px 40px;text-align:center">
              <p style="margin:0;font-size:12px;color:#888;line-height:1.6">
                AlwaysReady is a product of Parker Digital &amp; Print Services<br>
                82A James Carter Road, Mildenhall, IP28 7DE
              </p>
              ${unsubscribeFooter}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Send an email via Resend.
 *
 * For marketing emails, checks marketing_opt_out before sending and
 * adds List-Unsubscribe headers + an unsubscribe footer.
 *
 * For transactional emails, sends unconditionally with no unsubscribe UI.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping send.')
    return { sent: false, skipped: 'no_api_key' }
  }

  // --- Marketing opt-out check ---
  if (opts.type === 'marketing') {
    if (opts.subscriberEmail) {
      // Blog subscriber path: caller already filtered by unsubscribed_at IS NULL,
      // so no further opt-out check needed here.
    } else if (!opts.userId) {
      console.warn('[email] marketing email sent without userId or subscriberEmail — cannot check opt-out. Skipping.')
      return { sent: false, skipped: 'opted_out' }
    } else {
      // Platform user path: check marketing_opt_out in users table
      try {
        const supabase = createAdminClient()
        const { data } = await supabase
          .from('users')
          .select('marketing_opt_out')
          .eq('id', opts.userId)
          .single()

        if (data?.marketing_opt_out) {
          return { sent: false, skipped: 'opted_out' }
        }
      } catch (err) {
        console.error('[email] opt-out check failed:', err)
        // Fail safe — do not send if we cannot confirm opt-out status
        return { sent: false, error: 'Opt-out check failed.' }
      }
    }
  }

  // --- Build HTML ---
  let unsubscribeUrl: string | undefined
  let footerNote: string | undefined

  if (opts.type === 'marketing') {
    if (opts.subscriberEmail) {
      unsubscribeUrl = buildSubscriberUnsubscribeUrl(opts.subscriberEmail)
      footerNote = 'You are receiving this because you signed up for the AlwaysReady blog.'
    } else if (opts.userId) {
      unsubscribeUrl = buildUnsubscribeUrl(opts.userId)
    }
  }

  const html = buildHtml(opts.bodyHtml, unsubscribeUrl, footerNote)

  // --- Build headers ---
  const headers: Record<string, string> = {}
  if (unsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  // --- Load icon attachments (CID inline) ---
  const iconAttachments = (['mail', 'globe', 'pin'] as const).flatMap((name) => {
    try {
      const iconPath = path.join(process.cwd(), 'public', `email-icon-${name}.png`)
      const content = fs.readFileSync(iconPath)
      return [{ filename: `email-icon-${name}.png`, content, content_id: `email-icon-${name}` }]
    } catch {
      return []
    }
  })

  // --- Send ---
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.RESEND_FROM_ADDRESS ?? 'AlwaysReady <onboarding@resend.dev>'

    const { error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html,
      headers: Object.keys(headers).length ? headers : undefined,
      attachments: iconAttachments.length ? iconAttachments : undefined,
    })

    if (error) {
      console.error('[email] Resend error:', error)
      return { sent: false, error: error.message }
    }

    return { sent: true }
  } catch (err) {
    console.error('[email] unexpected error:', err)
    return { sent: false, error: 'Unexpected error sending email.' }
  }
}
