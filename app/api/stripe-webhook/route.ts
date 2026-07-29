/**
 * POST /api/stripe-webhook
 *
 * Receives Stripe events and keeps the organisations table in sync.
 *
 * Events handled:
 *   checkout.session.completed       — first payment; activate subscription
 *   customer.subscription.updated    — plan changes, renewals, status changes
 *   customer.subscription.deleted    — cancellation; block access
 *   invoice.payment_succeeded        — renewal succeeded; ensure active
 *   invoice.payment_failed           — payment failed; mark past_due
 *
 * Security: every request is verified against STRIPE_WEBHOOK_SECRET using
 * Stripe's signature verification — unsigned requests are rejected with 401.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const PLATFORM_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.alwaysready.uk').replace(/\/$/, '')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 })
  }

  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // ── checkout.session.completed ─────────────────────────────────────────
  // Fired once when the customer completes checkout for the first time.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orgId   = session.metadata?.organisation_id

    if (orgId && session.customer && session.subscription) {
      const isBeta = session.metadata?.is_beta === 'true'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('organisations')
        .update({
          subscription_tier:      'active',
          stripe_customer_id:     String(session.customer),
          stripe_subscription_id: String(session.subscription),
          subscribed_at:          new Date().toISOString(),
          ...(isBeta ? { is_beta: true } : {}),
        })
        .eq('id', orgId)

      if (error) {
        console.error('[stripe-webhook] checkout update error:', error.message)
      } else {
        // Day 14a — send subscription confirmation email to the org admin
        const { data: admins } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('organisation_id', orgId)
          .eq('role', 'admin')

        for (const admin of admins ?? []) {
          if (!admin.email) continue
          const firstName = admin.full_name?.split(' ')[0] ?? 'there'
          await sendEmail({
            to:      admin.email,
            subject: 'Your AlwaysReady subscription is now active',
            type:    'transactional',
            bodyHtml: `
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
                <div style="background:#014D4E;padding:28px 40px;border-bottom:4px solid #ffd700">
                  <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">AlwaysReady</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#99cccc;letter-spacing:0.05em;text-transform:uppercase">Inspection Readiness Platform</p>
                </div>
                <div style="padding:36px 40px">
                  <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
                  <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
                    Thank you — your subscription is now active and your account will continue without interruption.
                  </p>
                  <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#1a1a1a">
                    We're delighted to have you on board. If there's anything we can do to help you
                    get the most from AlwaysReady, please don't hesitate to reach out via the
                    <strong>Support</strong> tab inside the platform.
                  </p>
                  <p style="margin:0 0 32px">
                    <a href="${PLATFORM_URL}/dashboard"
                       style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
                      Go to your dashboard &rarr;
                    </a>
                  </p>
                  <p style="margin:32px 0 0;font-size:15px;line-height:1.7;color:#1a1a1a">
                    Kind regards,<br>
                    <strong>Ethna Parker PhD</strong><br>
                    Founder, AlwaysReady
                  </p>
                </div>
                <div style="padding:20px 40px;background:#f5f4f1;border-top:1px solid #e5e3de">
                  <p style="margin:0;font-size:12px;color:#888;line-height:1.6">
                    AlwaysReady is a brand of Parker Digital &amp; Print Services Ltd.
                    Registered Office: 82A James Carter Road, Mildenhall, IP28 7DE.
                  </p>
                </div>
              </div>
            `,
          })
        }
      }
    }
  }

  // ── customer.subscription.updated ─────────────────────────────────────
  // Fired on renewals, plan changes, and status transitions.
  if (event.type === 'customer.subscription.updated') {
    const sub  = event.data.object as Stripe.Subscription
    const tier = stripeStatusToTier(sub.status)

    const { error } = await supabase
      .from('organisations')
      .update({ subscription_tier: tier as 'trial' | 'active' })
      .eq('stripe_subscription_id' as never, sub.id)

    if (error) console.error('[stripe-webhook] subscription update error:', error.message)
  }

  // ── customer.subscription.deleted ─────────────────────────────────────
  // Fired when a subscription is cancelled and the period ends.
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('organisations')
      .update({ subscription_tier: 'canceled' })
      .eq('stripe_subscription_id', sub.id)

    if (error) console.error('[stripe-webhook] subscription delete error:', error.message)
  }

  // ── invoice.payment_succeeded ──────────────────────────────────────────
  // Fired on every successful renewal payment — keep tier as active.
  if (event.type === 'invoice.payment_succeeded') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = event.data.object as any
    const subId   = invoice.subscription as string | null
    if (subId) {
      const { error } = await supabase
        .from('organisations')
        .update({ subscription_tier: 'active' })
        .eq('stripe_subscription_id' as never, subId)

      if (error) console.error('[stripe-webhook] invoice success error:', error.message)
    }
  }

  // ── invoice.payment_failed ─────────────────────────────────────────────
  // Fired when a renewal payment fails. Mark past_due — Stripe retries
  // automatically; if all retries fail, subscription.deleted fires.
  if (event.type === 'invoice.payment_failed') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = event.data.object as any
    const subId   = invoice.subscription as string | null
    if (subId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('organisations')
        .update({ subscription_tier: 'past_due' })
        .eq('stripe_subscription_id', subId)

      if (error) console.error('[stripe-webhook] invoice failure error:', error.message)
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

/** Map Stripe subscription status to our subscription_tier values. */
function stripeStatusToTier(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing': return 'active'
    case 'past_due': return 'past_due'
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired': return 'canceled'
    default: return 'past_due'
  }
}
