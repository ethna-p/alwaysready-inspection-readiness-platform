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
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'

// 10 requests per IP per hour
const limiter = createRateLimiter({ windowMs: 60 * 60_000, max: 10 })

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://alwaysready.uk',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  if (!await limiter.check(getClientIp(req))) {
    return new NextResponse('Too many requests. Please try again later.', {
      status: 429,
      headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain', 'Retry-After': '3600' },
    })
  }

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

  const ajEmail = process.env.SUPERADMIN_EMAIL ?? 'hello@alwaysready.uk'
  await sendEmail({
    to: ajEmail,
    subject: `New demo booking — ${escapeHtml(serviceType)}`,
    type: 'transactional',
    bodyHtml: `
      <p>Someone just booked a demo via alwaysready.uk/demo.</p>
      <table style="border-collapse:collapse;font-size:14px;margin-top:12px;">
        <tr>
          <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Demo type</td>
          <td style="padding:6px 0;">${escapeHtml(demoLabel)}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Service type</td>
          <td style="padding:6px 0;">${escapeHtml(serviceType)}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Last CQC rating</td>
          <td style="padding:6px 0;">${cqcRating ? escapeHtml(cqcRating) : 'Not provided'}</td>
        </tr>
      </table>
      <p style="margin-top:16px;font-size:15px;line-height:1.7;color:#1a1a1a;">
        View all demo leads in the
        <a href="https://portal.alwaysready.uk/superadmin/leads" style="color:#014D4E;">superadmin Leads page</a>.
      </p>
    `,
  })

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS })
}
