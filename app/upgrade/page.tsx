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
            <p className="text-sm font-semibold text-white uppercase tracking-widest flex items-center justify-center gap-2.5">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0">
                <circle cx="11" cy="11" r="11" fill="#FFD700"/>
                <path d="M6 11.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
              <div className="w-full border-t border-line pt-5 text-center space-y-3">
                <p className="text-xs text-ink-muted">
                  <span className="font-semibold text-ink">Not ready to subscribe yet?</span>{' '}
                  Download your data before it is deleted.
                </p>
                <a
                  href="/api/export-data"
                  className="
                    flex items-center justify-center gap-2 w-full
                    border border-line rounded-lg
                    text-xs font-medium text-ink
                    px-4 py-2.5
                    hover:bg-fill transition-colors
                  "
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download field data (CSV)
                </a>
                <a
                  href="/api/export-evidence"
                  className="
                    flex items-center justify-center gap-2 w-full
                    border border-line rounded-lg
                    text-xs font-medium text-ink
                    px-4 py-2.5
                    hover:bg-fill transition-colors
                  "
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download uploaded documents (ZIP)
                </a>
                <p className="text-xs text-ink-muted">After 30 days your data will be permanently deleted.</p>
              </div>
            </div>

            {/* Right — feature list in two independent columns */}
            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 text-sm text-ink">
                {/* Left column */}
                <ul className="space-y-3">
                  {[
                    'Readiness dashboard with % score by key question area',
                    'Daily Review Report — what needs attention today',
                    '8-week readiness trend chart',
                    'Role-based access — Admin, Staff, and Visitor',
                    'Team management — add staff, assign KLOEs, reset passwords',
                    'Built-in helpdesk support',
                    'Mock inspection tool with self-assessed CQC ratings',
                    'Live CQC Register integration — your rating, always up to date',
                    'Evidence file uploads — attach documents to every KLOE',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-brand font-bold mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                {/* Right column */}
                <ul className="space-y-3 mt-3 sm:mt-0">
                  {[
                    'Full KLOE tracker with RAG status and priority',
                    'Audit trail — permanent, tamper-proof record of every update',
                    'Exportable inspection pack',
                    'Temporary visitor logins for CQC inspectors',
                    'Unlimited users',
                    'Fully-featured HR Module',
                    'Two-factor authentication for all accounts',
                    'KLOE assignment — assign ownership to individual team members',
                    'Review frequency tracking — monthly, quarterly, or annual per KLOE',
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
    </div>
  )
}
