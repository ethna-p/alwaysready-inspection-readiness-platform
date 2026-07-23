/**
 * /dashboard/account — account settings page.
 * Available to all roles.
 */
import { Suspense } from 'react'
import { getCurrentUserProfile } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/app/actions/stripe'
import ChangePasswordForm from './ChangePasswordForm'
import PersonalContactForm from './PersonalContactForm'
import MfaSection from './MfaSection'
import SubServicesForm from './SubServicesForm'

export const metadata = { title: 'Account Settings — AlwaysReady' }

export default async function AccountPage() {
  const profile = await getCurrentUserProfile()

  // Fetch org data (subscription tier + sub-services) for admin sections
  let enabledSubServices: string[] = []
  let subscriptionTier = 'trial'
  let hasStripeCustomer = false

  if (profile?.role === 'admin' && profile.organisation_id) {
    const supabase = await createClient()
    const [{ data: subServices }, { data: org }] = await Promise.all([
      supabase
        .from('organisation_sub_services')
        .select('sub_service')
        .eq('organisation_id', profile.organisation_id),
      supabase
        .from('organisations')
        .select('subscription_tier, stripe_customer_id')
        .eq('id', profile.organisation_id)
        .single(),
    ])
    enabledSubServices = (subServices ?? []).map(r => r.sub_service)
    subscriptionTier   = org?.subscription_tier ?? 'trial'
    hasStripeCustomer  = !!org?.stripe_customer_id
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#014D4E] mb-1">Account settings</h1>
        <p className="text-sm text-gray-600">
          Signed in as <span className="font-medium text-[#1a1a1a]">{profile?.full_name ?? 'Unknown'}</span>
        </p>
      </div>

      {/* ── Sub-services (admin only) ──────────────────────────────────── */}
      {profile?.role === 'admin' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#014D4E] mb-1">Sub-services we provide</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enable additional checklist items for specialist care your service provides. Changes take effect immediately across all KLOEs.
          </p>
          <SubServicesForm enabledSubServices={enabledSubServices} />
        </div>
      )}

      {/* ── Two-factor authentication ──────────────────────────────────── */}
      <Suspense>
        <MfaSection role={profile?.role ?? null} />
      </Suspense>

      {/* ── Change password ────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#014D4E] mb-1">Change password</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter your current password, then choose a new one.
        </p>
        <ChangePasswordForm />
      </div>

      {/* ── Personal contact details ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#014D4E] mb-1">Notification contact details</h2>
        <p className="text-sm text-gray-600 mb-6">
          Add a personal email or mobile number to receive notifications. These are separate from your login credentials.
        </p>
        <PersonalContactForm
          personalEmail={profile?.personal_email ?? null}
          mobileNumber={profile?.mobile_number ?? null}
        />
      </div>

      {/* ── Subscription (admin only) ──────────────────────────────────── */}
      {profile?.role === 'admin' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#014D4E] mb-1">Subscription</h2>
          <p className="text-sm text-gray-600 mb-4">
            {subscriptionTier === 'active'
              ? 'Your subscription is active — £75 + VAT per month.'
              : subscriptionTier === 'past_due'
              ? 'Your last payment failed. Please update your payment details to restore full access.'
              : 'You are currently on a free trial.'}
          </p>
          {hasStripeCustomer ? (
            <form action={createBillingPortalSession}>
              <button
                type="submit"
                className="text-sm font-medium text-[#014D4E] underline hover:text-[#00b8a6] transition-colors cursor-pointer"
              >
                Manage subscription →
              </button>
            </form>
          ) : subscriptionTier !== 'active' ? (
            <a
              href="/upgrade"
              className="text-sm font-medium text-[#014D4E] underline hover:text-[#00b8a6] transition-colors"
            >
              Subscribe now →
            </a>
          ) : null}
        </div>
      )}
    </div>
  )
}
