/**
 * POST /api/inbound-email
 *
 * Receives inbound emails forwarded by the Cloudflare Email Worker.
 * The Worker POSTs JSON to this endpoint for every email received at
 * any @alwaysready.uk address.
 *
 * Payload shape:
 * {
 *   from:     string,        // sender email address
 *   fromName: string,        // sender display name (may be empty)
 *   to:       string,        // recipient address (e.g. support@alwaysready.uk)
 *   subject:  string,        // full email subject
 *   text:     string,        // plain-text body
 *   html:     string | null, // HTML body (optional)
 * }
 *
 * Security: requests must include the header:
 *   X-Inbound-Secret: <INBOUND_EMAIL_SECRET env var>
 *
 * On receipt:
 *   1. If subject contains [AR-XXXX], append as a reply to that ticket.
 *   2. Otherwise, create a new ticket with source='email'.
 *   3. In both cases, generate an AI draft reply and store on the ticket.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { generateSupportDraft, type TicketThread } from '@/lib/ai-draft'

// Parse a ticket reference like [AR-0001] from a subject line
function extractReference(subject: string): string | null {
  const match = subject.match(/\[([A-Z]+-\d+)\]/)
  return match ? match[1] : null
}

// Decode quoted-printable encoding.
// Handles soft line breaks (= at end of line) and multi-byte UTF-8 sequences
// like curly quotes (=E2=80=99) which must be decoded together, not byte-by-byte.
function decodeQuotedPrintable(text: string): string {
  return text
    .replace(/=\r\n/g, '')  // soft line break CRLF
    .replace(/=\n/g, '')    // soft line break LF
    .replace(/=$/, '')      // trailing soft line break with no following newline
    .replace(/(=([0-9A-Fa-f]{2}))+/g, (match) => {
      const bytes = (match.match(/=([0-9A-Fa-f]{2})/g) ?? [])
        .map(s => parseInt(s.slice(1), 16))
      try {
        return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
      } catch {
        return match // leave as-is if decode fails
      }
    })
}

// Returns true for automated/transactional senders that should be silently dropped.
// Covers no-reply patterns, postmaster, mailer-daemon, and known service domains.
function isAutomatedSender(from: string): boolean {
  const lower = from.toLowerCase()

  // Address-part patterns (before the @)
  const automatedPrefixes = [
    'noreply', 'no-reply', 'no_reply', 'donotreply', 'do-not-reply',
    'do_not_reply', 'postmaster', 'mailer-daemon', 'mailerdeamon',
    'automated', 'notifications', 'bounce', 'bounces', 'system',
    'daemon', 'root',
  ]
  const localPart = lower.split('@')[0] ?? ''
  if (automatedPrefixes.some(p => localPart === p || localPart.startsWith(p + '+') || localPart.startsWith(p + '.') || localPart.startsWith(p + '-'))) {
    return true
  }

  // Known transactional/service sending domains
  const automatedDomains = [
    'stripe.com',
    'mail.stripe.com',
    'salesforce.com',
    'bnc.salesforce.com',
    'exacttarget.com',
    'mailchimp.com',
    'sendgrid.net',
    'amazonses.com',
    'postmarkapp.com',
    'mailgun.org',
    'mandrill.com',
    'sparkpostmail.com',
    'bounces.google.com',
    'bounce.google.com',
    'accounts.google.com',
    'notifications.google.com',
    'notify.microsoft.com',
    'github.com',
    'githubnoreply.com',
    'intercom.io',
    'zendesk.com',
    'freshdesk.com',
    'hubspot.com',
    'paypal.com',
    'ebay.com',
    'apple.com',
    'linkedin.com',
    'twitter.com',
    'facebook.com',
    'instagram.com',
    // Supabase auth emails (password resets, magic links, confirmations)
    'supabase.io',
    'mail.app.supabase.io',
    'pm-bounces.mail.app.supabase.io',
    // DMARC aggregate report senders
    'dmarc.postmarkapp.com',
    'dmarc.yahoo.com',
    'dmarc.microsoft.com',
    'dmarc-support.google.com',
  ]
  const domain = lower.split('@')[1] ?? ''
  if (automatedDomains.some(d => domain === d || domain.endsWith('.' + d))) {
    return true
  }

  return false
}

// Strip quoted reply text (lines starting with ">") to get just the new message
function stripQuotedText(text: string): string {
  return text
    .split('\n')
    .filter(line => !line.trimStart().startsWith('>'))
    .join('\n')
    .trim()
}

// Generate and persist an AI draft for a ticket — non-fatal
async function refreshDraft(ticketId: string, thread: TicketThread): Promise<void> {
  try {
    const draft = await generateSupportDraft(thread)
    const supabase = createAdminClient()
    await supabase
      .from('support_tickets')
      .update({ draft_reply: draft })
      .eq('id', ticketId)
  } catch (err) {
    console.error('[inbound-email] AI draft generation failed (non-fatal):', err)
  }
}

export async function POST(req: NextRequest) {
  // ── Authenticate ──────────────────────────────────────────────────────────
  const secret = process.env.INBOUND_EMAIL_SECRET
  const provided = req.headers.get('x-inbound-secret')
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // ── Parse payload ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: Record<string, any>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const from     = (payload.from     as string | undefined)?.trim() ?? ''
  const fromName = (payload.fromName as string | undefined)?.trim() ?? ''
  const subject  = (payload.subject  as string | undefined)?.trim() ?? '(No subject)'
  const rawText  = (payload.text     as string | undefined) ?? ''
  const text     = decodeQuotedPrintable(rawText).trim()

  if (!from) {
    return NextResponse.json({ error: 'Missing from address' }, { status: 400 })
  }

  // Drop automated/transactional emails silently — no ticket, no auto-reply
  if (isAutomatedSender(from)) {
    console.log(`[inbound-email] Dropped automated sender: ${from}`)
    return NextResponse.json({ action: 'ignored', reason: 'automated sender' }, { status: 200 })
  }

  const supabase = createAdminClient()
  const reference = extractReference(subject)
  const cleanBody = stripQuotedText(text) || text

  // ── Route: thread onto existing ticket ───────────────────────────────────
  if (reference) {
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, subject, message, status, external_name')
      .eq('reference', reference)
      .single()

    if (ticket) {
      // Reopen if resolved
      if (ticket.status === 'resolved') {
        await supabase
          .from('support_tickets')
          .update({ status: 'open' })
          .eq('id', ticket.id)
      }

      // Append reply
      await supabase
        .from('support_ticket_replies')
        .insert({
          ticket_id:      ticket.id,
          sent_by:        null,
          message:        cleanBody,
          is_staff_reply: false,
        })

      // Fetch full thread for draft generation
      const { data: allReplies } = await supabase
        .from('support_ticket_replies')
        .select('message, is_staff_reply, created_at')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true })

      const thread: TicketThread = {
        subject:         ticket.subject,
        senderName:      ticket.external_name ?? (fromName || null),
        originalMessage: ticket.message,
        replies: (allReplies ?? []).map(r => ({
          role:      r.is_staff_reply ? 'staff' : 'customer',
          message:   r.message,
          createdAt: new Date(r.created_at).toLocaleDateString('en-GB'),
        })),
      }

      await refreshDraft(ticket.id, thread)

      return NextResponse.json({ action: 'threaded', ticketId: ticket.id }, { status: 200 })
    }
    // Reference not found — fall through to create new ticket
  }

  // ── Route: create new ticket ──────────────────────────────────────────────
  const displayName = fromName || from
  const cleanSubject = subject.replace(/\s*\[[A-Z]+-\d+\]\s*/g, '').trim() || subject

  const { data: newTicket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert({
      subject:        cleanSubject,
      message:        cleanBody,
      status:         'open',
      source:         'email',
      external_email: from,
      external_name:  displayName,
    })
    .select('id')
    .single()

  if (ticketError || !newTicket) {
    console.error('[inbound-email] ticket insert error:', ticketError?.message)
    return NextResponse.json({ error: ticketError?.message ?? 'insert failed' }, { status: 500 })
  }

  // Generate AI draft for new ticket
  const thread: TicketThread = {
    subject:         cleanSubject,
    senderName:      displayName || null,
    originalMessage: cleanBody,
    replies:         [],
  }
  await refreshDraft(newTicket.id, thread)

  // Notify AJ of new inbound email ticket
  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (superadminEmail) {
    await sendEmail({
      to:      superadminEmail,
      subject: `New inbound email: ${cleanSubject}`,
      type:    'transactional',
      bodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a">A new email has arrived at support@alwaysready.uk and a support ticket has been created.</p>
        <table style="border-collapse:collapse;font-size:14px;color:#1a1a1a">
          <tr><td style="padding:4px 16px 4px 0;color:#555">From</td><td style="padding:4px 0">${displayName} &lt;${from}&gt;</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Subject</td><td style="padding:4px 0"><strong>${cleanSubject}</strong></td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:14px;color:#555;white-space:pre-wrap">${cleanBody.slice(0, 500)}${cleanBody.length > 500 ? '…' : ''}</p>
      `,
    })
  }

  // Auto-responder for new tickets
  const firstName = fromName.split(' ')[0] || 'there'
  await sendEmail({
    to:      from,
    subject: "We've received your message",
    type:    'transactional',
    bodyHtml: `
      <p>Hi ${firstName},</p>
      <p>Thank you for getting in touch. We've received your message and will get back to you shortly.</p>
    `,
  })

  return NextResponse.json({ action: 'created', ticketId: newTicket.id }, { status: 200 })
}
