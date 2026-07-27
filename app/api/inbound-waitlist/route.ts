/**
 * POST /api/inbound-waitlist
 *
 * Receives Netlify form webhook submissions from alwaysready.uk/waitlist.
 * Netlify posts application/x-www-form-urlencoded with all form fields.
 *
 * On receipt:
 *   1. Saves the lead to waitlist_leads (warm leads — higher priority)
 *   2. If marketing opt-in, also adds to blog_subscribers
 *   3. Sends auto-responder email to the submitter via Resend
 *
 * Security: requests must include the NETLIFY_WEBHOOK_SECRET header value
 * matching the NETLIFY_WEBHOOK_SECRET environment variable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  // ── Secret verification ───────────────────────────────────────────────────
  const secret = process.env.NETLIFY_WEBHOOK_SECRET
  if (secret) {
    const incoming = req.headers.get('x-webhook-secret')
    if (incoming !== secret) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
  }

  // ── Parse form fields ─────────────────────────────────────────────────────
  let body: URLSearchParams
  try {
    const text = await req.text()
    body = new URLSearchParams(text)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const firstName      = body.get('first-name')?.trim() ?? body.get('firstName')?.trim() ?? ''
  const email          = body.get('email')?.trim() ?? ''
  const marketingOptIn = body.get('newsletter') === 'on' || body.get('newsletter') === 'true'

  if (!firstName || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── Save waitlist lead ────────────────────────────────────────────────────
  const { error: leadError } = await supabase
    .from('waitlist_leads')
    .upsert(
      { first_name: firstName, email, marketing_opt_in: marketingOptIn },
      { onConflict: 'email', ignoreDuplicates: false }
    )

  if (leadError) {
    console.error('[inbound-waitlist] lead insert error:', leadError.message)
    // Don't fail the webhook — Netlify will retry on 5xx
  }

  // ── Add to blog_subscribers if opted in ───────────────────────────────────
  if (marketingOptIn) {
    const { error: subError } = await supabase
      .from('blog_subscribers')
      .upsert(
        { email, full_name: firstName, source: 'waitlist_form' },
        { onConflict: 'email', ignoreDuplicates: true }
      )

    if (subError) {
      console.error('[inbound-waitlist] subscriber insert error:', subError.message)
    }
  }

  // ── Send auto-responder ───────────────────────────────────────────────────
  await sendEmail({
    to: email,
    subject: "You're on the AlwaysReady waitlist",
    type: 'transactional',
    bodyHtml: `
      <p>Hi ${firstName},</p>
      <p>Thank you for joining the AlwaysReady waitlist — you're in good company.</p>
      <p>We're building AlwaysReady around the new CQC Adult Social Care Assessment Framework,
         and we'll open to new customers as soon as the framework is published.
         When that happens, you'll be the first to know.</p>
      <p>In the meantime, if you have any questions about the platform, feel free to reply
         to this email or visit
         <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a>.</p>
      <p style="margin-top:32px">
        Warm regards,<br>
        <strong>Ethna Parker PhD</strong><br>
        Founder, AlwaysReady
      </p>
    `,
  })

  return NextResponse.json({ received: true }, { status: 200 })
}
