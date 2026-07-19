'use client'

/**
 * MobileNav — hamburger menu for small screens.
 * Rendered inside SiteHeader (server component) with role/state props passed down.
 */

import { useState, useEffect } from 'react'

type Props = {
  isAdmin: boolean
  isDemo: boolean
  hasUnread: boolean
}

const NAV_LINK = 'block text-base font-medium text-[#014D4E] py-3 border-b border-gray-100 hover:text-[#00b8a6] transition-colors'

export default function MobileNav({ isAdmin, isDemo, hasUnread }: Props) {
  const [open, setOpen] = useState(false)

  // Close on route change / escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        className="sm:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        <span className={`block h-0.5 w-5 bg-[#014D4E] transition-all duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block h-0.5 w-5 bg-[#014D4E] transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
        <span className={`block h-0.5 w-5 bg-[#014D4E] transition-all duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Mobile menu panel */}
      {open && (
        <div className="sm:hidden fixed inset-x-0 top-[65px] bottom-0 z-50 bg-white border-t border-gray-200 overflow-y-auto">
          <nav className="px-6 py-2" aria-label="Mobile navigation">

            {isDemo && (
              <a href="https://alwaysready.uk" className={NAV_LINK} onClick={() => setOpen(false)}>
                ← alwaysready.uk
              </a>
            )}

            <a href="/dashboard" className={NAV_LINK} onClick={() => setOpen(false)}>
              Dashboard
            </a>
            <a href="/dashboard/kloes" className={NAV_LINK} onClick={() => setOpen(false)}>
              KLOEs
            </a>
            <a href="/dashboard/daily-report" className={NAV_LINK} onClick={() => setOpen(false)}>
              Daily Report
            </a>
            <a href="/dashboard/trend" className={NAV_LINK} onClick={() => setOpen(false)}>
              Trend
            </a>
            <a href="/dashboard/inspection-pack" className={NAV_LINK} onClick={() => setOpen(false)}>
              Inspection Pack
            </a>
            {isAdmin && (
              <a href="/dashboard/admin/team" className={NAV_LINK} onClick={() => setOpen(false)}>
                Team
              </a>
            )}
            {isAdmin && (
              <a href="/dashboard/hr" className={NAV_LINK} onClick={() => setOpen(false)}>
                HR
              </a>
            )}
            <a href="/dashboard/peoples-voice" className={NAV_LINK} onClick={() => setOpen(false)}>
              People&apos;s Voice
            </a>
            <a href="/dashboard/support" className={`${NAV_LINK} flex items-center gap-2`} onClick={() => setOpen(false)}>
              Support
              {hasUnread && (
                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" aria-label="Unread reply" />
              )}
            </a>
            <a href="/dashboard/help" className={NAV_LINK} onClick={() => setOpen(false)}>
              Help
            </a>
            <a href="/dashboard/account" className={NAV_LINK} onClick={() => setOpen(false)}>
              Account
            </a>
          </nav>
        </div>
      )}
    </>
  )
}
