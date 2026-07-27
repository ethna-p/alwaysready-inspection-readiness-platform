/**
 * POST /api/inbound-waitlist
 *
 * Receives Netlify form webhook submissions from alwaysready.uk/waitlist.
 * Netlify posts application/json with the form submission payload.
 *
 * Payload shape (simplified):
 * {
 *   email: string,
 *   first_name: string,
 *   last_name: string | null,
 *   data: { [fieldName: string]: string },
 *   form_name: string,
 * }
 *
 * On receipt:
 *   1. Saves the lead to waitlist_leads (upsert — no duplicates)
 *   2. If marketing opt-in, also adds to blog_subscribers
 *   3. Sends auto-responder email (skipped if already on the waitlist)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  // ── Parse Netlify JSON payload ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: Record<string, any>
  try {
    const text = await req.text()
    // Netlify sends JSON directly; fall back to URLSearchParams for local testing
    try {
      payload = JSON.parse(text)
    } catch {
      const params = new URLSearchParams(text)
      const raw = params.get('payload')
      payload = raw ? JSON.parse(raw) : Object.fromEntries(params.entries())
    }
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = payload.data ?? {}

  // Field names — check top-level Netlify JSON fields, data sub-object,
  // and direct URL-encoded keys (all dash/underscore/camel variants)
  const firstName =
    (payload.first_name  as string | undefined)?.trim() ||
    (payload['first-name'] as string | undefined)?.trim() ||
    (data['first-name']  as string | undefined)?.trim() ||
    (data['firstName']   as string | undefined)?.trim() ||
    (data['name']        as string | undefined)?.trim() ||
    (payload.name        as string | undefined)?.trim() ||
    ''

  const lastName =
    (payload.last_name   as string | undefined)?.trim() ||
    (payload['last-name'] as string | undefined)?.trim() ||
    (data['last-name']   as string | undefined)?.trim() ||
    (data['lastName']    as string | undefined)?.trim() ||
    ''

  const email =
    (payload.email               as string | undefined)?.trim() ||
    (data['email']               as string | undefined)?.trim() ||
    (data['email-address']       as string | undefined)?.trim() ||
    (payload['email-address']    as string | undefined)?.trim() ||
    ''

  const marketingOptIn =
    payload['newsletter']        === 'on'   ||
    payload['newsletter']        === 'true' ||
    data['newsletter']           === 'on'   ||
    data['newsletter']           === 'true' ||
    data['marketing-opt-in']     === 'on'   ||
    data['subscribe']            === 'on'

  if (!email) {
    console.error('[inbound-waitlist] missing email — full payload:', JSON.stringify(payload))
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  const displayName = firstName || 'there'

  const supabase = createAdminClient()

  // ── Check for existing lead (to avoid duplicate auto-responders) ──────────
  const { data: existing } = await supabase
    .from('waitlist_leads')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  const isNew = !existing

  // ── Upsert waitlist lead ──────────────────────────────────────────────────
  const { error: leadError } = await supabase
    .from('waitlist_leads')
    .upsert(
      {
        first_name:       firstName || email,
        last_name:        lastName || null,
        email,
        marketing_opt_in: marketingOptIn,
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )

  if (leadError) {
    console.error('[inbound-waitlist] lead upsert error:', leadError.message)
  }

  // ── Add to blog_subscribers if opted in ───────────────────────────────────
  let subscribedToBlog = false
  if (marketingOptIn) {
    const fullName = lastName ? `${firstName} ${lastName}`.trim() : firstName
    const { error: subError } = await supabase
      .from('blog_subscribers')
      .upsert(
        { email, full_name: fullName || email, source: 'waitlist_form' },
        { onConflict: 'email', ignoreDuplicates: true }
      )

    if (subError) {
      console.error('[inbound-waitlist] subscriber upsert error:', subError.message)
    } else {
      subscribedToBlog = true
    }
  }

  // ── Send auto-responder (new leads only) ──────────────────────────────────
  if (isNew) {
    await sendEmail({
      to: email,
      subject: "You're on the AlwaysReady waitlist",
      type: 'transactional',
      bodyHtml: `
        <p>Hi ${displayName},</p>
        <p>Thank you for joining the AlwaysReady waitlist — you're in good company.</p>
        <p>We're building AlwaysReady around the new CQC Adult Social Care Assessment Framework,
           and we'll open to new customers as soon as the framework is published.
           When that happens, you'll be the first to know.</p>
        <p>In the meantime, if you have any questions about the platform, feel free to reply
           to this email or visit
           <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a>.</p>
        <p style="margin-top:32px">
          Warm regards,<br>
          <strong>Ethna Parker PhD</strong><br>
          Founder, AlwaysReady
        </p>
      `,
    })
  }

  // ── Send blog subscription confirmation ───────────────────────────────────
  if (subscribedToBlog) {
    await sendEmail({
      to: email,
      subject: "You're subscribed to the AlwaysReady blog",
      type: 'transactional',
      bodyHtml: `
        <p>Hi ${displayName},</p>
        <p>You're now subscribed to the AlwaysReady blog. We'll send you practical tips,
           sector updates, and inspection-readiness guidance — straight to your inbox.</p>
        <p>You can unsubscribe at any time by replying to any of our emails.</p>
        <p style="margin-top:32px">
          Warm regards,<br>
          <strong>Ethna Parker PhD</strong><br>
          Founder, AlwaysReady
        </p>
      `,
    })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
