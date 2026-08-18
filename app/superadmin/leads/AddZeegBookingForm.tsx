'use client'

import { useRef, useTransition } from 'react'
import { addZeegBooking } from './actions'

export default function AddZeegBookingForm() {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await addZeegBooking(formData)
      formRef.current?.reset()
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-3 items-end p-5 bg-fill border border-line rounded-xl mb-6"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-muted" htmlFor="zb-name">
          Name
        </label>
        <input
          id="zb-name"
          name="invitee_name"
          type="text"
          placeholder="Ethna Parker"
          className="border border-line rounded-lg px-3 py-2 text-sm bg-card text-ink w-48 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-muted" htmlFor="zb-email">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="zb-email"
          name="invitee_email"
          type="email"
          required
          placeholder="email@example.com"
          className="border border-line rounded-lg px-3 py-2 text-sm bg-card text-ink w-56 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-muted" htmlFor="zb-type">
          Demo type <span className="text-red-500">*</span>
        </label>
        <select
          id="zb-type"
          name="demo_type"
          required
          className="border border-line rounded-lg px-3 py-2 text-sm bg-card text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">Select…</option>
          <option value="15min">15 min — Mock Inspection</option>
          <option value="30min">30 min — Full platform</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Adding…' : 'Add booking'}
      </button>
    </form>
  )
}
