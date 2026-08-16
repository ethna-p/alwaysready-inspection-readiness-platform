/**
 * SiteHeader — server component.
 * Fetches the user's role to conditionally show the Team link (admins only).
 * Sign-out is delegated to SignOutButton (client component).
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import MobileNav from './MobileNav'
import UserMenu from './UserMenu'

export default async function SiteHeader() {
  const supabase = await createClient()
  const profile = await getCurrentUserProfile()
  const isAdmin = profile?.role === 'admin'

  // Count unread staff replies for this org (RLS scopes this automatically)
  const { count: unreadCount } = await supabase
    .from('support_ticket_replies')
    .select('id', { count: 'exact', head: true })
    .eq('is_staff_reply', true)
    .is('read_at', null)

  const hasUnread = (unreadCount ?? 0) > 0

  // Org logo — shown in header if the org has uploaded one
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgData } = await (supabase as any)
    .from('organisations')
    .select('logo_url')
    .eq('id', profile?.organisation_id ?? '')
    .single() as { data: { logo_url: string | null } | null }
  const orgLogoUrl = orgData?.logo_url ?? null

  return (
    <header className="bg-card border-b border-line print:hidden">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo — links to dashboard */}
        <div className="flex items-center gap-4">
          <a
            href="https://www.alwaysready.uk"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="AlwaysReady — visit marketing site"
          >
            {/* Show org logo if uploaded, otherwise fall back to AlwaysReady wordmark */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={orgLogoUrl ?? '/alwaysready-logo.svg'}
              alt={orgLogoUrl ? 'Organisation logo' : 'AlwaysReady'}
              style={{ height: '48px', maxWidth: '280px', width: 'auto', display: 'block', objectFit: 'contain' }}
            />
          </a>
        </div>

        {/* Primary nav — use Link (soft navigation) so pagehide is never triggered */}
        <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/kloes"
            className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            KLOEs
          </Link>
          <Link
            href="/dashboard/daily-report"
            className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Daily Report
          </Link>
          <Link
            href="/dashboard/analytics"
            className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Analytics
          </Link>
          <Link
            href="/dashboard/inspection-pack"
            className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Inspection Pack
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/hr"
              className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
            >
              HR
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/newsletter"
              className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
            >
              Newsletter
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/mock-inspections"
              className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
            >
              Mock Inspection
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/reports"
              className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
            >
              Reports
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/governance"
              className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
            >
              Governance
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/post-inspection"
              className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
            >
              Post-Inspection
            </Link>
          )}
          <Link
            href="/dashboard/incidents"
            className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Incidents
          </Link>
          <Link
            href="/dashboard/feedback"
            className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Feedback
          </Link>
          <Link
            href="/dashboard/peoples-voice"
            className="text-sm font-semibold text-ink hover:text-brand focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            People&apos;s Voice
          </Link>
        </nav>

        {/* Desktop: user menu | Mobile: hamburger */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <UserMenu fullName={profile?.full_name ?? null} hasUnread={hasUnread} />
          </div>
          <MobileNav isAdmin={isAdmin} hasUnread={hasUnread} />
        </div>
      </div>
    </header>
  )
}
