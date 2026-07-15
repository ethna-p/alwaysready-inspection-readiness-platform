/**
 * SiteHeader — server component.
 * Fetches the user's role to conditionally show the Team link (admins only).
 * Sign-out is delegated to SignOutButton (client component).
 */
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import SignOutButton from './SignOutButton'

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

  return (
    <header className="bg-white border-b border-gray-200 print:hidden">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo — links to dashboard */}
        <a href="/dashboard" aria-label="AlwaysReady — go to dashboard">
          <Image
            src="/alwaysready-logo.svg"
            alt="AlwaysReady"
            width={180}
            height={40}
            style={{ height: 'auto' }}
            priority
          />
        </a>

        {/* Primary nav */}
        <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-6">
          <a
            href="/dashboard"
            className="text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Dashboard
          </a>
          <a
            href="/dashboard/kloes"
            className="text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            KLOEs
          </a>
          <a
            href="/dashboard/daily-report"
            className="text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Daily Report
          </a>
          <a
            href="/dashboard/trend"
            className="text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Trend
          </a>
          <a
            href="/dashboard/inspection-pack"
            className="text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Inspection Pack
          </a>
          {isAdmin && (
            <a
              href="/dashboard/admin/team"
              className="text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
            >
              Team
            </a>
          )}
          <a
            href="/dashboard/support"
            className="relative text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Support
            {hasUnread && (
              <span className="absolute -top-1 -right-2.5 h-2 w-2 rounded-full bg-red-500" aria-label="Unread reply" />
            )}
          </a>
          <a
            href="/dashboard/help"
            className="text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 rounded"
          >
            Help
          </a>
        </nav>

        {/* Sign out */}
        <SignOutButton />
      </div>
    </header>
  )
}
