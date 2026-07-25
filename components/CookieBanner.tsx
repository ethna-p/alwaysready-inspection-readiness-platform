'use client'

/**
 * CookieBanner
 *
 * Informs users that the site uses essential cookies only.
 * No tracking, no analytics — so no accept/reject choice is needed.
 * Dismissed state is stored in a cookie for 365 days.
 */

import { useState, useEffect } from 'react'

const COOKIE_NAME = 'cookie_notice_dismissed'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year in seconds

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1]
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getCookie(COOKIE_NAME)) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    document.cookie = `${COOKIE_NAME}=1; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      aria-live="polite"
      className="
        fixed bottom-0 inset-x-0 z-50
        bg-[#014D4E] text-white
        px-4 py-4
        print:hidden
      "
    >
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm leading-relaxed">
          This site uses cookies that are strictly necessary to keep it working — for example, to keep you logged in.
          We do not use tracking or advertising cookies.{' '}
          <a
            href="/dashboard/help#data-retention"
            className="underline hover:text-[#80cbc4] focus:outline-none focus:ring-1 focus:ring-white rounded"
          >
            Find out more
          </a>
          .
        </p>
        <button
          onClick={dismiss}
          className="
            shrink-0
            bg-white text-[#014D4E] font-semibold text-sm
            px-5 py-2 rounded-lg
            hover:bg-[#e0f2f1]
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#014D4E]
            transition-colors
          "
        >
          OK, got it
        </button>
      </div>
    </div>
  )
}
