/**
 * Authenticated layout — wraps all /dashboard/* routes.
 * Adds SiteHeader, TrialBanner, and SiteFooter.
 * Server component — verifies the user session server-side.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import TrialBanner from '@/components/TrialBanner'
import IdleTimeout from '@/components/IdleTimeout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    .select('subscription_tier, trial_expires_at, is_demo, demo_expires_at')
    .eq('id', profile.organisation_id)
    .single()

  // If trial has expired, bounce to upgrade page
  if (
    org?.subscription_tier === 'trial' &&
    org.trial_expires_at &&
    new Date(org.trial_expires_at) < new Date()
  ) {
    redirect('/upgrade')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <IdleTimeout />
      <SiteHeader isDemo={org?.is_demo ?? false} />
      <TrialBanner
        isDemo={org?.is_demo ?? false}
        demoExpiresAt={org?.demo_expires_at ?? null}
        subscriptionTier={org?.subscription_tier ?? 'trial'}
        trialExpiresAt={org?.trial_expires_at ?? null}
      />
      <main className="flex-1 w-full px-6 py-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
