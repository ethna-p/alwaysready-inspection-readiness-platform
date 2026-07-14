/**
 * SiteHeader — appears on every authenticated page.
 * Logo top-left, sign-out button top-right.
 * Keyboard-navigable, focus rings visible.
 */
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SiteHeader() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo — links to dashboard */}
        <a href="/dashboard" aria-label="AlwaysReady — go to dashboard">
          <Image
            src="/alwaysready-logo.svg"
            alt="AlwaysReady"
            width={180}
            height={40}
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
        </nav>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="
            text-sm font-medium text-[#014D4E]
            hover:underline
            focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
            rounded
          "
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
