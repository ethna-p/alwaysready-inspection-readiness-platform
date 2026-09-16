'use client'

/**
 * Tooltip — accessible info popover triggered by a ⓘ button.
 *
 * Usage:
 *   <Tooltip text="Your tooltip content here." />
 *
 * - Opens on click or keyboard (Enter / Space)
 * - Closes on Escape, on click outside, or on blur
 * - Uses role="tooltip" + aria-describedby for screen readers
 */

import { useEffect, useId, useRef, useState } from 'react'

interface TooltipProps {
  text: string
  /** Optional label for the trigger button — defaults to "More information" */
  label?: string
}

export default function Tooltip({ text, label = 'More information' }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  // useId(), not Math.random() -- a random value computed during SSR and
  // again during the client's first render before hydration reconciles the
  // ref are two different strings, so the server-rendered aria-controls
  // never matches what the client expects. useId() is deterministic across
  // server and client for exactly this reason.
  const tooltipId = `tooltip-${useId()}`

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <span ref={containerRef} className="relative inline-flex items-center ml-1.5 align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={() => setOpen(v => !v)}
        className="
          inline-flex items-center justify-center
          w-4 h-4 rounded-full
          text-[10px] font-bold leading-none
          text-brand border border-[#014D4E]/40
          hover:bg-[#014D4E]/10
          focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1
          transition-colors
          select-none
        "
      >
        i
      </button>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="
            absolute left-6 top-1/2 -translate-y-1/2 z-50
            w-72 max-w-xs
            bg-[#014D4E] text-white text-xs leading-relaxed
            rounded-lg px-3 py-2.5 shadow-lg
          "
        >
          {/* Arrow */}
          <span
            aria-hidden="true"
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0
              border-t-4 border-t-transparent
              border-b-4 border-b-transparent
              border-r-4 border-r-[#014D4E]"
          />
          {text}
        </span>
      )}
    </span>
  )
}
