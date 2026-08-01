/**
 * POST /api/inbound-blog-signup
 *
 * Receives Netlify form webhook submissions from the alwaysready.uk blog
 * signup form (name="blog-signup", data-netlify="true").
 *
 * Netlify posts application/x-www-form-urlencoded or JSON with the payload
 * wrapped as: { payload: "<json string>" } or a direct JSON object.
 *
 * On receipt:
 *   1. Upserts the subscriber into blog_subscribers
 *   2. Sends a welcome / confirmation email to the subscriber
 *   3. Notifies AJ (optional, non-fatal)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  // ── Parse Netlify payload ─────────────────────────────────────────────────
  // Netlify can send either JSON or form-encoded with a nested `payload` key.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: Record<string, any>
  try {
    const text = await req.text()
    try {
      payload = JSON.parse(text)
    } catch {
      const params = new URLSearchParams(text)
      const raw = params.get('payload')
      payload = raw ? JSON.parse(raw) : Object.fromEntries(params.entries())
    }
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = payload.data ?? {}

  const email =
    (payload.email         as string | undefined)?.trim().toLowerCase() ||
    (data['email']         as string | undefined)?.trim().toLowerCase() ||
    (data['email-address'] as string | undefined)?.trim().toLowerCase() ||
    ''

  const name =
    (payload.first_name as string | undefined)?.trim() ||
    (payload.name       as string | undefined)?.trim() ||
    (data['name']       as string | undefined)?.trim() ||
    (data['full-name']  as string | undefined)?.trim() ||
    ''

  if (!email) {
    console.error('[inbound-blog-signup] missing email in payload:', JSON.stringify(payload))
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  const displayName = name || 'there'

  const supabase = createAdminClient()

  // ── Upsert into blog_subscribers ─────────────────────────────────────────
  const { error: dbError } = await supabase
    .from('blog_subscribers')
    .upsert(
      {
        email,
        full_name:       name || null,
        source:          'website_form',
        subscribed_at:   new Date().toISOString(),
        unsubscribed_at: null,
      },
      { onConflict: 'email' },
    )

  if (dbError) {
    console.error('[inbound-blog-signup] Supabase error:', dbError.message)
    // Still return 200 so Netlify doesn't retry indefinitely — log and move on
  }

  // ── Send welcome email to subscriber ─────────────────────────────────────
  await sendEmail({
    to:      email,
    subject: "You're subscribed to the AlwaysReady blog",
    type:    'transactional',
    bodyHtml: `
      <p>Hi ${displayName},</p>

      <p>
        Thanks for subscribing to the AlwaysReady blog. We publish practical
        guides on CQC inspection readiness, care quality, and running a
        well-governed service — and you'll get new posts straight to your inbox.
      </p>

      <p>
        In the meantime, you can browse everything we've published so far at
        <a href="https://alwaysready.uk/blog" style="color:#014D4E">alwaysready.uk/blog</a>.
      </p>

      <p style="margin-top:32px">
        Warm regards,<br>
        <strong>Ethna Parker PhD</strong><br>
        Founder, AlwaysReady
      </p>
    `,
  }).catch(err => {
    console.error('[inbound-blog-signup] welcome email failed:', err)
  })

  // ── Notify AJ ────────────────────────────────────────────────────────────
  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (superadminEmail) {
    await sendEmail({
      to:      superadminEmail,
      subject: `New blog subscriber: ${email}`,
      type:    'transactional',
      bodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a">
          A new subscriber signed up via the website blog signup form.
        </p>
        <table style="border-collapse:collapse;font-size:14px;color:#1a1a1a">
          ${name ? `<tr><td style="padding:4px 16px 4px 0;color:#555">Name</td><td style="padding:4px 0">${name}</td></tr>` : ''}
          <tr><td style="padding:4px 16px 4px 0;color:#555">Email</td><td style="padding:4px 0">${email}</td></tr>
        </table>
      `,
    }).catch(err => {
      console.error('[inbound-blog-signup] AJ notification failed:', err)
    })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
