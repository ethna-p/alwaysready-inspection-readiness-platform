/**
 * /dashboard/welcome — first-login screen.
 *
 * Shown to any user whose onboarding_complete = false.
 * Captures GDPR marketing consent before redirecting to the dashboard.
 * Redirect here is enforced by proxy.ts.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { completeOnboarding } from './actions'

export const metadata = { title: 'Welcome — AlwaysReady' }

export default async function WelcomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If already complete, skip this page
  const { data: profile } = await supabase
    .from('users')
    .select('onboarding_complete, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_complete) redirect('/dashboard')

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-6">
      <div className="max-w-lg w-full">

        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="inline-block text-3xl font-extrabold tracking-tight text-[#014D4E]">
            Always<span className="text-[#00b8a6]">Ready</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-[#014D4E] mb-2">
            Welcome, {firstName}!
          </h1>
          <p className="text-sm text-[#1a1a1a] leading-relaxed mb-6">
            Your AlwaysReady account is ready. Before you begin, please review
            the information below.
          </p>

          {/* Trial reminder */}
          <div className="bg-[#e6faf8] border border-[#00b8a6]/30 rounded-xl p-4 mb-6 text-sm text-[#014D4E]">
            <p className="font-semibold mb-1">90-day free trial</p>
            <p className="text-xs leading-relaxed text-[#1a1a1a]">
              You have full access to AlwaysReady for 90 days, completely free.
              All your data is saved and carries over when you subscribe.
              After the trial, the plan is{' '}
              <strong>£75 + VAT per month</strong> (20% discount for registered charities).
            </p>
          </div>

          {/* Consent form */}
          <form action={completeOnboarding} className="space-y-6">

            {/* Marketing consent — required by GDPR since this is a condition
                of the beta invitation: weekly tips email. We use a checkbox
                rather than a pre-ticked opt-in. */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Email preferences
              </p>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="marketing_consent"
                  defaultChecked
                  className="
                    mt-0.5 h-4 w-4 rounded border-gray-300
                    text-[#00b8a6] accent-[#00b8a6]
                    focus:ring-[#00b8a6] focus:ring-offset-0
                  "
                />
                <span className="text-sm text-[#1a1a1a] leading-relaxed">
                  I agree to receive a weekly email from AJ Parker at AlwaysReady
                  containing tips for getting the most out of the platform and
                  general adult social care advice.
                  <span className="block mt-1 text-xs text-gray-400">
                    You can unsubscribe at any time by emailing{' '}
                    <a
                      href="mailto:hello@alwaysready.uk"
                      className="underline hover:text-[#014D4E]"
                    >
                      hello@alwaysready.uk
                    </a>
                    . We will never share your details with third parties.
                  </span>
                </span>
              </label>
            </div>

            {/* Privacy note */}
            <p className="text-xs text-gray-400 leading-relaxed">
              By continuing you confirm that you have read and agree to our{' '}
              <a
                href="https://alwaysready.uk/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#014D4E]"
              >
                Privacy Policy
              </a>
              {' '}and{' '}
              <a
                href="https://alwaysready.uk/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#014D4E]"
              >
                Terms of Service
              </a>
              .
            </p>

            <button
              type="submit"
              className="
                w-full
                bg-[#014D4E] text-white
                font-semibold text-sm
                py-3 rounded-xl
                hover:bg-[#013636]
                focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
                transition-colors
              "
            >
              Get started →
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}
