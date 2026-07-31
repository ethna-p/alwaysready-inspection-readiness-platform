'use client'

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-sm font-medium text-brand border border-[#014D4E] rounded-lg px-4 py-2 hover:bg-[#014D4E] hover:text-white transition-colors"
    >
      Print / Save PDF
    </button>
  )
}
