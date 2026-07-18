'use client'

/**
 * IdleTimeout — auto-logout after 15 minutes of inactivity.
 *
 * Behaviour:
 *   - Resets a 15-minute timer on any user activity (mouse, keyboard, touch, scroll).
 *   - At 14 minutes: shows a warning dialog with a "Stay logged in" button.
 *   - At 15 minutes: signs the user out via Supabase and redirects to /login.
 *
 * Usage: drop into any layout that wraps authenticated routes. It renders nothing
 * visible until the warning triggers.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const IDLE_TIMEOUT_MS  = 15 * 60 * 1000  // 15 minutes
const WARN_BEFORE_MS   =  1 * 60 * 1000  //  1 minute before logout
const WARN_AT_MS       = IDLE_TIMEOUT_MS - WARN_BEFORE_MS  // 14 minutes

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const

export default function IdleTimeout() {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(60)

  const warnTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearAllTimers = useCallback(() => {
    if (warnTimerRef.current)   clearTimeout(warnTimerRef.current)
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    if (countdownRef.current)   clearInterval(countdownRef.current)
  }, [])

  const signOut = useCallback(async () => {
    clearAllTimers()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login?reason=idle')
  }, [clearAllTimers, router])

  const startTimers = useCallback(() => {
    clearAllTimers()
    setShowWarning(false)

    // Warn at 14 minutes
    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsLeft(60)

      // Countdown display
      countdownRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current)
            return 0
          }
          return s - 1
        })
      }, 1_000)

      // Sign out at 15 minutes
      logoutTimerRef.current = setTimeout(() => {
        signOut()
      }, WARN_BEFORE_MS)
    }, WARN_AT_MS)
  }, [clearAllTimers, signOut])

  const resetTimer = useCallback(() => {
    if (showWarning) return  // don't reset mid-warning via accidental mouse move
    startTimers()
  }, [showWarning, startTimers])

  const stayLoggedIn = useCallback(() => {
    startTimers()
  }, [startTimers])

  useEffect(() => {
    startTimers()

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true })
    }

    return () => {
      clearAllTimers()
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer)
      }
    }
  }, [startTimers, resetTimer, clearAllTimers])

  if (!showWarning) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-warning-title"
      aria-describedby="idle-warning-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <h2 id="idle-warning-title" className="text-lg font-bold text-[#1a1a1a] mb-2">
          Still there?
        </h2>
        <p id="idle-warning-desc" className="text-sm text-gray-600 mb-1">
          You&apos;ve been inactive for 14 minutes.
        </p>
        <p className="text-sm text-gray-600 mb-6">
          For security, you&apos;ll be logged out in{' '}
          <span className="font-bold text-[#014D4E]">
            {secondsLeft} {secondsLeft === 1 ? 'second' : 'seconds'}
          </span>.
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={stayLoggedIn}
            className="
              w-full bg-[#014D4E] text-white text-sm font-medium
              px-5 py-2.5 rounded-lg
              hover:bg-[#013838]
              focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
              transition-colors
            "
          >
            Stay logged in
          </button>
          <button
            type="button"
            onClick={signOut}
            className="
              w-full text-sm text-gray-600
              px-5 py-2.5 rounded-lg
              hover:text-[#1a1a1a] hover:bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-gray-300
              transition-colors
            "
          >
            Log out now
          </button>
        </div>
      </div>
    </div>
  )
}
