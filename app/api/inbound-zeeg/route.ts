/**
 * POST /api/inbound-zeeg
 *
 * Receives webhook events from Zeeg when a demo is booked or cancelled.
 * Verified via the Token header set when the subscription was created.
 *
 * Events handled:
 *   invitee.scheduled  — new booking or reschedule
 *   invitee.cancelled  — booking cancelled
 *
 * On invitee.scheduled:
 *   1. Upserts into zeeg_bookings (invitee_uuid is the unique key)
 *   2. Sends a notification email to AJ with booker details
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const ZEEG_WEBHOOK_TOKEN = process.env.ZEEG_WEBHOOK_TOKEN ?? ''

/** Derive demo_type from event duration (minutes). */
function demoTypeFromDuration(duration: number): string {
  return duration <= 15 ? '15min' : '30min'
}

export async function POST(req: NextRequest) {
  // ── Token verification ────────────────────────────────────────────────────
  const token = req.headers.get('Token') ?? req.headers.get('token') ?? ''
  if (!ZEEG_WEBHOOK_TOKEN || token !== ZEEG_WEBHOOK_TOKEN) {
    console.warn('[inbound-zeeg] invalid token')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = payload.event as string

  // ── Handle scheduled (new or rescheduled) ────────────────────────────────
  if (event === 'invitee.scheduled') {
    const inviteeUuid  = (payload.inviteeUuid  as string) ?? ''
    const eventUuid    = (payload.eventUuid    as string) ?? ''
    const email        = (payload.inviteeEmail as string) ?? ''
    const name         = (payload.inviteeName  as string) ?? null
    const duration     = (payload.duration     as number) ?? 30
    const startAt      = (payload.startAt      as string) ?? new Date().toISOString()
    const demoType     = demoTypeFromDuration(duration)

    if (!inviteeUuid || !email) {
      console.error('[inbound-zeeg] missing required fields', { inviteeUuid, email })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Upsert — handles reschedules where invitee_uuid stays the same
    const { error: upsertError } = await supabase
      .from('zeeg_bookings')
      .upsert(
        {
          invitee_uuid:  inviteeUuid,
          event_uuid:    eventUuid,
          invitee_email: email,
          invitee_name:  name,
          demo_type:     demoType,
          booked_at:     startAt,
          cancelled:     false,
          raw_payload:   payload,
        },
        { onConflict: 'invitee_uuid' }
      )

    if (upsertError) {
      console.error('[inbound-zeeg] upsert error:', upsertError.message)
    }

    // Notify AJ
    const demoLabel = demoType === '15min'
      ? '15-minute Mock Inspection module demo'
      : '30-minute full platform demo'

    const bookedDate = new Date(startAt).toLocaleString('en-GB', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Europe/London',
    })

    const ajEmail = process.env.SUPERADMIN_EMAIL ?? 'hello@alwaysready.uk'
    await sendEmail({
      to: ajEmail,
      subject: `Demo booked — ${name ?? email}`,
      type: 'transactional',
      bodyHtml: `
        <p>A demo has been booked via Zeeg.</p>
        <table style="border-collapse:collapse;font-size:14px;margin-top:12px;">
          <tr>
            <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Name</td>
            <td style="padding:6px 0;">${name ?? '—'}</td>
          </tr>
          <tr>
            <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Email</td>
            <td style="padding:6px 0;"><a href="mailto:${email}" style="color:#014D4E;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Demo type</td>
            <td style="padding:6px 0;">${demoLabel}</td>
          </tr>
          <tr>
            <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Booked for</td>
            <td style="padding:6px 0;">${bookedDate}</td>
          </tr>
        </table>
        <p style="margin-top:16px;font-size:13px;color:#888;">
          View all bookings in the
          <a href="https://portal.alwaysready.uk/superadmin/leads" style="color:#014D4E;">superadmin Leads page</a>.
        </p>
      `,
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  }

  // ── Handle cancellation ───────────────────────────────────────────────────
  if (event === 'invitee.cancelled') {
    const inviteeUuid = (payload.inviteeUuid as string) ?? ''
    if (!inviteeUuid) {
      return NextResponse.json({ error: 'Missing inviteeUuid' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('zeeg_bookings')
      .update({ cancelled: true, raw_payload: payload })
      .eq('invitee_uuid', inviteeUuid)

    if (error) {
      console.error('[inbound-zeeg] cancel update error:', error.message)
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  }

  // ── Ignore all other event types ─────────────────────────────────────────
  return NextResponse.json({ ok: true, ignored: true }, { status: 200 })
}
