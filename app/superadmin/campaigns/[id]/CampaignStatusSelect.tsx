'use client'

import { updateCampaignStatus } from '../actions'

export default function CampaignStatusSelect({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: 'draft' | 'active' | 'closed'
}) {
  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateCampaignStatus(id, e.target.value as 'draft' | 'active' | 'closed')
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      className="px-3 py-2 text-sm border border-line rounded-lg bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-brand shrink-0"
    >
      <option value="draft">Draft</option>
      <option value="active">Active</option>
      <option value="closed">Closed</option>
    </select>
  )
}
