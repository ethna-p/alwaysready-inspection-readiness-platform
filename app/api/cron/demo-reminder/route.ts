/**
 * GET /api/cron/demo-reminder
 *
 * Nightly cron (19:00 UTC = 20:00 BST) that checks for demos booked
 * the following day and sends a summary email to hello@alwaysready.uk.
 *
 * Sends nothing if no demos are scheduled tomorrow.
 *
 * Protected by CRON_SECRET (Vercel sends this automatically for registered crons).
 */
import 'server-only'
import { NextResponse }       from 'next/server'
import { createAdminClient }  from '@/lib/supabase/admin'
import { sendEmail }          from '@/lib/email'
import { verifyCronSecret }   from '@/lib/utils/cron'

const NOTIFY_EMAIL = 'hello@alwaysready.uk'

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour:   '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  })
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
    timeZone: 'Europe/London',
  })
}

function demoLabel(demoType: string): string {
  if (demoType === '15min') return '15-minute demo'
  if (demoType === '30min') return '30-minute demo'
  return demoType
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Calculate tomorrow's date range in UTC
  const now       = new Date()
  const tomorrow  = new Date(now)
  tomorrow.setUTCDate(now.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)

  const dayAfter  = new Date(tomorrow)
  dayAfter.setUTCDate(tomorrow.getUTCDate() + 1)

  const { data: bookings, error } = await supabase
    .from('zeeg_bookings')
    .select('invitee_name, invitee_email, demo_type, booked_at')
    .eq('cancelled', false)
    .gte('scheduled_at', tomorrow.toISOString())
    .lt('scheduled_at',  dayAfter.toISOString())
    .order('booked_at', { ascending: true })

  if (error) {
    console.error('[demo-reminder] Failed to fetch bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  if (!bookings || bookings.length === 0) {
    console.log('[demo-reminder] No demos tomorrow, skipping email.')
    return NextResponse.json({ ok: true, sent: false, reason: 'no demos tomorrow' })
  }

  const dateLabel  = formatDate(bookings[0].booked_at)
  const demoWord   = bookings.length === 1 ? 'demo' : 'demos'

  const rows = bookings.map(b => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:15px;font-weight:600;color:#111111;white-space:nowrap">
        ${formatTime(b.booked_at)}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:15px;color:#111111">
        ${b.invitee_name ?? '<em style="color:#6b7280">Name not provided</em>'}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#4b5563">
        ${b.invitee_email}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;white-space:nowrap">
        ${demoLabel(b.demo_type)}
      </td>
    </tr>
  `).join('')

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">
      ${bookings.length} ${demoWord} tomorrow
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#4b5563">${dateLabel}</p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e5e7eb">Time</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e5e7eb">Name</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e5e7eb">Email</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e5e7eb">Type</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
      Have a great demo${bookings.length > 1 ? 's' : ''}!
    </p>
  `

  const result = await sendEmail({
    to:          NOTIFY_EMAIL,
    subject:     `${bookings.length} demo${bookings.length > 1 ? 's' : ''} tomorrow — ${dateLabel}`,
    bodyHtml,
    type:        'transactional',
    footerNote:  'This is an automated nightly reminder from your AlwaysReady platform.',
  })

  if (!result.sent) {
    console.error('[demo-reminder] Failed to send email:', result.error ?? result.skipped)
    return NextResponse.json({ ok: false, error: result.error ?? result.skipped }, { status: 500 })
  }

  console.log(`[demo-reminder] Sent reminder for ${bookings.length} demo(s) on ${dateLabel}`)
  return NextResponse.json({ ok: true, sent: true, count: bookings.length })
}
