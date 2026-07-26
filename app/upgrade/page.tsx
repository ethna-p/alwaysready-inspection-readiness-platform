/**
 * /upgrade — shown when a trial has expired.
 * Offers Stripe Checkout for self-service subscription.
 */

import { createCheckoutSession } from '@/app/actions/stripe'

export const metadata = { title: 'Subscribe — AlwaysReady' }

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6 py-8">
      <div className="max-w-3xl w-full text-center">

        {/* Logo mark */}
        <div className="mb-8">
          <span className="inline-block text-4xl font-extrabold tracking-tight text-brand">
            Always<span className="text-brand">Ready</span>
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-brand mb-3">
          Your free trial has ended
        </h1>
        <p className="text-ink text-sm leading-relaxed mb-8">
          Subscribe to keep your data and continue using AlwaysReady. All your
          work is saved — nothing is lost. Subscribe today and pick up exactly
          where you left off.
        </p>

        {/* Pricing card */}
        <div className="bg-card border border-line rounded-2xl mb-6 text-left shadow-sm overflow-hidden">

          {/* Coloured header band — full width */}
          <div className="bg-[#014D4E] px-8 py-5 text-center">
            <p className="text-sm font-semibold text-white uppercase tracking-widest">
              AlwaysReady Subscription
            </p>
          </div>

          {/* Two-panel body: price left, features right. Stacked on mobile. */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] divide-y sm:divide-y-0 sm:divide-x divide-line">

            {/* Left — price + CTA */}
            <div className="p-8 flex flex-col items-center justify-center gap-6">
              <div className="text-center">
                <div className="flex items-baseline gap-1 justify-center">
                  <span className="text-6xl font-extrabold text-brand">£75</span>
                  <span className="text-base text-ink-dim">/ month</span>
                </div>
                <p className="text-xs text-ink-muted mt-2">No setup fee. Cancel any time.</p>
              </div>
              <form action={createCheckoutSession} className="w-full">
                <button
                  type="submit"
                  className="
                    block w-full
                    bg-[#ffd700] text-brand
                    font-bold text-sm
                    py-4 rounded-xl
                    hover:bg-yellow-300
                    focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
                    transition-colors
                    cursor-pointer
                  "
                >
                  Subscribe now
                </button>
              </form>
              <p className="text-xs text-ink-muted text-center">
                <span className="font-semibold text-ink">Need your data?</span>{' '}
                You can download it from Account → Billing at any time. After 30 days your data will be permanently deleted.
              </p>
            </div>

            {/* Right — feature list in 2-column grid */}
            <div className="p-8">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-ink">
                {[
                  'Readiness dashboard with % score by key question area',
                  'Full KLOE tracker with RAG status and priority',
                  'Daily Review Report — what needs attention today',
                  'Audit trail — permanent, tamper-proof record of every update',
                  '8-week readiness trend chart',
                  'Exportable inspection pack',
                  'Role-based access — Admin, Staff, and Visitor',
                  'Visitor logins for CQC inspectors — temporary and expiring',
                  'Team management — add staff, assign KLOEs, reset passwords',
                  'Unlimited users',
                  'Built-in helpdesk support',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-brand font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
