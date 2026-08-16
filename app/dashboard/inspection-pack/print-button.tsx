'use client'

/**
 * PrintButton — triggers window.print() so the user can save as PDF
 * via their browser's built-in print dialog (portrait or landscape).
 *
 * Waits for any org logo image to finish loading before triggering print,
 * matching the behaviour of the Reports page print button.
 */
export default function PrintButton() {
  function handlePrint() {
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('img'))
    const unloaded = images.filter(img => !img.complete)
    if (unloaded.length === 0) {
      window.print()
      return
    }
    Promise.all(
      unloaded.map(
        img =>
          new Promise<void>(resolve => {
            img.addEventListener('load',  () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          }),
      ),
    ).then(() => window.print())
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="
        inline-flex items-center gap-2
        bg-[#014D4E] text-white text-sm font-medium
        px-5 py-2.5 rounded-lg
        hover:bg-[#013838]
        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
        transition-colors
      "
      aria-label="Print or save this pack as a PDF"
    >
      <span aria-hidden="true">🖨</span>
      Print / Save as PDF
    </button>
  )
}
