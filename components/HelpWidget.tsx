'use client'

/**
 * HelpWidget — contextual help slide-over panel.
 *
 * Drop onto any page with page-specific items. A small ? button sits
 * inline with the page heading and opens a right-side panel with
 * brief, plain-English guidance for that page.
 *
 * Usage:
 *   <HelpWidget title="Understanding KLOEs" items={[
 *     { heading: 'What is a KLOE?', body: '...' },
 *   ]} />
 */

import { useState, useEffect, useCallback } from 'react'

export type HelpItem = {
  heading: string
  body: string
}

interface Props {
  title: string
  items: HelpItem[]
}

export default function HelpWidget({ title, items }: Props) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open help"
        title="Help"
        className="
          inline-flex items-center justify-center
          w-6 h-6 rounded-full
          bg-[#014D4E] text-white
          text-xs font-bold leading-none
          hover:bg-[#013636] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1
          transition-colors flex-shrink-0 print:hidden
        "
      >
        ?
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 print:hidden"
          aria-hidden="true"
          onClick={close}
        />
      )}

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`
          fixed top-0 right-0 z-50 h-full w-full max-w-sm
          bg-card border-l border-line shadow-xl
          flex flex-col
          transform transition-transform duration-250 ease-in-out
          print:hidden
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#014D4E] text-white text-xs font-bold">?</span>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close help"
            className="text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {items.map((item, i) => (
            <div key={i}>
              <p className="text-sm font-semibold text-[#014D4E] mb-1">{item.heading}</p>
              <p className="text-sm text-ink leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-line">
          <a
            href="/dashboard/help"
            className="text-sm text-brand hover:underline font-medium focus:outline-none"
            onClick={close}
          >
            View full help centre →
          </a>
        </div>
      </div>
    </>
  )
}
