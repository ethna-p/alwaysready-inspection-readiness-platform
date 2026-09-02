'use client'

/**
 * IdleTimeout — auto-logout after a configurable period of inactivity.
 *
 * Behaviour:
 *   - Resets the idle timer on any user activity (mouse, keyboard, touch, scroll).
 *   - One minute before logout: shows a warning dialog with a "Stay logged in" button.
 *   - At the timeout: signs the user out via Supabase and redirects to /login.
 *
 * Props:
 *   storageKey — if provided, reads the timeout preference (in minutes) from
 *                localStorage at this key. Valid values: 15, 30, 60. Falls back
 *                to 15 minutes if the key is absent or invalid.
 *                The dashboard layout omits this prop so tenant users always
 *                get the fixed 15-minute default.
 *
 * Implementation notes:
 *   - The warning state is tracked in BOTH a React state (for rendering) and a ref
 *     (for the reset handler). Using only state would cause the event-listener
 *     useEffect to re-run whenever showWarning changes, which would clear the
 *     in-flight logout timer and restart the timers — so the logout never fires.
 *     The ref breaks that dependency cycle while keeping the state for UI rendering.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const WARN_BEFORE_MS = 1 * 60 * 1000  // always warn 1 minute before logout

const VALID_MINUTES = [15, 30, 60] as const

function getIdleTimeoutMs(storageKey?: string): number {
  if (!storageKey || typeof window === 'undefined') return 15 * 60 * 1000
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const mins = parseInt(stored, 10)
      if ((VALID_MINUTES as readonly number[]).includes(mins)) return mins * 60 * 1000
    }
  } catch { /* ignore */ }
  return 15 * 60 * 1000
}

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const

export default function IdleTimeout({ storageKey }: { storageKey?: string } = {}) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(60)

  // Computed once on mount from localStorage (or default).
  // warnAtMsRef is stable for the component lifetime; warnMinutes drives the warning text.
  const idleTimeoutMs = getIdleTimeoutMs(storageKey)
  const warnAtMsRef   = useRef(idleTimeoutMs - WARN_BEFORE_MS)
  const warnMinutes   = Math.round(idleTimeoutMs / 60000) - 1

  const warnTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  // Mirror showWarning in a ref so the event handler can check it without
  // becoming a dep of the event-listener useEffect.
  const showWarningRef = useRef(false)
  useEffect(() => { showWarningRef.current = showWarning }, [showWarning])

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

    // Warn 1 minute before logout
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

      // Sign out after warning period
      logoutTimerRef.current = setTimeout(() => {
        signOut()
      }, WARN_BEFORE_MS)
    }, warnAtMsRef.current)
  }, [clearAllTimers, signOut])

  const stayLoggedIn = useCallback(() => {
    startTimers()
  }, [startTimers])

  // Register activity listeners once — uses ref to check showWarning so
  // the effect doesn't re-run (and clear timers) when warning state changes.
  useEffect(() => {
    startTimers()

    const handleActivity = () => {
      if (showWarningRef.current) return   // don't reset mid-warning
      startTimers()
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true })
    }

    return () => {
      clearAllTimers()
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // intentionally empty — startTimers/clearAllTimers are stable

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
      <div className="relative bg-card rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
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

        <h2 id="idle-warning-title" className="text-lg font-bold text-ink mb-2">
          Still there?
        </h2>
        <p id="idle-warning-desc" className="text-sm text-ink-dim mb-1">
          You&apos;ve been inactive for {warnMinutes} {warnMinutes === 1 ? 'minute' : 'minutes'}.
        </p>
        <p className="text-sm text-ink-dim mb-6">
          For security, you&apos;ll be logged out in{' '}
          <span className="font-bold text-brand">
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
              w-full text-sm text-ink-dim
              px-5 py-2.5 rounded-lg
              hover:text-ink hover:bg-fill
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
