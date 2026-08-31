import type Stripe from 'stripe'

/**
 * Maps a Stripe subscription status to the platform's subscription_tier value.
 * Extracted here so it can be unit-tested independently of the route handler.
 */
export function stripeStatusToTier(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled'
    default:
      return 'past_due'
  }
}
