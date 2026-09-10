/**
 * Authenticated layout — wraps all /dashboard/* routes.
 * Adds SiteHeader, TrialBanner, and SiteFooter.
 * Server component — verifies the user session server-side.
 */
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import TrialBanner from '@/components/TrialBanner'
import BetaBanner from '@/components/BetaBanner'
import IdleTimeout from '@/components/IdleTimeout'
import GettingStartedWizard from '@/components/GettingStartedWizard'
import { ensureComplianceRecordsSeeded } from '@/lib/seed-compliance'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // MFA setup renders its own standalone UI and needs no dashboard chrome.
  // More importantly, get_user_org_id() returns NULL for aal1 sessions (by design,
  // per security migration h2), so the profile query below would return nothing
  // for a user who hasn't set up MFA yet — causing a redirect loop. Bail early.
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  if (pathname.startsWith('/dashboard/account/mfa')) {
    return <>{children}</>
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user profile (need org_id first)
  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, onboarding_complete')
    .eq('id', user.id)
    .single()

  // Superadmin has no org — send them to /superadmin rather than looping
  if (!profile?.organisation_id) {
    const superadminEmail = process.env.SUPERADMIN_EMAIL
    redirect(user.email === superadminEmail ? '/superadmin' : '/login')
  }

  // Get org subscription state
  const { data: org } = await supabase
    .from('organisations')
    .select('subscription_tier, trial_expires_at, is_beta')
    .eq('id', profile.organisation_id)
    .single()

  // Block access for orgs that have no active subscription
  if (
    org?.subscription_tier === 'canceled' ||
    org?.subscription_tier === 'past_due'  ||
    (org?.subscription_tier === 'trial' &&
      org.trial_expires_at &&
      new Date(org.trial_expires_at) < new Date())
  ) {
    redirect('/upgrade')
  }

  // Self-heal: ensure compliance records exist (handles transient seed failures at signup)
  await ensureComplianceRecordsSeeded(profile.organisation_id)

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <IdleTimeout />
      <SiteHeader />
      <TrialBanner
        subscriptionTier={org?.subscription_tier ?? 'trial'}
        trialExpiresAt={org?.trial_expires_at ?? null}
      />
      <BetaBanner
        subscriptionTier={org?.subscription_tier ?? 'trial'}
        isBeta={org?.is_beta ?? false}
      />
      <main className="flex-1 w-full px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <GettingStartedWizard />
      <SiteFooter />
    </div>
  )
}
