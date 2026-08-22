'use client'

import { useRef } from 'react'
import { addContact } from '../actions'

export default function AddContactForm({ campaignId }: { campaignId: string }) {
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    await addContact(campaignId, formData)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <input
        name="location_name"
        required
        placeholder="Service name *"
        className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="provider_name"
        placeholder="Provider name"
        className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="location_id"
        placeholder="CQC Location ID"
        className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="street_address"
        placeholder="Street address"
        className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="city"
        placeholder="City"
        className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="postcode"
        placeholder="Postcode"
        className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="region"
        placeholder="Region"
        className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="service_type"
        placeholder="Service type (e.g. Residential social care)"
        className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        name="cqc_profile_url"
        placeholder="CQC profile URL"
        className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <select
          name="contact_method"
          defaultValue="letter"
          className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="letter">Letter</option>
          <option value="email">Email</option>
        </select>
        <button
          type="submit"
          className="px-5 py-2 text-sm font-semibold rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors"
        >
          Add contact
        </button>
      </div>
    </form>
  )
}
