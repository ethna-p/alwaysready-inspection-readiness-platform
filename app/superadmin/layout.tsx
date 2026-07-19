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
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1a1a]">
      <IdleTimeout />
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-extrabold tracking-tight text-[#00b8a6]">
            AlwaysReady
          </span>
          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
            Superadmin
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-gray-500">
          <Link href="/superadmin/organisations" className="hover:text-[#014D4E] transition-colors">
            Organisations
          </Link>
          <Link href="/superadmin/provision" className="hover:text-[#014D4E] transition-colors">
            Provision
          </Link>
          <Link href="/superadmin/tickets" className="hover:text-[#014D4E] transition-colors">
            Support Tickets
          </Link>
          <Link href="/superadmin/broadcast" className="hover:text-[#014D4E] transition-colors">
            Broadcast
          </Link>
          <Link href="/dashboard" className="hover:text-[#014D4E] transition-colors">
            ← Dashboard
          </Link>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="hover:text-[#014D4E] transition-colors">
              Sign out
            </button>
          </form>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
