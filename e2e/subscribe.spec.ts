/**
 * Subscribe: a real Stripe Checkout session, completed end to end with a
 * genuine test-mode card, and the real Stripe webhook (forwarded locally
 * via `stripe listen`) actually activating the organisation's subscription
 * in the database — not a guess at what Stripe would do, the real thing.
 *
 * This is the deeper sibling of item 17 (cancel-subscription.spec.ts),
 * which deliberately stopped at "lands on a valid Stripe session". This
 * spec goes all the way through Stripe's own hosted checkout UI (card
 * 4242 4242 4242 4242, the standard Stripe test card that always
 * succeeds) and confirms /api/stripe-webhook's checkout.session.completed
 * handler does its real job.
 *
 * Requires, beyond the usual seeded fixture:
 *   - STRIPE_SECRET_KEY / STRIPE_PRICE_ID (test mode) — see item 17's setup
 *   - STRIPE_WEBHOOK_SECRET — the `whsec_` that `stripe listen` prints.
 *     The spec starts `stripe listen --forward-to localhost:3100/api/stripe-webhook`
 *     itself (e2e/support/stripe-listener.ts) and stops it afterwards, using the
 *     test-mode key from .env.local, so there is no manual step. The Stripe CLI
 *     must be installed. (The webhook is how the DB actually gets updated.)
 *
 * Two real, significant issues were found and fixed while setting this up:
 *   1. This Stripe account had "Managed Payments" enabled, which requires
 *      every product to have a tax_code before a Checkout Session can even
 *      be created — confirmed directly (checkout.sessions.create failed
 *      outright with "the product tax code is missing" until one was added
 *      to this suite's own test-mode products).
 *   2. Managed Payments was also auto-calculating and adding VAT to every
 *      checkout, despite the app's own code never requesting automatic tax
 *      (it's commented out in createCheckoutSession) — a real problem, since
 *      this business isn't VAT-registered and can't legally charge it. AJ
 *      confirmed Managed Payments was never wanted and had tried disabling
 *      it before without it sticking; the settings page this session found
 *      (Settings → Managed Payments) finally let it be turned off for good,
 *      in both test and live mode, before any real customers existed.
 * With Managed Payments off, Checkout also now offers Klarna/Revolut Pay as
 * extra payment methods (automatic, based on the account's own enabled
 * methods) — reflected in the "card" selection step below.
 *
 * Only the standard £75 plan is driven through the real checkout UI here.
 * The Beta and Charity plans (createBetaCheckoutSession /
 * createCheckoutSession with is_charity) use the exact same underlying
 * mechanism at a different price point and aren't separately re-tested.
 */
import { test, expect } from '@playwright/test'
import Stripe from 'stripe'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { loadEnvLocal } from './support/env'
import { tidy } from './support/db'
import { startStripeListener, type StripeListener } from './support/stripe-listener'

// The spec starts `stripe listen` itself (and stops it), so it no longer depends on a manual step.
let listener: StripeListener | undefined
test.beforeAll(async () => {
  test.setTimeout(60_000)
  listener = await startStripeListener(loadEnvLocal())
})
test.afterAll(() => { listener?.stop() })

test('subscribing via Stripe Checkout activates the organisation for real', async ({ page }) => {
  test.setTimeout(150_000) // real Stripe checkout (~15s) + up to 60s redirect wait + up to 20s webhook poll, with headroom
  const account = loadTestAccount()
  const admin = getAdminClient()
  const env = loadEnvLocal()
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-08-26.dahlia' })

  expect(
    env.STRIPE_WEBHOOK_SECRET,
    'STRIPE_WEBHOOK_SECRET missing from .env.local'
  ).toBeTruthy()

  await login(page, account)
  await page.waitForURL('**/dashboard')
  await page.goto('/upgrade')

  await page.getByRole('button', { name: 'Subscribe now' }).click()
  await page.waitForURL(/^https:\/\/checkout\.stripe\.com\//)

  // ── Fill Stripe's own hosted checkout form with a real test-mode card ───
  await page.getByPlaceholder('email@example.com').fill(account.email)
  // With Managed Payments off, Stripe now also offers Klarna/Revolut Pay (and
  // potentially PayPal) as alternatives, presented as a plain radio list at
  // this page's actual (desktop) viewport -- confirmed directly from a real
  // failure screenshot, after manual narrower-viewport testing had given a
  // misleading picture of an entirely different accordion-with-hidden-
  // toggle-buttons layout that this test was never actually going to hit.
  // None is selected by default -- "card" must be explicitly chosen. A
  // full-row overlay button ("Pay with card") consistently sits on top of
  // the radio input and intercepts a plain click -- force skips that
  // interception check and clicks the radio's own centre regardless,
  // exactly what a real click through that overlay would still land on.
  await page.getByRole('radio', { name: 'card' }).click({ force: true })

  const cardNumberField = page.getByPlaceholder('1234 1234 1234 1234')
  await cardNumberField.waitFor({ state: 'visible', timeout: 10_000 })
  await cardNumberField.fill('4242424242424242')
  await page.getByPlaceholder('MM / YY').fill('1234')
  await page.getByRole('textbox', { name: /CVC/ }).fill('123')
  await page.getByPlaceholder('Full name on card').fill('E2E Test Admin')

  // Billing address: country already defaults to United Kingdom. The
  // autocomplete-driven "Address" field calls a real lookup service and
  // shows a suggestion dropdown -- not reliably automatable -- so switch
  // to the plain manual fields instead.
  await page.getByText('Enter address manually').click()
  await page.getByPlaceholder('Address line 1').fill('1 Example Street')
  await page.getByPlaceholder('Town or city').fill('London')
  const postalCode = page.getByPlaceholder('Postal code')
  await postalCode.fill('SW1A 1AA')
  // Blur the last field and give Stripe's own client-side validation JS a
  // moment to settle before submitting -- clicking "Pay and subscribe"
  // immediately after the last keystroke was observed to sometimes not
  // actually submit at all (button stays idle, no error, no processing
  // state -- a genuine timing race in Stripe's own checkout page, not
  // something wrong on our side).
  await postalCode.blur()
  await page.waitForTimeout(1000)

  const payButton = page.getByRole('button', { name: 'Pay and subscribe' })
  const processingIndicator = page.getByText('Processing')

  // Defensive retry against the same race: click, then confirm within a few
  // seconds that it actually took effect (either the "Processing" state
  // appeared, or Stripe already redirected us away). If neither happened,
  // the click didn't land, and it's safe to click again -- nothing charges
  // until Stripe's own "Processing" state actually completes.
  await payButton.click()
  await page.waitForTimeout(3000)
  const stillOnCheckout = page.url().includes('checkout.stripe.com')
  const isProcessing = await processingIndicator.isVisible().catch(() => false)
  if (stillOnCheckout && !isProcessing) {
    await payButton.click()
  }

  // ── Stripe redirects back to our real success_url ────────────────────────
  // Genuinely completes in ~15-20s end to end with Managed Payments off;
  // 60s leaves real headroom without masking an actually-hung submission.
  await page.waitForURL('**/dashboard?subscribed=1', { timeout: 60_000 })

  let subscriptionId: string | null = null
  try {
    // ── The real webhook (forwarded via `stripe listen`) updates the org ──
    await expect.poll(async () => {
      const { data } = await admin
        .from('organisations')
        .select('subscription_tier, stripe_customer_id, stripe_subscription_id, subscribed_at, data_deletion_due_at')
        .eq('id', account.orgId)
        .single()
      return data?.subscription_tier ?? null
    }, { timeout: 20_000, message: 'organisation never reached subscription_tier=active — is `stripe listen` running and forwarding to /api/stripe-webhook?' }).toBe('active')

    const { data: org, error: orgErr } = await admin
      .from('organisations')
      .select('subscription_tier, stripe_customer_id, stripe_subscription_id, subscribed_at, data_deletion_due_at')
      .eq('id', account.orgId)
      .single()
    expect(orgErr).toBeNull()
    expect(org!.stripe_customer_id).toBeTruthy()
    expect(org!.stripe_subscription_id).toBeTruthy()
    expect(org!.subscribed_at).toBeTruthy()
    expect(org!.data_deletion_due_at).toBeNull()
    subscriptionId = org!.stripe_subscription_id

    // ── Confirm the real Stripe objects too, not just our own DB row ────────
    const subscription = await stripe.subscriptions.retrieve(subscriptionId!)
    expect(subscription.status).toBe('active')
    expect(subscription.customer).toBe(org!.stripe_customer_id)

    // ── The account page reflects it too ─────────────────────────────────
    await page.goto('/dashboard/account?tab=billing')
    await expect(page.getByText('Your subscription is active — £75 per month.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Manage subscription →' })).toBeVisible()
  } finally {
    // ── Cleanup: real Stripe test-mode objects + restore the shared org ────
    if (subscriptionId) {
      await stripe.subscriptions.cancel(subscriptionId).catch(() => {})

      // stripe.subscriptions.cancel() above triggers a genuine, ASYNC
      // customer.subscription.deleted webhook (forwarded by `stripe listen`)
      // that sets this shared org to subscription_tier: 'canceled'. Its
      // delivery isn't ordered against this test's own code -- if it lands
      // after the plain reset below, it silently clobbers the shared fixture
      // org back to 'canceled' for every spec that runs afterwards (a real
      // failure mode observed directly: support-tickets.spec.ts and
      // visitor-login.spec.ts, both of which run later and share this same
      // org, started failing with a redirect to /upgrade). Wait (best-effort,
      // bounded) for that webhook to actually land first, so the final reset
      // below is guaranteed to be the last write regardless of delivery
      // timing -- never throws even if it doesn't land in time, since this
      // is cleanup and must still run the reset either way.
      const deadline = Date.now() + 15_000
      while (Date.now() < deadline) {
        const { data } = await admin
          .from('organisations')
          .select('subscription_tier')
          .eq('id', account.orgId)
          .single()
        if (data?.subscription_tier === 'canceled') break
        await new Promise(r => setTimeout(r, 500))
      }

      const { data: cleanupOrg } = await admin
        .from('organisations')
        .select('stripe_customer_id')
        .eq('id', account.orgId)
        .single()
      if (cleanupOrg?.stripe_customer_id) {
        await stripe.customers.del(cleanupOrg.stripe_customer_id).catch(() => {})
      }
    }
    tidy(await admin
      .from('organisations')
      .update({
        subscription_tier: 'active',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscribed_at: null,
        data_deletion_due_at: null,
      })
      .eq('id', account.orgId), 'subscribe: update organisations')
  }
})
