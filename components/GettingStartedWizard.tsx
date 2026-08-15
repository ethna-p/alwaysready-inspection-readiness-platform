'use client'

/**
 * GettingStartedWizard
 *
 * A floating getting-started panel anchored to the bottom-right of the
 * dashboard. It tracks four setup steps derived from real platform data,
 * fires a confetti burst on first open and on completing all four steps,
 * and quietly auto-hides once dismissed.
 *
 * State is persisted in localStorage so it survives page navigation:
 *   ar_wizard_open      — whether the panel is expanded
 *   ar_wizard_confetti  — whether the opening confetti has already fired
 *   ar_wizard_dismissed — whether the user has permanently dismissed it
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import confetti from 'canvas-confetti'

interface WizardStatus {
  hasKloeRating:  boolean
  hasEvidence:    boolean
  hasTeamMember:  boolean
  hasHrRecord:    boolean
}

const STEPS = [
  {
    key:         'hasKloeRating' as keyof WizardStatus,
    title:       'Rate your first KLOE',
    description: 'Open any KLOE and set your current compliance rating. Even one entry brings your readiness dashboard to life.',
    href:        '/dashboard/kloes',
    cta:         'Go to KLOEs',
  },
  {
    key:         'hasEvidence' as keyof WizardStatus,
    title:       'Upload your first piece of evidence',
    description: 'Attach a policy, audit, or certificate directly to a KLOE so you can demonstrate compliance during an inspection.',
    href:        '/dashboard/kloes',
    cta:         'Go to KLOEs',
  },
  {
    key:         'hasTeamMember' as keyof WizardStatus,
    title:       'Invite a team member',
    description: 'Give a colleague their own login. Shared responsibility means evidence gets added regularly, not all at once.',
    href:        '/dashboard/account?tab=team',
    cta:         'Go to Team',
  },
  {
    key:         'hasHrRecord' as keyof WizardStatus,
    title:       'Add your first staff record',
    description: 'Create one HR profile to get started. DBS checks, training records, and supervision logs all live here.',
    href:        '/dashboard/hr',
    cta:         'Go to HR',
  },
]

const LS_OPEN      = 'ar_wizard_open'
const LS_CONFETTI  = 'ar_wizard_confetti'
const LS_DISMISSED = 'ar_wizard_dismissed'

function ls(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* */ }
}

// ── Confetti helpers ──────────────────────────────────────────────────────────

function fireOpeningConfetti() {
  // Small burst from bottom-right — celebratory but subtle
  confetti({
    particleCount: 60,
    spread:        70,
    origin:        { x: 0.92, y: 0.85 },
    colors:        ['#ffd700', '#014D4E', '#00b8a6', '#ffffff'],
    ticks:         180,
    gravity:       1.2,
    scalar:        0.9,
  })
}

function fireCompletionConfetti() {
  // Bigger party: two cannons from the sides
  const count = 120
  confetti({ particleCount: count / 2, angle: 60,  spread: 55, origin: { x: 0, y: 0.65 }, colors: ['#ffd700', '#014D4E', '#00b8a6'] })
  confetti({ particleCount: count / 2, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors: ['#ffd700', '#014D4E', '#00b8a6'] })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GettingStartedWizard() {
  // Lazy initialisers read localStorage synchronously on first render so the
  // component never starts in the wrong visual state (avoids the flash where
  // the panel briefly appears open before collapsing on every hard refresh).
  const [dismissed, setDismissed]   = useState(() => ls(LS_DISMISSED) === '1')
  const [open, setOpen]             = useState(() => ls(LS_DISMISSED) !== '1' && ls(LS_OPEN) !== '0')
  const [status, setStatus]         = useState<WizardStatus | null>(null)
  const [allDone, setAllDone]       = useState(false)
  const prevAllDone                 = useRef(false)
  const openConfettiFired           = useRef(ls(LS_CONFETTI) === '1')

  // ── Fetch wizard status ────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/wizard-status')
      if (!res.ok) return
      const data: WizardStatus = await res.json()
      setStatus(data)
      const done = data.hasKloeRating && data.hasEvidence && data.hasTeamMember && data.hasHrRecord
      setAllDone(done)
    } catch { /* network error — silently ignore */ }
  }, [])

  useEffect(() => {
    if (dismissed) return
    fetchStatus()
    // Poll every 20s so steps tick off as the user navigates the platform
    const id = setInterval(fetchStatus, 20_000)
    return () => clearInterval(id)
  }, [dismissed, fetchStatus])

  // ── Fire opening confetti once ─────────────────────────────────────────────
  useEffect(() => {
    if (dismissed || !open || !status || openConfettiFired.current) return
    if (allDone) return // skip opening burst if already complete
    openConfettiFired.current = true
    lsSet(LS_CONFETTI, '1')
    // Small delay so the panel has rendered first
    const t = setTimeout(fireOpeningConfetti, 400)
    return () => clearTimeout(t)
  }, [dismissed, open, status, allDone])

  // ── Fire completion confetti when all steps tick off ───────────────────────
  useEffect(() => {
    if (!allDone || prevAllDone.current) return
    prevAllDone.current = true
    fireCompletionConfetti()
    // Auto-dismiss after 6s so the celebration moment lands, then tidies up
    const t = setTimeout(() => {
      lsSet(LS_DISMISSED, '1')
      setDismissed(true)
    }, 6_000)
    return () => clearTimeout(t)
  }, [allDone])

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleToggle() {
    setOpen(v => {
      lsSet(LS_OPEN, v ? '0' : '1')
      return !v
    })
  }

  function handleDismiss() {
    lsSet(LS_DISMISSED, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  const completedCount = status
    ? STEPS.filter(s => status[s.key]).length
    : 0

  const progressPct = (completedCount / STEPS.length) * 100

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-80 shadow-2xl rounded-2xl overflow-hidden"
      style={{ filter: 'drop-shadow(0 8px 32px rgba(1,77,78,0.18))' }}
    >
      {/* ── Header ── */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        style={{ background: '#014D4E' }}
        aria-expanded={open}
        aria-label={open ? 'Collapse getting started guide' : 'Expand getting started guide'}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-white tracking-wide">
            {allDone ? '🎉 You\'re on your way!' : 'Getting started'}
          </span>
          {!allDone && status && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,215,0,0.25)', color: '#ffd700' }}
            >
              {completedCount}/{STEPS.length}
            </span>
          )}
        </div>
        {/* Chevron */}
        <svg
          className="transition-transform duration-200 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ── Gold progress bar ── */}
      {!allDone && (
        <div style={{ background: 'rgba(255,215,0,0.18)', height: 4 }}>
          <div
            style={{
              height: '100%',
              background: '#ffd700',
              width: `${progressPct}%`,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      )}

      {/* ── Body (only when open) ── */}
      {open && (
        <div style={{ background: '#ffffff' }}>
          {allDone ? (
            // ── Celebration state ──
            <div className="px-5 py-6 text-center">
              <div className="text-3xl mb-3">🎊</div>
              <p className="text-sm font-semibold text-[#014D4E] mb-1">
                All four steps complete!
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your account is set up and you're ready to start building your
                inspection readiness. This panel will close in a moment.
              </p>
            </div>
          ) : (
            // ── Steps ──
            <ul className="divide-y divide-gray-100">
              {STEPS.map(step => {
                const done = status ? status[step.key] : false
                return (
                  <li key={step.key} className="px-5 py-4 flex gap-3">
                    {/* Status icon */}
                    <div className="shrink-0 mt-0.5">
                      {done ? (
                        <span
                          className="flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold"
                          style={{ background: '#00b8a6' }}
                        >
                          ✓
                        </span>
                      ) : (
                        <span
                          className="flex items-center justify-center w-5 h-5 rounded-full border-2"
                          style={{ borderColor: '#014D4E' }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold mb-0.5 ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {step.title}
                      </p>
                      {!done && (
                        <>
                          <p className="text-xs text-gray-500 leading-relaxed mb-2">
                            {step.description}
                          </p>
                          <Link
                            href={step.href}
                            className="text-xs font-semibold"
                            style={{ color: '#014D4E' }}
                          >
                            {step.cta} →
                          </Link>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* ── Footer ── */}
          {!allDone && (
            <div
              className="px-5 py-3 flex items-center justify-between border-t"
              style={{ borderColor: '#f0f0f0' }}
            >
              <p className="text-xs text-gray-400">
                Need help? Use <strong>Support</strong> at any time.
              </p>
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-3 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
