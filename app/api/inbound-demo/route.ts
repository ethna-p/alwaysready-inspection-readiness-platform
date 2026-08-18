/**
 * POST /api/inbound-demo
 *
 * Receives pre-booking intake data from the /demo page on alwaysready.uk.
 * Called before the user is redirected to the Zeeg scheduler.
 *
 * Payload: { service_type: string, cqc_rating: string, demo_type: '15min' | '30min' }
 *
 * On receipt:
 *   1. Saves the lead to demo_leads
 *   2. Sends a notification email to AJ
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://alwaysready.uk',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const AJ_EMAIL = 'hello@alwaysready.uk'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS })
  }

  const serviceType = (body.service_type ?? '').trim()
  const cqcRating   = (body.cqc_rating   ?? '').trim() || null
  const demoType    = (body.demo_type    ?? '').trim()

  if (!serviceType || !demoType) {
    return NextResponse.json(
      { error: 'service_type and demo_type are required' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  if (!['15min', '30min'].includes(demoType)) {
    return NextResponse.json(
      { error: 'demo_type must be 15min or 30min' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const supabase = createAdminClient()

  // ── Save to demo_leads ────────────────────────────────────────────────────
  const { error: insertError } = await supabase
    .from('demo_leads')
    .insert({ service_type: serviceType, cqc_rating: cqcRating, demo_type: demoType })

  if (insertError) {
    console.error('[inbound-demo] insert error:', insertError.message)
    // Don't block the user — still redirect them to Zeeg
  }

  // ── Notify AJ ─────────────────────────────────────────────────────────────
  const demoLabel = demoType === '15min'
    ? '15-minute Mock Inspection module demo'
    : '30-minute full platform demo'

  await sendEmail({
    to: AJ_EMAIL,
    subject: `New demo booking — ${serviceType}`,
    type: 'transactional',
    bodyHtml: `
      <p>Someone just booked a demo via alwaysready.uk/demo.</p>
      <table style="border-collapse:collapse;font-size:14px;margin-top:12px;">
        <tr>
          <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Demo type</td>
          <td style="padding:6px 0;">${demoLabel}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Service type</td>
          <td style="padding:6px 0;">${serviceType}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Last CQC rating</td>
          <td style="padding:6px 0;">${cqcRating ?? 'Not provided'}</td>
        </tr>
      </table>
      <p style="margin-top:16px;font-size:13px;color:#888;">
        View all demo leads in the
        <a href="https://portal.alwaysready.uk/superadmin/leads" style="color:#014D4E;">superadmin Leads page</a>.
      </p>
    `,
  })

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS })
}
