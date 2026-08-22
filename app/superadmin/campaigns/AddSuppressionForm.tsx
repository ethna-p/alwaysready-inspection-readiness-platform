'use client'

import { useRef } from 'react'
import { addSuppression } from './actions'

export default function AddSuppressionForm() {
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    await addSuppression(formData)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap gap-3">
      <input
        name="location_name"
        required
        placeholder="Service name *"
        className="flex-1 min-w-48 px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="postcode"
        placeholder="Postcode"
        className="w-32 px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="email"
        type="email"
        placeholder="Email (optional)"
        className="flex-1 min-w-48 px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <button
        type="submit"
        className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shrink-0"
      >
        Add opt-out
      </button>
    </form>
  )
}
