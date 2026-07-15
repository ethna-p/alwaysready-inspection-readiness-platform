'use client'

/**
 * PrintButton — triggers window.print() so the user can save as PDF
 * via their browser's built-in print dialog. Client component only
 * because window is not available on the server.
 */
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="
        inline-flex items-center gap-2
        bg-[#014D4E] text-white text-sm font-medium
        px-5 py-2.5 rounded-lg
        hover:bg-[#013838]
        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
        transition-colors
      "
      aria-label="Print or save this report as a PDF"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
        />
      </svg>
      Print / Save as PDF
    </button>
  )
}
