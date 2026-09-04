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
  /**
   * Override the footer note text. If omitted, a default is chosen based on
   * the email type and recipient kind (blog subscriber vs platform user).
   */
  footerNote?: string
}

export interface SendEmailResult {
  sent: boolean
  skipped?: 'opted_out' | 'no_api_key'
  error?: string
}

function buildHtml(bodyHtml: string, unsubscribeUrl?: string, footerNote?: string): string {
  const note = footerNote ?? 'You are receiving this email because you have an active AlwaysReady account.'
  const unsubscribeFooter = unsubscribeUrl
    ? `<p style="margin:12px 0 0;font-size:12px;color:#6b6b6b">
         ${note}
         <a href="${unsubscribeUrl}" style="color:#014D4E;text-decoration:underline">Unsubscribe</a> from non-essential emails.
       </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AlwaysReady</title></head>
<body style="margin:0;padding:0;background-color:#faf9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(1,77,78,0.12)">

          <!-- Header -->
          <tr>
            <td style="background-color:#014D4E;padding:32px 40px;text-align:center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 8px auto">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="40" height="40" role="img" aria-hidden="true" style="display:inline-block;vertical-align:middle">
                      <circle cx="24" cy="24" r="22" fill="#ffd700"/>
                      <circle cx="24" cy="24" r="17" fill="none" stroke="#ffffff" stroke-width="2"/>
                      <polyline points="13,24 21,32 35,16" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="vertical-align:middle">
                    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff">AlwaysReady</span>
                  </td>
                </tr>
              </table>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.8);letter-spacing:0.15em;text-transform:uppercase">Inspection Readiness Platform</div>
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
                  <td style="padding-bottom:12px;border-bottom:2px solid #014D4E">
                    <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1a1a1a">Ethna Parker PhD</p>
                    <p style="margin:0;font-size:13px;color:#555555">Founder - AlwaysReady</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;padding-left:12px;border-left:3px solid #ffd700">
                    <p style="margin:0 0 4px;font-size:13px">
                      <a href="mailto:support@alwaysready.uk" style="color:#014D4E;text-decoration:underline">support@alwaysready.uk</a>
                    </p>
                    <p style="margin:0 0 4px;font-size:13px">
                      <a href="https://www.alwaysready.uk" style="color:#014D4E;text-decoration:underline">www.alwaysready.uk</a>
                    </p>
                    <p style="margin:0;font-size:13px;color:#555555">82A James Carter Road, Mildenhall, IP28 7DE</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer: CQC five key questions -->
          <tr>
            <td style="background-color:#014D4E;padding:24px 40px 20px;text-align:center">
              <p style="margin:0 0 16px;font-size:10px;color:rgba(255,255,255,0.8);letter-spacing:0.1em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">Mapped to CQC&apos;s five key questions</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto">
                <tr>
                  <td align="center" style="padding:0 8px">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
                      <td align="center" width="48" height="48" style="width:48px;height:48px;border-radius:24px;background-color:#5DCAA5;font-size:20px;color:#003d30;font-weight:700;line-height:48px;font-family:Arial,sans-serif">&#x2713;</td>
                    </tr></table>
                    <p style="margin:6px 0 0;font-size:10px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.04em">Safe</p>
                  </td>
                  <td align="center" style="padding:0 8px">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
                      <td align="center" width="48" height="48" style="width:48px;height:48px;border-radius:24px;background-color:#85B7EB;font-size:20px;color:#0c2a4a;font-weight:700;line-height:48px;font-family:Arial,sans-serif">&#x2191;</td>
                    </tr></table>
                    <p style="margin:6px 0 0;font-size:10px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.04em">Effective</p>
                  </td>
                  <td align="center" style="padding:0 8px">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
                      <td align="center" width="48" height="48" style="width:48px;height:48px;border-radius:24px;background-color:#ED93B1;font-size:20px;color:#4a0e24;font-weight:700;line-height:48px;font-family:Arial,sans-serif">&#x2665;</td>
                    </tr></table>
                    <p style="margin:6px 0 0;font-size:10px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.04em">Caring</p>
                  </td>
                  <td align="center" style="padding:0 8px">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
                      <td align="center" width="48" height="48" style="width:48px;height:48px;border-radius:24px;background-color:#EF9F27;font-size:20px;color:#3d2800;font-weight:700;line-height:48px;font-family:Arial,sans-serif">&#x26A1;</td>
                    </tr></table>
                    <p style="margin:6px 0 0;font-size:10px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.04em">Responsive</p>
                  </td>
                  <td align="center" style="padding:0 8px">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
                      <td align="center" width="48" height="48" style="width:48px;height:48px;border-radius:24px;background-color:#AFA9EC;font-size:20px;color:#211a4a;font-weight:700;line-height:48px;font-family:Arial,sans-serif">&#x2605;</td>
                    </tr></table>
                    <p style="margin:6px 0 0;font-size:10px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.04em">Well-led</p>
                  </td>
                </tr>
              <!-- Social icons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:16px auto 0 auto">
                <tr>
                  <td style="padding:0 6px">
                    <a href="https://www.facebook.com/alwaysreadyuk">
                      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABP0lEQVR4nGNkwAEYff3+45KjBfi/eRMjVndgCNDZYegA3aFMyJyBdhw2NzDhkhhIgOwWJnSBwQJgbmIipHCgAeNgDD1kMOhDcNSBlIJRB1IKRh1IKWChtoGasjIMRQEBDA66ugzSQkIMHGxscLneDRsYSufNHzgH2mprMexsbERxFKWAqlE8NSODqo5jYKBiCMqJijLoyMujiG04cYIhdfIUhrefP5NtLtVCUEZYGENs+cFDFDmOgYGKDmRjxYyM779+UWwuxa2Z+shIhvrICKLUGhUUMFy4d58k8wd9OTjoHUi1BquDrg7DvtZWFDG/5haGLadPU2TuoA/BUQdSCkYdSCkYdSClYNSBlIJB70BGBobBObrFwAAZzBz0IcjEwIB7fHggAcxNTOgCgwEgu4UJl8RAAXQ34HTQYJmGAAB43lKF+mYI7QAAAABJRU5ErkJggg==" width="40" height="40" alt="Facebook" style="display:block;border:0">
                    </a>
                  </td>
                  <td style="padding:0 6px">
                    <a href="https://www.instagram.com/alwaysreadyuk">
                      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAA/UlEQVR4nO2Z2w7DIAhAlez3Zr919v/mnkwIFScVC2l63qq9HCliLzEwxHcqXN8Kyp5j0+PQcLEYhYoC3rCWazkA12EJdgHa4IXqBP92tCZ6jB7GfQQfwVkewVle0gO++TN9UUjb8L7DZUZDjDIiKo6gZPSUM4McysF64hm53nl7XDpJzgzw8lkMaROJinOwB75lWumgItjKJa28VY0gltEqS9M5yEWqbs+Kul/q7i/I3UqXk2TFeq0i2IqiqzpY0V6rQxjMQa2SUZHkp8kDqwTxe7HbJ2or7l+oVwPcl00PlD1H/xEMgf8+bEl1AtrgAewCXIcV1IEV8vIb4gcAxmkxhbbr0wAAAABJRU5ErkJggg==" width="40" height="40" alt="Instagram" style="display:block;border:0">
                    </a>
                  </td>
                  <td style="padding:0 6px">
                    <a href="https://www.linkedin.com/company/alwaysreadyuk">
                      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABaUlEQVR4nO2ZP0vDQByG3xyCUv8UAgrNWJSudRCXri6CjnXQL+GfODnoqB9CUZB2bYrgB3AsxcnRQgedLKUBM2gvLqakZ0+5Xuod4Z4p9/slx8ObIwkXCxysre2Q15sEYd2zRnr8KPyzGAsrSuID1XKjHAivoZK4C2ELuhA5kb9OVI2lY3pxtE/QCMpiBGUxgrIYQVmEBE92yqBeDdSroeK6k3IaIl0JqiBdHwu8NcjWl7JZ3B4dolut4PXmGtVjF45tjyU4NdZVv2DPz+Hh4hzLuRwAYCGTQblUworjYG3/ADQUu2GJr8GNYhF3jQYWd/eweXqGj34fALCaz2O9UBCeL3HBl04H7uUV3nwf980mntrtQS9KVYTEBR+fW/j8Tg0Aeu/B4Hh2Zlp4vsQF/SAYGtOQSs2n/XPQCMqivWC6XnUqMIKyEN7Opg6Edc/SP0GAvz+sksiJsAUdiLsQXkMVrANXSJffEF+1cnfm6/tzhQAAAABJRU5ErkJggg==" width="40" height="40" alt="LinkedIn" style="display:block;border:0">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Legal footer -->
          <tr>
            <td style="background-color:#faf9f6;border-top:1px solid #e8e6e0;padding:16px 40px;text-align:center">
<p style="margin:0;font-size:11px;color:#6b6b6b;line-height:1.7">
                &copy; 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services<br>
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
      footerNote = opts.footerNote ?? 'You are receiving this because you signed up for the AlwaysReady blog.'
    } else if (opts.userId) {
      unsubscribeUrl = buildUnsubscribeUrl(opts.userId)
      footerNote = opts.footerNote
    }
  }

  const html = buildHtml(opts.bodyHtml, unsubscribeUrl, footerNote)

  // --- Build headers ---
  const headers: Record<string, string> = {}
  if (unsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  // --- Send ---
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from    = process.env.RESEND_FROM_ADDRESS ?? 'AlwaysReady <onboarding@resend.dev>'
    const replyTo = process.env.RESEND_REPLY_TO ?? 'support@alwaysready.uk'

    const { error } = await resend.emails.send({
      from,
      to:       opts.to,
      subject:  opts.subject,
      html,
      replyTo,
      headers:  Object.keys(headers).length ? headers : undefined,
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
