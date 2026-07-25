/**
 * POST /api/contact-inbound
 *
 * Receives submissions from the Contact Us form on www.alwaysready.uk
 * and creates a support ticket in the superadmin queue.
 *
 * This endpoint is public (no auth required). CORS is restricted to
 * the AlwaysReady marketing domain.
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
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400, headers })
  }

  const { name, email, subject, message, blogSignup } = body as Record<string, unknown>

  // ── Validate ────────────────────────────────────────────────────────────────
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400, headers })
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400, headers })
  }
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return NextResponse.json({ error: 'Subject is required.' }, { status: 400, headers })
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400, headers })
  }

  const cleanName    = name.trim()
  const cleanEmail   = email.trim().toLowerCase()
  const cleanSubject = subject.trim()
  const cleanMessage = message.trim()
  const wantsBlog    = blogSignup === true || blogSignup === 'true'

  const supabase = createAdminClient()

  // ── Create ticket ────────────────────────────────────────────────────────────
  const { error } = await supabase
    .from('support_tickets')
    .insert({
      organisation_id: null,
      submitted_by:    null,
      staff_initiated: false,
      source:          'website',
      external_name:   cleanName,
      external_email:  cleanEmail,
      subject:         cleanSubject,
      message:         cleanMessage,
      status:          'open',
    })

  if (error) {
    console.error('[contact-inbound] insert error:', error.message)
    return NextResponse.json({ error: 'Could not submit your enquiry. Please try again.' }, { status: 500, headers })
  }

  // ── Blog subscriber signup (if checkbox ticked) ───────────────────────────
  if (wantsBlog) {
    const { error: subError } = await supabase
      .from('blog_subscribers')
      .upsert(
        {
          email:            cleanEmail,
          full_name:        cleanName,
          source:           'contact_form',
          unsubscribed_at:  null,   // re-activate if previously unsubscribed
        },
        { onConflict: 'email' }
      )
    if (subError) {
      console.error('[contact-inbound] blog subscriber upsert error:', subError.message)
      // Non-fatal — ticket was already created successfully
    }
  }

  // ── Autoresponder ────────────────────────────────────────────────────────────
  await sendEmail({
    to:      cleanEmail,
    subject: "We've got your message — AlwaysReady",
    type:    'transactional',
    bodyHtml: `
      <p>Hi ${cleanName},</p>
      <p>Thanks for getting in touch. We've received your message and will get back to you as soon as we can.</p>
      <p>In the meantime, you might find a quick answer on our website — our chatbot and FAQ section cover the most common questions about AlwaysReady and how it works.</p>
      <p><a href="https://alwaysready.uk" style="color:#014D4E;font-weight:600;">Visit alwaysready.uk →</a></p>
      <p>Talk soon,<br>The AlwaysReady Team</p>
    `,
  }).catch(err => {
    console.error('[contact-inbound] autoresponder failed:', err)
  })

  return NextResponse.json({ success: true }, { status: 200, headers })
}
