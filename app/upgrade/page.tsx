/**
 * /upgrade — shown when a trial has expired.
 * Offers Stripe Checkout for self-service subscription.
 */

import { createCheckoutSession } from '@/app/actions/stripe'

export const metadata = { title: 'Subscribe — AlwaysReady' }

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-6 py-8">
      <div className="max-w-lg w-full text-center">

        {/* Logo mark */}
        <div className="mb-8">
          <span className="inline-block text-4xl font-extrabold tracking-tight text-[#014D4E]">
            Always<span className="text-[#014D4E]">Ready</span>
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-[#014D4E] mb-3">
          Your free trial has ended
        </h1>
        <p className="text-[#1a1a1a] text-sm leading-relaxed mb-8">
          Subscribe to keep your data and continue using AlwaysReady. All your
          work is saved — nothing is lost. Subscribe today and pick up exactly
          where you left off.
        </p>

        {/* Pricing card */}
        <div className="bg-white border border-gray-200 rounded-2xl mb-6 text-left shadow-sm overflow-hidden">
          {/* Coloured header band */}
          <div className="bg-[#014D4E] px-8 py-5 text-center">
            <p className="text-sm font-semibold text-white uppercase tracking-widest">
              AlwaysReady Subscription
            </p>
          </div>
          <div className="p-8">
          <div className="flex items-baseline gap-1 justify-center">
            <span className="text-6xl font-extrabold text-[#014D4E]">£75</span>
            <span className="text-base text-gray-600">+ VAT / month</span>
          </div>

          <hr className="my-8 border-gray-200" />

          <ul className="space-y-3 text-sm text-[#1a1a1a] mb-8">
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
                <span className="text-[#014D4E] font-bold mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-600 mb-4">
            Registered charities receive a 20% discount — mention your charity
            number when you get in touch.
          </p>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-[#1a1a1a]">Need to export your data?</span> Your records are kept for 30 days after your trial ends. Email{' '}
              <a href="mailto:hello@alwaysready.uk" className="underline hover:text-[#014D4E]">hello@alwaysready.uk</a>{' '}
              and we'll send you a full export in CSV format within 5 working days.
            </p>
          </div>
          </div>
        </div>

        {/* CTA — Stripe Checkout */}
        <form action={createCheckoutSession}>
          <button
            type="submit"
            className="
              block w-full
              bg-[#ffd700] text-[#014D4E]
              font-bold text-sm
              py-4 rounded-xl
              hover:bg-yellow-300
              focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
              transition-colors
              mb-4
              cursor-pointer
            "
          >
            Subscribe Now — £75 + VAT / month
          </button>
        </form>



      </div>
    </div>
  )
}
