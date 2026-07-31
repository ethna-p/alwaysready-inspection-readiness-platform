'use client'

import { useState, useTransition } from 'react'
import { deleteOrganisation } from './actions'

interface Props {
  orgId: string
  orgName: string
}

export default function DeleteOrgButton({ orgId, orgName }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteOrganisation(orgId)
      if ('error' in result) {
        setError(result.error)
      } else {
        setShowConfirm(false)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline transition-colors"
      >
        Delete
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-base font-bold text-ink mb-2">Delete organisation?</h2>
            <p className="text-sm text-ink-dim mb-1">
              You are about to permanently delete:
            </p>
            <p className="text-sm font-semibold text-ink mb-4">{orgName}</p>
            <p className="text-sm text-red-600 mb-6">
              This will delete all users, compliance records, evidence, inspections, and associated data. This cannot be undone.
            </p>

            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowConfirm(false); setError(null) }}
                disabled={isPending}
                className="flex-1 border border-line text-sm font-medium text-ink px-4 py-2.5 rounded-lg hover:bg-fill disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
