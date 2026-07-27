/**
 * POST /api/inbound-contact
 *
 * Receives Netlify form webhook submissions from alwaysready.uk/contact.
 * Netlify posts application/json with the form submission payload.
 *
 * Payload shape (simplified):
 * {
 *   email: string,
 *   first_name: string,
 *   last_name: string | null,
 *   data: { [fieldName: string]: string },
 *   form_name: string,
 * }
 *
 * On receipt:
 *   1. Creates a support ticket with source='website_contact'
 *   2. Sends auto-responder email to the submitter via Resend
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  // ── Parse Netlify JSON payload ────────────────────────────────────────────
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

  const firstName =
    (payload.first_name    as string | undefined)?.trim() ||
    (payload['first-name'] as string | undefined)?.trim() ||
    (data['first-name']    as string | undefined)?.trim() ||
    (data['firstName']     as string | undefined)?.trim() ||
    (payload.name          as string | undefined)?.trim() ||
    ''

  const lastName =
    (payload.last_name    as string | undefined)?.trim() ||
    (payload['last-name'] as string | undefined)?.trim() ||
    (data['last-name']    as string | undefined)?.trim() ||
    (data['lastName']     as string | undefined)?.trim() ||
    ''

  const email =
    (payload.email            as string | undefined)?.trim() ||
    (data['email']            as string | undefined)?.trim() ||
    (data['email-address']    as string | undefined)?.trim() ||
    (payload['email-address'] as string | undefined)?.trim() ||
    ''

  const company =
    (data['company-name']    as string | undefined)?.trim() ||
    (data['company']         as string | undefined)?.trim() ||
    (payload['company-name'] as string | undefined)?.trim() ||
    ''

  const subject =
    (data['subject']    as string | undefined)?.trim() ||
    (payload['subject'] as string | undefined)?.trim() ||
    '(No subject)'

  const message =
    (data['message']    as string | undefined)?.trim() ||
    (payload['message'] as string | undefined)?.trim() ||
    ''

  if (!email) {
    console.error('[inbound-contact] missing email in payload:', JSON.stringify(payload))
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  const fullName = lastName
    ? `${firstName} ${lastName}`.trim()
    : (firstName || email)

  const displayName = firstName || 'there'

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
      <p>Hi ${displayName},</p>
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
