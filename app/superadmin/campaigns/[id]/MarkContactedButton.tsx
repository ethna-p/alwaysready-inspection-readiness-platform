'use client'

import { markContacted } from '../actions'

export default function MarkContactedButton({
  contactId,
  campaignId,
}: {
  contactId: string
  campaignId: string
}) {
  async function handleClick() {
    await markContacted(contactId, campaignId)
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs px-2.5 py-1 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors whitespace-nowrap"
    >
      Mark sent
    </button>
  )
}
