/**
 * When a database write fails inside the Stripe webhook, the route must answer 500 so Stripe
 * redelivers the event. It used to log the error and answer 200 ("received"), which Stripe treats
 * as handled and never retries: a paying customer stayed un-activated with nothing to say so.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  event: null as unknown,
  updateError: null as { message: string } | null,
  lookup: { data: null as unknown, error: null as { message: string } | null },
}))

vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent: () => state.event }
  },
}))

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(async () => ({ sent: true })) }))
vi.mock('@/lib/email-templates', () => ({ renderTemplate: vi.fn(async (_k: string, _v: unknown, d: string) => d) }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      const chain: Record<string, unknown> = {}
      const done = () => Promise.resolve({ data: null, error: state.updateError })
      chain.update = () => chain
      chain.select = () => chain
      chain.eq = () => chain
      chain.maybeSingle = () => Promise.resolve(state.lookup)
      chain.single = () => Promise.resolve({ data: null, error: state.updateError })
      chain.then = (res: (v: unknown) => unknown) => done().then(res)
      return chain
    },
  }),
}))

import { POST } from '@/app/api/stripe-webhook/route'

function request() {
  return new Request('http://localhost/api/stripe-webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig' },
    body: '{}',
  }) as unknown as import('next/server').NextRequest
}

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  process.env.STRIPE_SECRET_KEY = 'sk_test_x'
  state.updateError = null
  state.lookup = { data: null, error: null }
})

describe('stripe-webhook database failures', () => {
  it('answers 500 when activating the organisation fails', async () => {
    state.event = {
      id: 'evt_1', type: 'checkout.session.completed',
      data: { object: { metadata: { organisation_id: 'org-1' }, customer: 'cus_1', subscription: 'sub_1' } },
    }
    state.updateError = { message: 'connection reset' }
    expect((await POST(request())).status).toBe(500)
  })

  it('answers 500 when a renewal payment update fails', async () => {
    state.event = { id: 'evt_2', type: 'invoice.payment_succeeded', data: { object: { subscription: 'sub_1' } } }
    state.updateError = { message: 'timeout' }
    expect((await POST(request())).status).toBe(500)
  })

  it('answers 500 when a payment failure update fails', async () => {
    state.event = { id: 'evt_3', type: 'invoice.payment_failed', data: { object: { subscription: 'sub_1' } } }
    state.updateError = { message: 'timeout' }
    expect((await POST(request())).status).toBe(500)
  })

  it('answers 500 when looking up the organisation for a cancellation fails', async () => {
    state.event = { id: 'evt_4', type: 'customer.subscription.deleted', data: { object: { id: 'sub_1' } } }
    state.lookup = { data: null, error: { message: 'timeout' } }
    expect((await POST(request())).status).toBe(500)
  })

  it('still answers 200 when the writes succeed', async () => {
    state.event = { id: 'evt_5', type: 'invoice.payment_succeeded', data: { object: { subscription: 'sub_1' } } }
    expect((await POST(request())).status).toBe(200)
  })

  it('still answers 200 for a cancellation with no matching organisation (retrying cannot fix that)', async () => {
    state.event = { id: 'evt_6', type: 'customer.subscription.deleted', data: { object: { id: 'sub_missing' } } }
    expect((await POST(request())).status).toBe(200)
  })
})
