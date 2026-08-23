/**
 * POST /api/inbound-optout
 *
 * Receives opt-out form submissions from alwaysready.uk/optout.
 * 1. Creates a record in marketing_suppressions
 * 2. Attempts to match against campaign_contacts by postcode and marks them suppressed
 * 3. Notifies AJ
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'
import type { MarketingSuppression, CampaignContact } from '@/lib/types'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 10 requests per IP per hour
const limiter = createRateLimiter({ windowMs: 60 * 60_000, max: 10 })

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://alwaysready.uk',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  if (!limiter.check(getClientIp(req))) {
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

  const locationName = (body.location_name ?? '').trim()
  const postcode     = (body.postcode      ?? '').trim().toUpperCase() || null
  const email        = (body.email         ?? '').trim().toLowerCase() || null

  if (!locationName) {
    return NextResponse.json(
      { error: 'location_name is required' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const supabase = createAdminClient()

  // ── Create suppression record ──────────────────────────────────────────────
  const { data: suppression, error: suppressionError } = await supabase
    .from('marketing_suppressions')
    .insert({ location_name: locationName, postcode, email, source: 'optout_form' })
    .select('id')
    .single() as { data: Pick<MarketingSuppression, 'id'> | null; error: { message: string } | null }

  if (suppressionError) {
    console.error('[inbound-optout] suppression insert error:', suppressionError.message)
    return NextResponse.json({ error: 'Failed to record opt-out' }, { status: 500, headers: CORS_HEADERS })
  }

  // ── Match and suppress campaign contacts ───────────────────────────────────
  // Match on postcode (normalised) — update all unsuppressed matches
  if (postcode) {
    const { data: matched } = await supabase
      .from('campaign_contacts')
      .select('id')
      .eq('postcode', postcode)
      .is('suppressed_at', null) as { data: Pick<CampaignContact, 'id'>[] | null }

    if (matched && matched.length > 0) {
      const ids = matched.map(r => r.id)
      await supabase
        .from('campaign_contacts')
        .update({ suppressed_at: new Date().toISOString() })
        .in('id', ids)

      // Link suppression to first matched contact
      await supabase
        .from('marketing_suppressions')
        .update({ campaign_contact_id: ids[0] })
        .eq('id', suppression!.id)
    }
  }

  // ── Notify AJ ─────────────────────────────────────────────────────────────
  const ajEmail = process.env.SUPERADMIN_EMAIL ?? 'hello@alwaysready.uk'
  await sendEmail({
    to: ajEmail,
    subject: `Marketing opt-out: ${locationName}`,
    type: 'transactional',
    bodyHtml: `
      <p>A provider has requested to be removed from AlwaysReady marketing.</p>
      <table style="border-collapse:collapse;font-size:14px;margin-top:12px;">
        <tr>
          <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Service name</td>
          <td style="padding:6px 0;">${escapeHtml(locationName)}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Postcode</td>
          <td style="padding:6px 0;">${postcode ? escapeHtml(postcode) : 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0;font-weight:600;color:#555;">Email</td>
          <td style="padding:6px 0;">${email ? escapeHtml(email) : 'Not provided'}</td>
        </tr>
      </table>
      <p style="margin-top:16px;font-size:13px;color:#888;">
        View all opt-outs in the
        <a href="https://portal.alwaysready.uk/superadmin/leads" style="color:#014D4E;">superadmin Leads page</a>.
      </p>
    `,
  })

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS })
}
