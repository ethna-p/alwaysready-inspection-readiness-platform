/**
 * POST /api/email-inbound
 *
 * Receives inbound email events from Resend (email.received) and creates
 * a support ticket in the superadmin queue. Used to track emails sent to
 * sales@alwaysready.uk (forwarded via Gmail → Resend inbound domain).
 *
 * Security: verifies the Resend webhook signature using RESEND_WEBHOOK_SECRET.
 * Only processes email.received events addressed to sales@alwaysready.uk.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

/** Parse "Display Name <email@domain.com>" into { name, email } */
function parseFrom(from: string): { name: string | null; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) {
    return { name: match[1].trim() || null, email: match[2].trim().toLowerCase() }
  }
  return { name: null, email: from.trim().toLowerCase() }
}

export async function POST(req: NextRequest) {
  // ── Verify webhook signature ───────────────────────────────────────────────
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[email-inbound] RESEND_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 })
  }

  const rawBody = await req.text()
  let event: Record<string, unknown>

  try {
    resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id:        req.headers.get('svix-id')        ?? '',
        timestamp: req.headers.get('svix-timestamp') ?? '',
        signature: req.headers.get('svix-signature') ?? '',
      },
      webhookSecret,
    })
    event = JSON.parse(rawBody)
  } catch (err) {
    console.error('[email-inbound] webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 })
  }

  // ── Only handle email.received ─────────────────────────────────────────────
  if (event.type !== 'email.received') {
    return NextResponse.json({ skipped: true }, { status: 200 })
  }

  const data = event.data as {
    email_id: string
    from: string
    to: string[]
    subject: string
  }

  // ── Only process emails to sales@ ─────────────────────────────────────────
  const toAddresses = (data.to ?? []).map((a: string) => a.toLowerCase())
  const isSales = toAddresses.some(a =>
    a.includes('sales@alwaysready.uk') || a.includes('sales@')
  )
  if (!isSales) {
    return NextResponse.json({ skipped: true }, { status: 200 })
  }

  // ── Fetch email body from Resend ───────────────────────────────────────────
  let emailBody = ''
  try {
    const response = await fetch(
      `https://api.resend.com/emails/receiving/${data.email_id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
      }
    )
    if (response.ok) {
      const emailData = await response.json() as { text?: string; html?: string }
      // Prefer plain text; fall back to stripping HTML tags
      emailBody = emailData.text?.trim()
        ?? emailData.html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        ?? ''
    }
  } catch (err) {
    console.error('[email-inbound] failed to fetch email body:', err)
    // Non-fatal — we still create the ticket with subject only
  }

  // ── Parse sender ───────────────────────────────────────────────────────────
  const { name: senderName, email: senderEmail } = parseFrom(data.from ?? '')

  // ── Create support ticket ──────────────────────────────────────────────────
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('support_tickets')
    .insert({
      organisation_id: null,
      submitted_by:    null,
      staff_initiated: false,
      source:          'email',
      external_name:   senderName,
      external_email:  senderEmail,
      subject:         data.subject ?? '(no subject)',
      message:         emailBody || '(email body not available)',
      status:          'open',
    })

  if (error) {
    console.error('[email-inbound] ticket insert error:', error.message)
    return NextResponse.json({ error: 'Could not create ticket.' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
