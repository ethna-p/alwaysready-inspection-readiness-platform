/**
 * POST /api/inbound-optout
 *
 * Receives opt-out form submissions from alwaysready.uk/optout — two
 * distinct audiences, both landing here:
 *
 *   - Blog/newsletter subscribers unsubscribing by email (the original,
 *     legitimate use of this route — a real email checked against
 *     blog_subscribers elsewhere, or just logged here for the record).
 *   - Cold-outreach letter recipients who never subscribed to anything and
 *     have no email on file at all — identified only by the short
 *     `optout_code` printed on their letter (see
 *     campaign_contacts.optout_code, migration 20260912000002).
 *
 * A `token` (the long-form UUID, for a clickable email link) or `code` (the
 * short form, for typing off a letter) both verify identity the same way —
 * a real proof the requester holds a specific piece of correspondence — and
 * both auto-suppress the matching campaign_contacts row. Neither postcode
 * nor a self-reported business name is ever proof of identity (both are
 * public CQC-register data), so a submission with no token or code is
 * logged and flagged to AJ for manual review instead of ever being
 * auto-suppressed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'
import type { MarketingSuppression, CampaignContact } from '@/lib/types'
import { escapeHtml } from '@/lib/utils/escape'


// 10 requests per IP per hour
const limiter = createRateLimiter({ name: 'inbound-optout', windowMs: 60 * 60_000, max: 10 })

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

  let locationName    = (body.location_name ?? '').trim()
  const postcode      = (body.postcode      ?? '').trim().toUpperCase() || null
  let email           = (body.email         ?? '').trim().toLowerCase() || null
  const optoutToken   = (body.token         ?? '').trim() || null
  const optoutCode    = (body.code          ?? '').trim().toUpperCase() || null
  const hasVerifiedIdentity = !!(optoutToken || optoutCode)

  // Without a token or code, we have no proof of identity — fall back to the
  // original email-based path (blog/newsletter subscribers), which still
  // needs a business name and an email to log against.
  if (!hasVerifiedIdentity) {
    if (!locationName) {
      return NextResponse.json({ error: 'location_name is required' }, { status: 400, headers: CORS_HEADERS })
    }
    if (!email) {
      return NextResponse.json(
        { error: 'Please provide your email address to complete the opt-out.' },
        { status: 400, headers: CORS_HEADERS }
      )
    }
  }

  const supabase = createAdminClient()

  // ── Look up the contact first (if a token/code was given) ───────────────
  // so we can use its real location_name for logging even when the client
  // didn't (and, for the letter-code path, never needs to) send one.
  let matchedContact: Pick<CampaignContact, 'id' | 'location_name'> | null = null
  let codeOrTokenNotRecognised = false

  if (optoutToken) {
    const { data } = await supabase
      .from('campaign_contacts')
      .select('id, location_name')
      .eq('optout_token', optoutToken)
      .is('suppressed_at', null)
      .single() as { data: Pick<CampaignContact, 'id' | 'location_name'> | null }
    if (data) matchedContact = data
    else codeOrTokenNotRecognised = true
  } else if (optoutCode) {
    const { data } = await supabase
      .from('campaign_contacts')
      .select('id, location_name')
      .eq('optout_code', optoutCode)
      .is('suppressed_at', null)
      .single() as { data: Pick<CampaignContact, 'id' | 'location_name'> | null }
    if (data) matchedContact = data
    else codeOrTokenNotRecognised = true
  }

  if (matchedContact) {
    locationName = matchedContact.location_name
  } else if (hasVerifiedIdentity && !locationName) {
    // A code/token was given but didn't match anything (typo, or already
    // processed) — still need *something* for the log and AJ's email.
    locationName = optoutCode ? `Unrecognised code: ${optoutCode}` : 'Unrecognised opt-out link'
  }
  if (hasVerifiedIdentity && !email) email = null // letter recipients have none — fine, marketing_suppressions.email is nullable

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

  // ── Suppress the matched contact ────────────────────────────────────────
  let needsManualReview = false

  if (matchedContact) {
    await supabase
      .from('campaign_contacts')
      .update({ suppressed_at: new Date().toISOString() })
      .eq('id', matchedContact.id)

    await supabase
      .from('marketing_suppressions')
      .update({ campaign_contact_id: matchedContact.id })
      .eq('id', suppression!.id)
  } else {
    needsManualReview = true
  }

  // ── Notify AJ ─────────────────────────────────────────────────────────────
  const ajEmail = process.env.SUPERADMIN_EMAIL ?? 'hello@alwaysready.uk'
  const reviewBanner = codeOrTokenNotRecognised
    ? `<p style="margin:0 0 12px;font-size:13px;color:#92400e;background:#fef3c7;padding:8px 12px;border-radius:4px">
         ⚠️ <strong>Needs manual review.</strong> A ${optoutCode ? 'code' : 'link'} was provided but didn't match any
         contact — likely mistyped, or this contact was already suppressed. Check the ${optoutCode ? `code ${escapeHtml(optoutCode)}` : 'link'}
         against the campaigns page yourself.
       </p>`
    : needsManualReview
    ? `<p style="margin:0 0 12px;font-size:13px;color:#92400e;background:#fef3c7;padding:8px 12px;border-radius:4px">
         ⚠️ <strong>Needs manual review.</strong> No opt-out code or token was provided, so nothing was automatically
         suppressed — postcode and business name alone are public information and aren't proof this request is
         genuine. Confirm the match yourself in the campaigns page, then suppress it there.
       </p>`
    : `<p style="margin:0 0 12px;font-size:13px;color:#065f46;background:#d1fae5;padding:8px 12px;border-radius:4px">
         ✅ Verified via opt-out ${optoutCode ? 'code' : 'token'} — automatically suppressed, no action needed.
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
