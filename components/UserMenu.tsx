'use client'

/**
 * UserMenu — avatar dropdown for utility nav items.
 * Groups: Support, Help, Account, theme toggle, Sign out.
 * Triggered by a circle showing the user's initials.
 */

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

interface UserMenuProps {
  fullName:  string | null
  hasUnread: boolean
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function UserMenu({ fullName, hasUnread }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref  = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = getInitials(fullName)

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`User menu for ${fullName ?? 'user'}`}
        className="
          relative flex items-center justify-center
          w-9 h-9 rounded-full
          bg-[#014D4E] text-white text-sm font-bold
          hover:bg-[#013636]
          focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
          transition-colors select-none
        "
      >
        {initials}
        {hasUnread && (
          <span
            className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-card"
            aria-label="Unread support reply"
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="
            absolute right-0 mt-2 w-52
            bg-card border border-line rounded-xl shadow-lg
            py-1 z-50
            animate-in fade-in slide-in-from-top-1 duration-150
          "
        >
          {/* Name header */}
          {fullName && (
            <div className="px-4 py-2.5 border-b border-line">
              <p className="text-xs font-semibold text-ink truncate">{fullName}</p>
            </div>
          )}

          <Link
            href="/dashboard/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-fill transition-colors"
          >
            <svg className="w-4 h-4 text-ink-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account
          </Link>

          <Link
            href="/dashboard/support"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-fill transition-colors"
          >
            <svg className="w-4 h-4 text-ink-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Support
            {hasUnread && (
              <span className="ml-auto h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            )}
          </Link>

          <Link
            href="/dashboard/help"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-fill transition-colors"
          >
            <svg className="w-4 h-4 text-ink-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help
          </Link>

          <div className="border-t border-line mt-1 pt-1">
            {/* Theme toggle row */}
            <div className="flex items-center gap-3 px-4 py-2">
              <svg className="w-4 h-4 text-ink-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-sm text-ink flex-1">Theme</span>
              <ThemeToggle />
            </div>
          </div>

          <div className="border-t border-line mt-1 pt-1">
            <button
              role="menuitem"
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-fill transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
