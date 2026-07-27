/**
 * /upgrade/beta — Beta Partner Programme landing page.
 * Shown when a trial user clicks "Find out more" from the dashboard beta banner.
 * Only shows the £50 Beta Partner offer — not the standard £75 subscription.
 */

import { createBetaCheckoutSession } from '@/app/actions/stripe'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Beta Partner Programme — AlwaysReady' }

export default async function UpgradeBetaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6 py-12">
      <div className="max-w-4xl w-full">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="11" cy="11" r="11" fill="#ffd700"/>
              <path d="M6 11.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-2xl font-extrabold tracking-tight text-[#014D4E]">AlwaysReady</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ink mb-3">Beta Partner Programme</h1>
          <p className="text-ink-muted text-sm leading-relaxed max-w-lg mx-auto">
            You are already using AlwaysReady — help us make it even better, and lock in a significantly
            reduced subscription rate for life.
          </p>
        </div>

        {/* 2-column card */}
        <div className="bg-card border border-[#00b8a6] rounded-2xl shadow-sm overflow-hidden mb-6">

          {/* Header band */}
          <div className="bg-[#00b8a6] px-8 py-4 text-center">
            <p className="text-sm font-semibold text-white uppercase tracking-widest">
              Beta Partner — £50/month
            </p>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-line">

            {/* Left — price, CTA, T&Cs */}
            <div className="p-8 flex flex-col gap-6">
              <div className="text-center">
                <div className="flex items-baseline gap-1 justify-center">
                  <span className="text-6xl font-extrabold text-[#014D4E]">£50</span>
                  <span className="text-base text-ink-muted">/ month</span>
                </div>
                <p className="text-sm text-ink-muted mt-2">Price locked in. Forever.*</p>
              </div>

              {user ? (
                <form action={createBetaCheckoutSession}>
                  <button
                    type="submit"
                    className="
                      block w-full
                      bg-[#00b8a6] hover:bg-[#009e8e] text-white
                      font-bold text-sm
                      py-4 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:ring-offset-2
                      transition-colors cursor-pointer
                    "
                  >
                    Become a Beta Partner →
                  </button>
                </form>
              ) : (
                <a
                  href="/login"
                  className="
                    block w-full text-center
                    bg-[#00b8a6] hover:bg-[#009e8e] text-white
                    font-bold text-sm
                    py-4 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:ring-offset-2
                    transition-colors
                  "
                >
                  Log in to join →
                </a>
              )}

              <p className="text-center text-xs text-ink-muted">
                Limited places available. No setup fee. Cancel any time.
              </p>

              {/* T&Cs small print */}
              <div className="border-t border-line pt-5 text-xs text-ink-muted leading-relaxed space-y-2">
                <p className="font-semibold text-ink">* Beta Partner terms</p>
                <p>
                  Your £50/month rate is permanently protected — you will never be charged standard pricing.
                  Your rate may increase modestly over time in line with the cost of living, but will always
                  remain significantly below the standard subscription price.
                </p>
              </div>
            </div>

            {/* Right — what you get + what we ask */}
            <div className="p-8 flex flex-col gap-7">

              <div>
                <h2 className="text-xs font-semibold text-ink uppercase tracking-wider mb-4">What you get</h2>
                <ul className="space-y-3 text-sm text-ink">
                  {[
                    'Everything in the full AlwaysReady subscription',
                    'Your £50/month rate locked in permanently',
                    'Direct input into the platform as it develops',
                    'Your feedback shapes features and priorities',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="text-[#00b8a6] font-bold mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-line pt-6">
                <h2 className="text-xs font-semibold text-ink uppercase tracking-wider mb-4">What we ask in return</h2>
                <ul className="space-y-3 text-sm text-ink-muted">
                  {[
                    'Flag anything that does not work as expected',
                    'Spot typos, suggest FAQ updates, share your wish list',
                    "After a couple of months of consistent use, we'd love it if you could leave an honest review on Trustpilot — we'll send you a direct reviewer link to make it easy",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="text-[#014D4E] shrink-0 mt-0.5">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a href="/dashboard" className="text-sm text-ink-muted hover:text-ink transition-colors">
            ← Back to dashboard
          </a>
        </div>

      </div>
    </div>
  )
}
