'use server'

/**
 * Stripe server actions.
 *
 * createCheckoutSession — creates a Stripe Checkout session for the
 *   organisation's subscription and returns the URL to redirect to.
 *
 * createBillingPortalSession — opens Stripe's hosted billing portal
 *   so customers can update their card, view invoices, or cancel.
 */

import Stripe from 'stripe'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserProfile } from '@/lib/session'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

const PRICE_ID         = process.env.STRIPE_PRICE_ID!
const BETA_PRICE_ID    = process.env.STRIPE_BETA_PRICE_ID!
const CHARITY_PRICE_ID = process.env.STRIPE_CHARITY_PRICE_ID!
const PLATFORM_URL     = process.env.NEXT_PUBLIC_SITE_URL
  ?? 'https://portal.alwaysready.uk'

// ── Checkout ───────────────────────────────────────────────────────────────

export async function createCheckoutSession(): Promise<never> {
  const profile = await getCurrentUserProfile()
  if (!profile?.organisation_id) redirect('/login')

  const supabase = await createClient()
  const { data: org } = await (supabase as any)
    .from('organisations')
    .select('id, name, stripe_customer_id, is_charity')
    .eq('id', profile.organisation_id)
    .single()

  if (!org) redirect('/login')

  // Reuse existing Stripe customer if we have one.
  // In subscription mode, customer_creation is not allowed — Stripe
  // creates the customer automatically when none is supplied.
  const customerParams = org.stripe_customer_id
    ? { customer: org.stripe_customer_id }
    : {}

  // Charities get a dedicated £50/month price (AlwaysReady — Charity Rate).
  // Everyone else gets the standard price, with promotion codes allowed.
  const isCharity = org.is_charity === true
  const priceId   = isCharity ? CHARITY_PRICE_ID : PRICE_ID

  const session = await stripe.checkout.sessions.create({
    mode:               'subscription',
    line_items:         [{ price: priceId, quantity: 1 }],
    ...customerParams,
    success_url:        `${PLATFORM_URL}/dashboard?subscribed=1`,
    cancel_url:         `${PLATFORM_URL}/upgrade`,
    metadata:           { organisation_id: org.id },
    // Collect billing address for UK VAT
    billing_address_collection: 'required',
    // Enable automatic tax (requires Stripe Tax to be set up)
    // automatic_tax: { enabled: true },
    ...(isCharity ? {} : { allow_promotion_codes: true as const }),
  })

  redirect(session.url!)
}

// ── Beta checkout ──────────────────────────────────────────────────────────

export async function createBetaCheckoutSession(): Promise<never> {
  const profile = await getCurrentUserProfile()
  if (!profile?.organisation_id) redirect('/login')

  const supabase = await createClient()
  const { data: org } = await (supabase as any)
    .from('organisations')
    .select('id, name, stripe_customer_id')
    .eq('id', profile.organisation_id)
    .single()

  if (!org) redirect('/login')

  const customerParams = org.stripe_customer_id
    ? { customer: org.stripe_customer_id }
    : {}

  const session = await stripe.checkout.sessions.create({
    mode:               'subscription',
    line_items:         [{ price: BETA_PRICE_ID, quantity: 1 }],
    ...customerParams,
    success_url:        `${PLATFORM_URL}/dashboard?subscribed=1`,
    cancel_url:         `${PLATFORM_URL}/upgrade`,
    // is_beta flag lets the webhook set organisations.is_beta = true
    metadata:           { organisation_id: org.id, is_beta: 'true' },
    billing_address_collection: 'required',
    allow_promotion_codes: false,
  })

  redirect(session.url!)
}

// ── Billing portal ─────────────────────────────────────────────────────────

export async function createBillingPortalSession(): Promise<never> {
  const profile = await getCurrentUserProfile()
  if (!profile?.organisation_id) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: org } = await adminSupabase
    .from('organisations')
    .select('stripe_customer_id')
    .eq('id', profile.organisation_id)
    .single()

  if (!org?.stripe_customer_id) {
    // No Stripe customer yet — send them to the upgrade page
    redirect('/upgrade')
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   org.stripe_customer_id,
    return_url: `${PLATFORM_URL}/dashboard/account`,
  })

  redirect(portalSession.url)
}

// ── Cancel subscription ────────────────────────────────────────────────────

/**
 * Opens the Stripe billing portal pre-loaded on the cancellation flow,
 * so the user lands directly on "Cancel subscription" rather than having
 * to navigate there themselves.
 */
export async function createCancellationPortalSession(): Promise<never> {
  const profile = await getCurrentUserProfile()
  if (!profile?.organisation_id) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: org } = await adminSupabase
    .from('organisations')
    .select('stripe_customer_id')
    .eq('id', profile.organisation_id)
    .single()

  if (!org?.stripe_customer_id) {
    redirect('/upgrade')
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   org.stripe_customer_id,
    return_url: `${PLATFORM_URL}/dashboard/account`,
    flow_data: {
      type: 'subscription_cancel',
      subscription_cancel: {
        subscription: await getActiveSubscriptionId(org.stripe_customer_id),
      },
    },
  })

  redirect(portalSession.url)
}

/**
 * Looks up the first active subscription ID for a Stripe customer.
 * Needed for the portal cancellation flow, which requires a subscription ID.
 */
async function getActiveSubscriptionId(customerId: string): Promise<string> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status:   'active',
    limit:    1,
  })
  if (!subscriptions.data[0]) {
    // Fall back to any non-cancelled subscription (e.g. past_due, trialing)
    const any = await stripe.subscriptions.list({
      customer: customerId,
      limit:    1,
    })
    if (!any.data[0]) throw new Error('No subscription found for customer')
    return any.data[0].id
  }
  return subscriptions.data[0].id
}
