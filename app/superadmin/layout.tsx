/**
 * Superadmin layout — wraps all /superadmin/* routes.
 * Access is gated in middleware.ts by SUPERADMIN_EMAIL (page loads) and
 * lib/assert-superadmin.ts (server actions, independent of middleware).
 * This layout adds a simple top bar so it's clear you're in superadmin mode.
 */
import Link from 'next/link'
import IdleTimeout from '@/components/IdleTimeout'
import RefreshButton from '@/app/superadmin/RefreshButton'

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <IdleTimeout storageKey="superadmin_idle_timeout" />
      {/* Top bar — identity row (logo, Superadmin badge, sign out) above a
          full-width nav row. Previously the nav was absolutely centered over
          the identity row, and once enough links were added its left edge
          landed under the logo/badge, which sat on top and hid
          "Organisations" (the first link) behind an opaque background. */}
      <header className="bg-card border-b border-line">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="https://www.alwaysready.uk" target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/alwaysready-logo.svg" alt="AlwaysReady" className="h-8 w-auto" />
            </a>
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
              Superadmin
            </span>
            <RefreshButton />
          </div>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="text-sm text-ink-muted hover:text-brand transition-colors">
              Sign out
            </button>
          </form>
        </div>
        <nav className="px-6 py-2 border-t border-line flex items-center gap-6 flex-wrap text-sm text-ink-muted">
          <Link href="/superadmin/organisations" className="hover:text-brand transition-colors">
            Organisations
          </Link>
          <Link href="/superadmin/provision" className="hover:text-brand transition-colors">
            Provision
          </Link>
          <Link href="/superadmin/leads" className="hover:text-brand transition-colors">
            Leads
          </Link>
          <Link href="/superadmin/campaigns" className="hover:text-brand transition-colors">
            Campaigns
          </Link>
          <Link href="/superadmin/tickets" className="hover:text-brand transition-colors">
            Support Tickets
          </Link>
          <Link href="/superadmin/broadcast" className="hover:text-brand transition-colors">
            Broadcast
          </Link>
          <Link href="/superadmin/metrics" className="hover:text-brand transition-colors">
            Metrics
          </Link>
          <Link href="/superadmin/infrastructure" className="hover:text-brand transition-colors">
            Infrastructure
          </Link>
          <Link href="/superadmin/email-log" className="hover:text-brand transition-colors">
            Email log
          </Link>
          <Link href="/superadmin/test-emails" className="hover:text-brand transition-colors">
            Test emails
          </Link>
          <Link href="/superadmin/email-templates" className="hover:text-brand transition-colors">
            Email templates
          </Link>
          <Link href="/superadmin/notification-feedback" className="hover:text-brand transition-colors">
            Notification feedback
          </Link>
          <Link href="/superadmin/account" className="hover:text-brand transition-colors">
            Account
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
