/**
 * POST /api/inbound-contact
 *
 * Receives Netlify form webhook submissions from alwaysready.uk/contact.
 * Netlify posts application/x-www-form-urlencoded with all form fields.
 *
 * On receipt:
 *   1. Creates a support ticket with source='website_contact'
 *   2. Sends auto-responder email to the submitter via Resend
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

  const firstName   = body.get('first-name')?.trim()  ?? body.get('firstName')?.trim()  ?? ''
  const lastName    = body.get('last-name')?.trim()   ?? body.get('lastName')?.trim()   ?? ''
  const email       = body.get('email')?.trim()       ?? ''
  const company     = body.get('company-name')?.trim() ?? body.get('company')?.trim()   ?? ''
  const subject     = body.get('subject')?.trim()     ?? '(No subject)'
  const message     = body.get('message')?.trim()     ?? ''

  if (!firstName || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const fullName = lastName ? `${firstName} ${lastName}` : firstName

  const supabase = createAdminClient()

  // ── Create support ticket ─────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: ticketError } = await (supabase as any)
    .from('support_tickets')
    .insert({
      subject,
      message: company
        ? `From: ${fullName} (${company})\n\n${message}`
        : `From: ${fullName}\n\n${message}`,
      status:         'open',
      source:         'website_contact',
      external_email: email,
      external_name:  fullName,
    })

  if (ticketError) {
    console.error('[inbound-contact] ticket insert error:', ticketError.message)
  }

  // ── Send auto-responder ───────────────────────────────────────────────────
  await sendEmail({
    to: email,
    subject: "We've received your message",
    type: 'transactional',
    bodyHtml: `
      <p>Hi ${firstName},</p>
      <p>Thank you for getting in touch. We've received your message and will get back to you shortly.</p>
      <p style="margin-top:32px">
        Warm regards,<br>
        <strong>Ethna Parker PhD</strong><br>
        Founder, AlwaysReady
      </p>
    `,
  })

  return NextResponse.json({ received: true }, { status: 200 })
}
