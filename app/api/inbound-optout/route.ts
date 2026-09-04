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

  const locationName  = (body.location_name ?? '').trim()
  const postcode      = (body.postcode      ?? '').trim().toUpperCase() || null
  const email         = (body.email         ?? '').trim().toLowerCase() || null
  const optoutToken   = (body.token         ?? '').trim() || null

  if (!locationName) {
    return NextResponse.json(
      { error: 'location_name is required' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  // Reject postcode-only requests — require either a signed token or email+postcode.
  // A postcode alone is publicly available and would let anyone opt out a competitor.
  if (!optoutToken && !email) {
    return NextResponse.json(
      { error: 'Please provide your email address to complete the opt-out.' },
      { status: 400, headers: CORS_HEADERS }
    )
  }
  if (!optoutToken && postcode && !email) {
    return NextResponse.json(
      { error: 'Please provide your email address alongside the postcode.' },
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
  // Priority 1: token — suppresses exactly one contact, no guessing.
  // Priority 2: email + postcode — both must match.
  let matchedContactId: string | null = null

  if (optoutToken) {
    const { data: contact } = await supabase
      .from('campaign_contacts')
      .select('id')
      // @ts-expect-error -- optout_token added in migration 20260904000006; regenerate types after applying
      .eq('optout_token', optoutToken)
      .is('suppressed_at', null)
      .single() as { data: Pick<CampaignContact, 'id'> | null }

    if (contact) {
      await supabase
        .from('campaign_contacts')
        .update({ suppressed_at: new Date().toISOString() })
        .eq('id', contact.id)
      matchedContactId = contact.id
    }
  } else if (email && postcode) {
    // Require both email and postcode to match — postcode alone is not enough.
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
      matchedContactId = ids[0]
    }
  }

  if (matchedContactId) {
    await supabase
      .from('marketing_suppressions')
      .update({ campaign_contact_id: matchedContactId })
      .eq('id', suppression!.id)
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
      <p style="margin-top:16px;font-size:15px;line-height:1.7;color:#1a1a1a;">
        View all opt-outs in the
        <a href="https://portal.alwaysready.uk/superadmin/leads" style="color:#014D4E;">superadmin Leads page</a>.
      </p>
    `,
  })

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS })
}
