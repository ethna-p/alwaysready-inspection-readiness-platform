/**
 * POST /api/blog-subscribe
 *
 * Public webhook called by the alwaysready.uk marketing website when
 * someone signs up for blog updates. Stores the subscriber in blog_subscribers.
 *
 * Expected body: { email: string, name?: string }
 * Returns:       { success: true } | { error: string }
 *
 * CORS: allows requests from www.alwaysready.uk (and plain alwaysready.uk).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const ALLOWED_ORIGINS = [
  'https://www.alwaysready.uk',
  'https://alwaysready.uk',
]

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  let body: { email?: unknown; name?: unknown }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400, headers })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null
  const name  = typeof body.name  === 'string' ? body.name.trim()              : null

  // Basic email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400, headers })
  }

  try {
    const supabase = createAdminClient()

    // Upsert: if they re-subscribe after unsubscribing, clear unsubscribed_at
    const { error } = await supabase
      .from('blog_subscribers')
      .upsert(
        {
          email,
          full_name: name ?? null,
          source: 'website_form',
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: 'email' },
      )

    if (error) {
      console.error('[blog-subscribe] Supabase error:', error)
      return NextResponse.json({ error: 'Could not save your subscription.' }, { status: 500, headers })
    }

    const displayName = name || 'there'

    // ── Welcome email to subscriber ─────────────────────────────────────────
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
      `,
    }).catch(err => {
      console.error('[blog-subscribe] welcome email failed:', err)
    })

    // ── Notify AJ ──────────────────────────────────────────────────────────
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
        console.error('[blog-subscribe] AJ notification failed:', err)
      })
    }

    return NextResponse.json({ success: true }, { status: 200, headers })
  } catch (err) {
    console.error('[blog-subscribe] unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500, headers })
  }
}
