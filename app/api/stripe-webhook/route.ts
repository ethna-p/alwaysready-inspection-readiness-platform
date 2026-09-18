/**
 * POST /api/stripe-webhook
 *
 * Receives Stripe events and keeps the organisations table in sync.
 *
 * Events handled:
 *   checkout.session.completed       : first payment; activate subscription
 *   customer.subscription.updated    : plan changes, renewals, status changes
 *   customer.subscription.deleted    : cancellation; block access
 *   invoice.payment_succeeded        : renewal succeeded; ensure active
 *   invoice.payment_failed           : payment failed; mark past_due
 *
 * Security: every request is verified against STRIPE_WEBHOOK_SECRET using
 * Stripe's signature verification: unsigned requests are rejected with 401.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { renderTemplate } from '@/lib/email-templates'
import { stripeStatusToTier } from '@/lib/stripe-utils'
import { getFirstName } from '@/lib/utils/name'
import { escapeHtml } from '@/lib/utils/escape'
import { PLATFORM_URL } from '@/lib/config'
import { claimNotification } from '@/lib/notification-log'

// notification_log's unique index is (organisation_id, notification_type,
// entity_type, entity_id, due_date, recipient_email). For stripe_event rows,
// entity_id (the Stripe event.id) is already the stable, unique-per-event
// dedup key: due_date has no real meaning here and must therefore be a
// FIXED constant, not "today". Using today's date broke the dedup across a
// calendar-day boundary: a redelivery of the same event on the next day got
// a different due_date, didn't collide with the earlier claim (no 23505),
// and the confirmation/deletion-notice email was sent a second time.
const STRIPE_EVENT_LOG_DUE_DATE = '2000-01-01'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!webhookSecret || !stripeKey) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY not set')
    return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2026-08-26.dahlia',
  })

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

      const { error } = await supabase
        .from('organisations')
        .update({
          subscription_tier:      'active',
          stripe_customer_id:     String(session.customer),
          stripe_subscription_id: String(session.subscription),
          subscribed_at:          new Date().toISOString(),
          // CRITICAL: clear any pending deletion. A trial that lapsed and
          // then later subscribed would otherwise keep the deletion date
          // set by the trial-lapse cron (data_deletion_due_at is never
          // cleared anywhere else), the daily data-deletion cron doesn't
          // check subscription_tier, so an active paying customer's org
          // would be permanently deleted on that stale date.
          data_deletion_due_at:   null,
          ...(isBeta ? { is_beta: true } : {}),
        })
        .eq('id', orgId)

      if (error) {
        console.error('[stripe-webhook] checkout update error:', error.message)
      } else {
        // Day 14a: send subscription confirmation email to the org admin.
        // Stripe does not guarantee exactly-once delivery. The same event
        // can be redelivered (timeouts, manual resends from the dashboard),
        // so claim against notification_log first, keyed by the stable
        // event.id, same idempotency idiom used by the cron email jobs.
        const { data: admins } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('organisation_id', orgId)
          .eq('role', 'admin')

        for (const admin of admins ?? []) {
          if (!admin.email) continue

          const claim = await claimNotification(supabase, {
            organisationId:   orgId,
            notificationType: 'stripe_event',
            entityType:       'subscription',
            entityId:         event.id,
            dueDate:          STRIPE_EVENT_LOG_DUE_DATE,
            recipientEmail:   admin.email,
          }, 'stripe-webhook checkout confirmation')
          if (!claim.claimed) continue // already sent for this event, or claim failed (logged inside)

          const firstName = escapeHtml(getFirstName(admin.full_name))
          const defaultSubscriptionActiveHtml = `
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
                Thank you, ${firstName}. Your subscription is now active and your account will continue without interruption.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#1a1a1a">
                We are delighted to have you on board. If there is anything we can do to help you
                get the most from AlwaysReady, please use the <strong>Support</strong> tab inside the platform.
              </p>
              <p style="margin:0 0 32px">
                <a href="${PLATFORM_URL}/dashboard"
                   style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
                  Go to your dashboard &rarr;
                </a>
              </p>
            `

          await sendEmail({
            to:      admin.email,
            subject: 'Your AlwaysReady subscription is now active',
            type:    'transactional',
            bodyHtml: await renderTemplate('subscription_active', { firstName }, defaultSubscriptionActiveHtml),
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
      .eq('stripe_subscription_id', sub.id)

    if (error) console.error('[stripe-webhook] subscription update error:', error.message)
  }

  // ── customer.subscription.deleted ─────────────────────────────────────
  // Fired when a subscription is cancelled and the period ends.
  // Set data_deletion_due_at to 30 days from now so the user has a window
  // to download their data before the deletion cron removes the organisation.
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription

    const deletionDue = new Date()
    deletionDue.setDate(deletionDue.getDate() + 30)

    // Look up the org first, separately from the update: this lets us tell
    // "no org has this stripe_subscription_id at all" (a genuine problem:
    // data mismatch, wrong project, deleted org) apart from "this org
    // already has data_deletion_due_at set" (an expected idempotent replay,
    // since Stripe doesn't guarantee exactly-once delivery). Folding both
    // into one query and treating any PGRST116 (no rows matched) as
    // "already processed" (as a previous version of this handler did)
    // silently swallows the genuine-mismatch case too, with zero logging.
    const { data: existingOrg, error: lookupError } = await supabase
      .from('organisations')
      .select('id, name, data_deletion_due_at')
      .eq('stripe_subscription_id', sub.id)
      .maybeSingle()

    if (lookupError) {
      console.error('[stripe-webhook] subscription delete lookup error:', lookupError.message)
    } else if (!existingOrg) {
      console.error(`[stripe-webhook] subscription delete: no organisation found for stripe_subscription_id ${sub.id}`)
    } else if (existingOrg.data_deletion_due_at) {
      // Already processed by an earlier delivery of this same event: skip silently.
    } else {
      const { data: org, error } = await supabase
        .from('organisations')
        .update({
          subscription_tier:    'canceled' as 'trial' | 'active',
          data_deletion_due_at: deletionDue.toISOString(),
        })
        .eq('id', existingOrg.id)
        .select('id, name')
        .single()

      if (error) {
        console.error('[stripe-webhook] subscription delete update error:', error.message)
      } else if (org) {
        // Notify the org's admin(s) that their data will be deleted in 30 days
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('organisation_id', org.id)
          .eq('role', 'admin')

        if (admins && admins.length > 0) {
          const { data: authUsers } = await supabase.auth.admin.listUsers()
          const adminIds = new Set(admins.map(a => a.id))
          const adminEmails = (authUsers?.users ?? [])
            .filter(u => adminIds.has(u.id) && u.email)
            .map(u => u.email!)

          const deletionDateStr = deletionDue.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          })

          // Each recipient's claim-then-send is independent (keyed by its own
          // recipient_email), run them concurrently rather than serially.
          await Promise.all(adminEmails.map(async (email) => {
            const claim = await claimNotification(supabase, {
              organisationId:   org.id,
              notificationType: 'stripe_event',
              entityType:       'subscription',
              entityId:         event.id,
              dueDate:          STRIPE_EVENT_LOG_DUE_DATE,
              recipientEmail:   email,
            }, 'stripe-webhook deletion notice')
            if (!claim.claimed) return // already sent for this event, or claim failed (logged inside)

            const defaultSubscriptionEndedHtml = `
                <p>Your AlwaysReady subscription for <strong>${escapeHtml(org.name)}</strong> has ended.</p>
                <p>Your data is safe and available to download until <strong>${deletionDateStr}</strong>.
                After that date, it will be permanently deleted.</p>
                <p>To download your data, log in at
                <a href="https://portal.alwaysready.uk/login" style="color:#014D4E">portal.alwaysready.uk</a>
                and use the download buttons on the page shown.</p>
                <p>If you'd like to resubscribe and keep your data, you can do so from the same page.</p>
              `

            await sendEmail({
              to:      email,
              subject: 'Your AlwaysReady subscription has ended: download your data',
              type:    'transactional',
              bodyHtml: await renderTemplate('subscription_ended', { orgName: escapeHtml(org.name), deletionDate: deletionDateStr }, defaultSubscriptionEndedHtml),
            }).catch(err => console.error('[stripe-webhook] deletion notice email failed:', err))
          }))
        }
      }
    }
  }

  // ── invoice.payment_succeeded ──────────────────────────────────────────
  // Fired on every successful renewal payment: keep tier as active.
  if (event.type === 'invoice.payment_succeeded') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = event.data.object as any
    const subId   = invoice.subscription as string | null
    if (subId) {
      const { error } = await supabase
        .from('organisations')
        .update({ subscription_tier: 'active' })
        .eq('stripe_subscription_id', subId)

      if (error) console.error('[stripe-webhook] invoice success error:', error.message)
    }
  }

  // ── invoice.payment_failed ─────────────────────────────────────────────
  // Fired when a renewal payment fails. Mark past_due; Stripe retries
  // automatically; if all retries fail, subscription.deleted fires.
  if (event.type === 'invoice.payment_failed') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = event.data.object as any
    const subId   = invoice.subscription as string | null
    if (subId) {
      const { error } = await supabase
        .from('organisations')
        .update({ subscription_tier: 'past_due' as 'trial' | 'active' })
        .eq('stripe_subscription_id', subId)

      if (error) console.error('[stripe-webhook] invoice failure error:', error.message)
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

// stripeStatusToTier is exported from @/lib/stripe-utils
