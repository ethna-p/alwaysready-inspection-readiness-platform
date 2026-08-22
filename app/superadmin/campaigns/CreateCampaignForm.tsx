'use client'

import { useRef } from 'react'
import { createCampaign } from './actions'

export default function CreateCampaignForm() {
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    await createCampaign(formData)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        name="name"
        required
        placeholder="Campaign name (e.g. RI Campaign August 2026)"
        className="flex-1 px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="description"
        placeholder="Description (optional)"
        className="flex-1 px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <button
        type="submit"
        className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors shrink-0"
      >
        Create campaign
      </button>
    </form>
  )
}
