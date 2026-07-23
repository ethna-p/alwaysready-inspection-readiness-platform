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

const PRICE_ID    = process.env.STRIPE_PRICE_ID!
const PLATFORM_URL = process.env.NEXT_PUBLIC_BASE_URL
  ?? 'https://alwaysready-inspection-readiness-pl-three.vercel.app'

// ── Checkout ───────────────────────────────────────────────────────────────

export async function createCheckoutSession(): Promise<never> {
  const profile = await getCurrentUserProfile()
  if (!profile?.organisation_id) redirect('/login')

  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organisations')
    .select('id, name, stripe_customer_id')
    .eq('id', profile.organisation_id)
    .single()

  if (!org) redirect('/login')

  // Reuse existing Stripe customer or let Stripe create one
  const customerParams = org.stripe_customer_id
    ? { customer: org.stripe_customer_id }
    : { customer_creation: 'always' as const }

  const session = await stripe.checkout.sessions.create({
    mode:               'subscription',
    line_items:         [{ price: PRICE_ID, quantity: 1 }],
    ...customerParams,
    success_url:        `${PLATFORM_URL}/dashboard?subscribed=1`,
    cancel_url:         `${PLATFORM_URL}/upgrade`,
    metadata:           { organisation_id: org.id },
    // Collect billing address for UK VAT
    billing_address_collection: 'required',
    // Enable automatic tax (requires Stripe Tax to be set up)
    // automatic_tax: { enabled: true },
    allow_promotion_codes: true,
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
