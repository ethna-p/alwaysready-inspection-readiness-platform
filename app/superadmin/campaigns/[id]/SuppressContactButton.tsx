'use client'

import { suppressContact } from '../actions'

export default function SuppressContactButton({
  contactId,
  campaignId,
  name,
}: {
  contactId: string
  campaignId: string
  name: string
}) {
  async function handleClick() {
    if (!confirm(`Suppress "${name}" from future marketing? This can't be easily undone.`)) return
    await suppressContact(contactId, campaignId)
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs px-2.5 py-1 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap"
    >
      Suppress
    </button>
  )
}
