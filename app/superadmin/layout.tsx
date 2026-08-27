/**
 * Superadmin layout — wraps all /superadmin/* routes.
 * Access is gated in proxy.ts by SUPERADMIN_EMAIL.
 * This layout adds a simple top bar so it's clear you're in superadmin mode.
 */
import Link from 'next/link'
import IdleTimeout from '@/components/IdleTimeout'

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <IdleTimeout />
      {/* Top bar */}
      <header className="bg-card border-b border-line px-6 py-3 flex items-center justify-between relative">
        <div className="flex items-center gap-4">
          <a href="https://www.alwaysready.uk" target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/alwaysready-logo.svg" alt="AlwaysReady" className="h-8 w-auto" />
          </a>
          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
            Superadmin
          </span>
        </div>
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 text-sm text-ink-muted">
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
          <Link href="/superadmin/email-log" className="hover:text-brand transition-colors">
            Email log
          </Link>
          <Link href="/superadmin/test-emails" className="hover:text-brand transition-colors">
            Test emails
          </Link>
          <Link href="/superadmin/account" className="hover:text-brand transition-colors">
            Account
          </Link>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="hover:text-brand transition-colors">
              Sign out
            </button>
          </form>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
