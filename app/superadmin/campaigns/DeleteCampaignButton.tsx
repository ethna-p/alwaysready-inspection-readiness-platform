'use client'

import { deleteCampaign } from './actions'

export default function DeleteCampaignButton({ id, name }: { id: string; name: string }) {
  async function handleClick() {
    if (!confirm(`Delete campaign "${name}"? This will also delete all its contacts.`)) return
    await deleteCampaign(id)
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
    >
      Delete
    </button>
  )
}
