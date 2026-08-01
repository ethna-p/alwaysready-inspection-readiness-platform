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

  const blogOptIn =
    payload['blog_opt_in'] === 'yes' ||
    payload['blog_opt_in'] === 'on'  ||
    data['blog_opt_in']    === 'yes' ||
    data['blog_opt_in']    === 'on'

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
  const { error: ticketError } = await supabase
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

  // ── Blog opt-in ───────────────────────────────────────────────────────────
  if (blogOptIn) {
    const { error: subError } = await supabase
      .from('blog_subscribers')
      .upsert(
        {
          email,
          full_name:       fullName || null,
          source:          'contact_form',
          subscribed_at:   new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: 'email', ignoreDuplicates: true },
      )

    if (subError) {
      console.error('[inbound-contact] blog subscriber upsert error:', subError.message)
    } else {
      await sendEmail({
        to:      email,
        subject: "You're subscribed to the AlwaysReady blog",
        type:    'transactional',
        bodyHtml: `
          <p>Hi ${displayName},</p>
          <p>
            Thanks for subscribing to the AlwaysReady blog. We cover CQC inspection readiness,
            compliance, and governance for care providers. New posts will arrive straight to your inbox.
          </p>
          <p>
            You can browse everything we've published so far at
            <a href="https://alwaysready.uk/blog" style="color:#014D4E">alwaysready.uk/blog</a>.
          </p>
        `,
      }).catch(err => {
        console.error('[inbound-contact] blog welcome email failed:', err)
      })
    }
  }

  // ── Notify AJ ────────────────────────────────────────────────────────────
  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (superadminEmail) {
    await sendEmail({
      to:      superadminEmail,
      subject: `New website enquiry: ${subject}`,
      type:    'transactional',
      bodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a">A new enquiry has arrived via the website contact form.</p>
        <table style="border-collapse:collapse;font-size:14px;color:#1a1a1a">
          <tr><td style="padding:4px 16px 4px 0;color:#555">Name</td><td style="padding:4px 0">${fullName}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Email</td><td style="padding:4px 0">${email}</td></tr>
          ${company ? `<tr><td style="padding:4px 16px 4px 0;color:#555">Company</td><td style="padding:4px 0">${company}</td></tr>` : ''}
          <tr><td style="padding:4px 16px 4px 0;color:#555">Subject</td><td style="padding:4px 0"><strong>${subject}</strong></td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:14px;color:#555;white-space:pre-wrap">${message}</p>
      `,
    })
  }

  // ── Send auto-responder ───────────────────────────────────────────────────
  await sendEmail({
    to: email,
    subject: "We've received your message",
    type: 'transactional',
    bodyHtml: `
      <p>Hi ${displayName},</p>
      <p>Thank you for getting in touch. We've received your message and will get back to you shortly.</p>
      <p>While you wait, you may find an answer straight away. Our FAQs cover
        <a href="https://alwaysready.uk/waitlist/" style="color:#014D4E">how AlwaysReady works</a>
        and
        <a href="https://alwaysready.uk/pricing/" style="color:#014D4E">pricing</a>.
        If you'd prefer to ask a question in your own words, our platform assistant is available
        on every page of <a href="https://alwaysready.uk" style="color:#014D4E">alwaysready.uk</a>
        — look for the chat icon in the bottom-right corner.
      </p>
    `,
  })

  return NextResponse.json({ received: true }, { status: 200 })
}
