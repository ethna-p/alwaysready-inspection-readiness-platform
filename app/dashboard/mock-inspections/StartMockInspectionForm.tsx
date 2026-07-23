'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { startMockInspection } from './actions'

type KeyQuestion = { id: string; name: string }

export default function StartMockInspectionForm({ keyQuestions }: { keyQuestions: KeyQuestion[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<'full' | 'partial'>('partial')
  const [keyQuestionId, setKeyQuestionId] = useState<string>(keyQuestions[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (type === 'partial' && !keyQuestionId) {
      setError('Please select a key question.')
      return
    }

    startTransition(async () => {
      const result = await startMockInspection(type, type === 'partial' ? keyQuestionId : null)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.push(`/dashboard/mock-inspections/${result.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Inspection type</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType('partial')}
            className={`
              text-left border rounded-xl p-4 transition-colors
              ${type === 'partial'
                ? 'border-[#00b8a6] bg-[#f0faf9]'
                : 'border-gray-200 bg-white hover:border-gray-300'}
            `}
          >
            <p className="text-sm font-semibold text-[#1a1a1a]">Partial inspection</p>
            <p className="text-xs text-gray-500 mt-1">One key question and its linked KLOEs. Recommended for providers rated Good or above.</p>
          </button>
          <button
            type="button"
            onClick={() => setType('full')}
            className={`
              text-left border rounded-xl p-4 transition-colors
              ${type === 'full'
                ? 'border-[#00b8a6] bg-[#f0faf9]'
                : 'border-gray-200 bg-white hover:border-gray-300'}
            `}
          >
            <p className="text-sm font-semibold text-[#1a1a1a]">Full inspection</p>
            <p className="text-xs text-gray-500 mt-1">All five key questions and every KLOE. Recommended for providers rated Requires Improvement or Inadequate.</p>
          </button>
        </div>
      </div>

      {/* Key question selector — partial only */}
      {type === 'partial' && (
        <div>
          <label htmlFor="key_question" className="block text-sm font-medium text-gray-700 mb-1">
            Key question to inspect
          </label>
          <select
            id="key_question"
            value={keyQuestionId}
            onChange={e => setKeyQuestionId(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent"
          >
            {keyQuestions.map(kq => (
              <option key={kq.id} value={kq.id}>{kq.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#00b8a6] text-white font-semibold text-sm py-3 rounded-xl hover:bg-[#009d8e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Starting…' : 'Begin mock inspection →'}
      </button>
    </form>
  )
}
