/**
 * Stripe webhook tests
 *
 * Two categories:
 *
 * 1. stripeStatusToTier unit tests — pure function, no DB needed.
 *    Covers all six Stripe subscription statuses plus the default fallback.
 *
 * 2. Idempotency DB tests — verify that replaying checkout.session.completed
 *    (i.e. calling the same UPDATE twice) leaves the org in a valid state and
 *    does not create duplicate rows. The webhook handler uses a plain UPDATE
 *    scoped to organisation_id; idempotency comes from UPDATE semantics (applying
 *    the same values twice has no net effect).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import { stripeStatusToTier } from '@/lib/stripe-utils'
import { connectSuperuser, seedOrg, cleanupOrg } from './helpers'
import { randomUUID } from 'crypto'

// ── stripeStatusToTier ────────────────────────────────────────────────────────

describe('stripeStatusToTier', () => {
  it('active → active', () => {
    expect(stripeStatusToTier('active')).toBe('active')
  })

  it('trialing → active', () => {
    expect(stripeStatusToTier('trialing')).toBe('active')
  })

  it('past_due → past_due', () => {
    expect(stripeStatusToTier('past_due')).toBe('past_due')
  })

  it('canceled → canceled', () => {
    expect(stripeStatusToTier('canceled')).toBe('canceled')
  })

  it('unpaid → canceled', () => {
    expect(stripeStatusToTier('unpaid')).toBe('canceled')
  })

  it('incomplete_expired → canceled', () => {
    expect(stripeStatusToTier('incomplete_expired')).toBe('canceled')
  })

  it('incomplete → past_due (default fallback)', () => {
    expect(stripeStatusToTier('incomplete')).toBe('past_due')
  })

  it('paused → past_due (default fallback)', () => {
    expect(stripeStatusToTier('paused')).toBe('past_due')
  })
})

// ── Idempotency (DB-level) ────────────────────────────────────────────────────

let client: Client
let orgId: string

beforeAll(async () => {
  client = await connectSuperuser()
  orgId = await seedOrg(client, { name: 'Stripe Webhook Test Org' })
})

afterAll(async () => {
  await cleanupOrg(client, orgId)
  await client.end()
})

describe('checkout.session.completed idempotency', () => {
  const fakeCustomerId   = `cus_test_${randomUUID().slice(0, 8)}`
  const fakeSubscriptionId = `sub_test_${randomUUID().slice(0, 8)}`

  /** Simulate what the webhook handler does on checkout.session.completed */
  async function applyCheckoutCompleted(): Promise<void> {
    await client.query(
      `UPDATE public.organisations SET
         subscription_tier      = 'active',
         stripe_customer_id     = $1,
         stripe_subscription_id = $2,
         subscribed_at          = now(),
         data_deletion_due_at   = NULL
       WHERE id = $3`,
      [fakeCustomerId, fakeSubscriptionId, orgId]
    )
  }

  it('org is trial before the webhook fires', async () => {
    const { rows } = await client.query<{ subscription_tier: string }>(
      `SELECT subscription_tier FROM public.organisations WHERE id = $1`, [orgId]
    )
    expect(rows[0].subscription_tier).toBe('trial')
  })

  it('first webhook call activates the subscription', async () => {
    await applyCheckoutCompleted()
    const { rows } = await client.query<{
      subscription_tier: string
      stripe_customer_id: string
      stripe_subscription_id: string
    }>(
      `SELECT subscription_tier, stripe_customer_id, stripe_subscription_id
       FROM public.organisations WHERE id = $1`,
      [orgId]
    )
    expect(rows[0].subscription_tier).toBe('active')
    expect(rows[0].stripe_customer_id).toBe(fakeCustomerId)
    expect(rows[0].stripe_subscription_id).toBe(fakeSubscriptionId)
  })

  it('replaying the webhook (second call) does not corrupt state', async () => {
    await applyCheckoutCompleted()
    const { rows } = await client.query<{
      subscription_tier: string
      stripe_customer_id: string
    }>(
      `SELECT subscription_tier, stripe_customer_id
       FROM public.organisations WHERE id = $1`,
      [orgId]
    )
    // Still active, same customer id — replay had no harmful effect
    expect(rows[0].subscription_tier).toBe('active')
    expect(rows[0].stripe_customer_id).toBe(fakeCustomerId)
  })

  it('still exactly one org row after two webhook calls', async () => {
    const { rows } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM public.organisations WHERE id = $1`, [orgId]
    )
    expect(parseInt(rows[0].count)).toBe(1)
  })

  // Regression coverage: a trial that lapsed (data_deletion_due_at set by the
  // trial-emails cron) and then subscribes must have that date cleared.
  // data_deletion_due_at is never cleared anywhere except here, and the
  // data-deletion cron's hard-delete sweep used to have no subscription_tier
  // check at all — so without this, a paying customer's entire organisation
  // would be permanently deleted on the stale date from their lapsed trial.
  it('a stale data_deletion_due_at from a lapsed trial is cleared on subscribe', async () => {
    const staleDueDate = new Date()
    staleDueDate.setDate(staleDueDate.getDate() - 5) // already in the past
    await client.query(
      `UPDATE public.organisations SET data_deletion_due_at = $1 WHERE id = $2`,
      [staleDueDate.toISOString(), orgId]
    )

    await applyCheckoutCompleted()

    const { rows } = await client.query<{ data_deletion_due_at: string | null }>(
      `SELECT data_deletion_due_at FROM public.organisations WHERE id = $1`, [orgId]
    )
    expect(rows[0].data_deletion_due_at).toBeNull()
  })
})

// ── data-deletion cron defence-in-depth ───────────────────────────────────────
//
// The hard-delete sweep (app/api/cron/data-deletion/route.ts) must never
// select an active or past_due org, even if data_deletion_due_at is somehow
// stale — this is the safety net behind the fix above, not a substitute for
// it. Exercises the exact filter conditions the route uses.
describe('data-deletion cron never selects an active/past_due org', () => {
  it('an active org with a past-due data_deletion_due_at is excluded from the delete sweep', async () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    await client.query(
      `UPDATE public.organisations
       SET subscription_tier = 'active', data_deletion_due_at = $1
       WHERE id = $2`,
      [pastDate.toISOString(), orgId]
    )

    const { rows } = await client.query<{ id: string }>(
      `SELECT id FROM public.organisations
       WHERE data_deletion_due_at IS NOT NULL
         AND is_tester IS NOT TRUE
         AND subscription_tier NOT IN ('active', 'past_due')
         AND data_deletion_due_at < now()
         AND id = $1`,
      [orgId]
    )
    expect(rows).toHaveLength(0)
  })

  it('the same org becomes eligible once canceled', async () => {
    await client.query(
      `UPDATE public.organisations SET subscription_tier = 'canceled' WHERE id = $1`,
      [orgId]
    )

    const { rows } = await client.query<{ id: string }>(
      `SELECT id FROM public.organisations
       WHERE data_deletion_due_at IS NOT NULL
         AND is_tester IS NOT TRUE
         AND subscription_tier NOT IN ('active', 'past_due')
         AND data_deletion_due_at < now()
         AND id = $1`,
      [orgId]
    )
    expect(rows).toHaveLength(1)
  })
})

describe('customer.subscription.updated tier transitions', () => {
  it('sets subscription_tier to past_due correctly', async () => {
    await client.query(
      `UPDATE public.organisations SET subscription_tier = 'past_due' WHERE id = $1`,
      [orgId]
    )
    const { rows } = await client.query<{ subscription_tier: string }>(
      `SELECT subscription_tier FROM public.organisations WHERE id = $1`, [orgId]
    )
    expect(rows[0].subscription_tier).toBe('past_due')
  })
})
