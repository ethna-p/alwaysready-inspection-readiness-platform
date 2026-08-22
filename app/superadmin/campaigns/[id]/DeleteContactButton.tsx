'use client'

import { deleteContact } from '../actions'

export default function DeleteContactButton({
  contactId,
  campaignId,
  name,
}: {
  contactId: string
  campaignId: string
  name: string
}) {
  async function handleClick() {
    if (!confirm(`Remove "${name}" from this campaign?`)) return
    await deleteContact(contactId, campaignId)
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs text-red-500 hover:text-red-700 transition-colors"
    >
      Remove
    </button>
  )
}
