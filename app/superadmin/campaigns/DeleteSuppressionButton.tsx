'use client'

import { deleteSuppression } from './actions'

export default function DeleteSuppressionButton({ id }: { id: string }) {
  async function handleClick() {
    if (!confirm('Remove this opt-out record? The provider will no longer be suppressed.')) return
    await deleteSuppression(id)
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
