/**
 * POST /api/inbound-optout
 *
 * Receives opt-out form submissions from alwaysready.uk/optout.
 * 1. Creates a record in marketing_suppressions
 * 2. If a signed opt-out token was provided, verifies and auto-suppresses the
 *    matching campaign_contacts row. Without a token (e.g. a letter recipient
 *    with no digital link), nothing is auto-suppressed — postcode and
 *    business name are both public, so neither is proof of identity.
 * 3. Notifies AJ, flagging token-less requests for manual review/suppression
 *    via the superadmin campaigns page.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'
import type { MarketingSuppression, CampaignContact } from '@/lib/types'
import { escapeHtml } from '@/lib/utils/escape'


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
  // Only the token path auto-suppresses. A token proves the requester actually
  // holds a specific marketing email (it's embedded in that email's opt-out
  // link) — postcode and business name are both public CQC-register data, so
  // no combination of them is ever proof of identity, and campaign_contacts
  // has no email column to check an email against in the first place. A
  // submission with no token (a letter recipient with no digital link to
  // click) is recorded above and flagged to AJ below for manual matching —
  // never auto-suppressed.
  let matchedContactId: string | null = null
  let needsManualReview = false

  if (optoutToken) {
    const { data: contact } = await supabase
      .from('campaign_contacts')
      .select('id')
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
  } else {
    needsManualReview = true
  }

  if (matchedContactId) {
    await supabase
      .from('marketing_suppressions')
      .update({ campaign_contact_id: matchedContactId })
      .eq('id', suppression!.id)
  }

  // ── Notify AJ ─────────────────────────────────────────────────────────────
  const ajEmail = process.env.SUPERADMIN_EMAIL ?? 'hello@alwaysready.uk'
  const reviewBanner = needsManualReview
    ? `<p style="margin:0 0 12px;font-size:13px;color:#92400e;background:#fef3c7;padding:8px 12px;border-radius:4px">
         ⚠️ <strong>Needs manual review.</strong> No opt-out token was provided (this request didn't come from
         clicking a link in a marketing email), so nothing was automatically suppressed — postcode and business
         name alone are public information and aren't proof this request is genuine. Confirm the match yourself
         in the campaigns page, then suppress it there.
       </p>`
    : `<p style="margin:0 0 12px;font-size:13px;color:#065f46;background:#d1fae5;padding:8px 12px;border-radius:4px">
         ✅ Verified via opt-out token — automatically suppressed, no action needed.
       </p>`
  await sendEmail({
    to: ajEmail,
    subject: `Marketing opt-out${needsManualReview ? ' (needs review)' : ''}: ${locationName}`,
    type: 'transactional',
    bodyHtml: `
      <p>A provider has requested to be removed from AlwaysReady marketing.</p>
      ${reviewBanner}
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
        View and manage opt-outs in the
        <a href="https://portal.alwaysready.uk/superadmin/campaigns" style="color:#014D4E;">superadmin Campaigns page</a>.
      </p>
    `,
  })

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS })
}
