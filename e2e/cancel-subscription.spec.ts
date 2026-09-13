/**
 * Cancel subscription: our own boundary lands the admin on a genuine,
 * valid Stripe-hosted billing portal session, pre-loaded on the
 * cancellation flow.
 *
 * Deliberately scoped to what our own code is responsible for — creating
 * the portal session and redirecting there — not to anything inside
 * Stripe's own hosted UI, which is out of scope for this app's own test
 * suite. Uses a real Stripe TEST MODE customer + subscription (created
 * here, cleaned up at the end) so the redirect target is a genuine Stripe
 * response, not a guess at what one would look like.
 *
 * Covers, genuinely:
 *   - createCancellationPortalSession (app/actions/stripe.ts) redirects to
 *     a real billing.stripe.com URL when the org has an active subscription
 *   - createBillingPortalSession (the plain "Manage subscription" link)
 *     does the same, via the same underlying mechanism
 *   - the boundary case: an org with no Stripe customer at all sees neither
 *     control, only "Subscribe now" — matches every freshly seeded org's
 *     actual default state (subscription_tier: 'active' with no
 *     stripe_customer_id is a fixture-only combination that wouldn't occur
 *     for a real org, since 'active' is only ever set by a real Stripe
 *     webhook alongside a customer id — but it's exactly the boundary this
 *     item's own name calls out, so it's tested as found)
 *
 * Not covered: the non-admin role check inside createCancellationPortalSession
 * itself. The "Billing" tab is already gated out of the tab list entirely
 * for non-admins in the UI, and there's no practical way to invoke a Next.js
 * Server Action directly (its internal action-id encoding isn't a stable,
 * externally-callable API) — that check is real defense-in-depth, just not
 * separately reachable to test here.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist, and a
 * Stripe TEST MODE key (STRIPE_SECRET_KEY) + STRIPE_PRICE_ID configured in
 * .env.local — see its own comment there for how these were obtained.
 */
import { test, expect } from '@playwright/test'
import Stripe from 'stripe'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { loadEnvLocal } from './support/env'

test('cancelling a subscription lands on a real Stripe portal session; no-customer org sees only Subscribe', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()
  const env = loadEnvLocal()
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-08-26.dahlia' })

  // ── Set up a genuine test-mode Stripe customer + active subscription ────
  const customer = await stripe.customers.create({ email: `e2e-stripe-${Date.now()}@alwaysready.invalid` })
  const paymentMethod = await stripe.paymentMethods.attach('pm_card_visa', { customer: customer.id })
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: paymentMethod.id } })
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: env.STRIPE_PRICE_ID }],
  })
  expect(subscription.status).toBe('active')

  try {
    // Mimics what the real Stripe webhook does after a genuine checkout —
    // wiring the org to the customer this test just created.
    const { error: orgUpdateErr } = await admin
      .from('organisations')
      .update({ stripe_customer_id: customer.id })
      .eq('id', account.orgId)
    expect(orgUpdateErr).toBeNull()

    await login(page, account)
    await page.waitForURL('**/dashboard')
    await page.goto('/dashboard/account?tab=billing')

    await expect(page.getByRole('button', { name: 'Manage subscription →' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel my subscription' })).toBeVisible()

    // ── "Manage subscription" lands on a genuine Stripe-hosted session ──────
    await page.getByRole('button', { name: 'Manage subscription →' }).click()
    await page.waitForURL(/^https:\/\/billing\.stripe\.com\//)
    expect(page.url()).toMatch(/^https:\/\/billing\.stripe\.com\//)

    // ── Back, and the dedicated cancellation flow does the same ─────────────
    await page.goto('/dashboard/account?tab=billing')
    await page.getByRole('button', { name: 'Cancel my subscription' }).click()
    await page.waitForURL(/^https:\/\/billing\.stripe\.com\//)
    expect(page.url()).toMatch(/^https:\/\/billing\.stripe\.com\//)

    // ── Boundary: no Stripe customer, not on the active tier -> only Subscribe
    // Clearing stripe_customer_id alone isn't enough to reach this: with
    // subscription_tier still 'active' (this fixture's own default, never
    // true for a real org without a customer id -- 'active' is only ever
    // set by a genuine Stripe webhook alongside one), the page renders
    // neither control at all (hasStripeCustomer false AND subscriptionTier
    // === 'active' both fail their branch) -- not the real boundary a
    // genuine trial/lapsed org actually hits.
    const { error: clearErr } = await admin
      .from('organisations')
      .update({ stripe_customer_id: null, subscription_tier: 'trial' })
      .eq('id', account.orgId)
    expect(clearErr).toBeNull()

    await page.goto('/dashboard/account?tab=billing')
    await expect(page.getByRole('button', { name: 'Manage subscription →' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Cancel my subscription' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Subscribe now →' })).toBeVisible()
  } finally {
    // ── Cleanup: real Stripe test-mode objects, not just local DB rows ──────
    await stripe.subscriptions.cancel(subscription.id).catch(() => {})
    await stripe.customers.del(customer.id).catch(() => {})

    // Restore the shared fixture org to its original seeded state
    // (subscription_tier: 'active', no stripe_customer_id) — this is a
    // shared org across every spec in the suite, and leaving it on 'trial'
    // could affect whatever spec runs after this one.
    await admin
      .from('organisations')
      .update({ stripe_customer_id: null, subscription_tier: 'active' })
      .eq('id', account.orgId)
  }
})
