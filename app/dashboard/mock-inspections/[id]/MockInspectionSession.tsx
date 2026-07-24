'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveMockFinding,
  saveMockChecklistResponse,
  completeMockInspection,
} from '../actions'
import type { MockInspectionRating, MockChecklistResponse } from '@/lib/types'

type Klo = {
  id: string
  title: string
  wording: string
  key_question_id: string
  key_questions: { name: string } | null
}

type ChecklistItem = {
  id: string
  klo_item_id: string
  ref: string
  checklist_item: string
  item_type: string
  display_order: number
}

type ExistingFinding = {
  klo_item_id: string
  rating: MockInspectionRating
  notes: string | null
}

type ExistingResponse = {
  checklist_item_id: string
  response: MockChecklistResponse
  note: string | null
}

type Props = {
  inspectionId: string
  inspectionType: 'full' | 'partial'
  keyQuestionName: string | null
  klos: Klo[]
  checklistItems: ChecklistItem[]
  existingFindings: ExistingFinding[]
  existingResponses: ExistingResponse[]
  currentKloeIndex: number
}

const RATINGS: { value: MockInspectionRating; label: string; colour: string }[] = [
  { value: 'outstanding',          label: 'Outstanding',          colour: 'border-purple-400 bg-purple-50 text-purple-700' },
  { value: 'good',                 label: 'Good',                 colour: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'requires_improvement', label: 'Requires Improvement', colour: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'inadequate',           label: 'Inadequate',           colour: 'border-red-400 bg-red-50 text-red-700' },
]

const RESPONSES: { value: MockChecklistResponse; label: string }[] = [
  { value: 'met',     label: 'Met' },
  { value: 'partial', label: 'Partial' },
  { value: 'not_met', label: 'Not met' },
]

export default function MockInspectionSession({
  inspectionId,
  inspectionType,
  keyQuestionName,
  klos,
  checklistItems,
  existingFindings,
  existingResponses,
  currentKloeIndex,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Current KLOE
  const klo = klos[currentKloeIndex]
  const kloChecklist = checklistItems.filter(ci => ci.klo_item_id === klo.id)

  // Build initial state from existing data
  const initFinding = existingFindings.find(f => f.klo_item_id === klo.id)
  const [rating, setRating] = useState<MockInspectionRating | ''>(initFinding?.rating ?? '')
  const [notes, setNotes] = useState(initFinding?.notes ?? '')

  const initResponses = Object.fromEntries(
    kloChecklist.map(ci => {
      const existing = existingResponses.find(r => r.checklist_item_id === ci.id)
      return [ci.id, { response: existing?.response ?? '' as MockChecklistResponse | '', note: existing?.note ?? '' }]
    })
  )
  const [responses, setResponses] = useState<Record<string, { response: MockChecklistResponse | '', note: string }>>(initResponses)

  const isFirst = currentKloeIndex === 0
  const isLast  = currentKloeIndex === klos.length - 1

  // Count completed KLOEs (those with a finding saved)
  const completedIds = new Set(existingFindings.map(f => f.klo_item_id))

  function setResponse(itemId: string, field: 'response' | 'note', value: string) {
    setResponses(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }))
  }

  async function saveAndNavigate(nextIndex: number | 'complete') {
    setError(null)

    if (!rating) {
      setError('Please select an overall rating before continuing.')
      return
    }

    startTransition(async () => {
      // Save checklist responses
      for (const ci of kloChecklist) {
        const r = responses[ci.id]
        if (r?.response) {
          const res = await saveMockChecklistResponse(inspectionId, ci.id, r.response as MockChecklistResponse, r.note)
          if ('error' in res) { setError(res.error); return }
        }
      }

      // Save KLOE finding
      const findingRes = await saveMockFinding(inspectionId, klo.id, rating as MockInspectionRating, notes)
      if ('error' in findingRes) { setError(findingRes.error); return }

      if (nextIndex === 'complete') {
        const completeRes = await completeMockInspection(inspectionId)
        if ('error' in completeRes) { setError(completeRes.error); return }
        router.push(`/dashboard/mock-inspections/${inspectionId}/report`)
      } else {
        router.push(`/dashboard/mock-inspections/${inspectionId}?kloe=${nextIndex}`)
        router.refresh()
      }
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <a href="/dashboard/mock-inspections" className="text-sm text-[#014D4E] hover:underline">
          ← Mock Inspections
        </a>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-xl font-bold text-[#014D4E]">
              {inspectionType === 'partial' ? `Mock Inspection — ${keyQuestionName}` : 'Full Mock Inspection'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              KLOE {currentKloeIndex + 1} of {klos.length}
            </p>
          </div>
          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {klos.map((k, i) => (
              <div
                key={k.id}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  i === currentKloeIndex
                    ? 'bg-[#014D4E]'
                    : completedIds.has(k.id)
                    ? 'bg-[#00b8a6]'
                    : 'bg-gray-200'
                }`}
                title={k.title}
              />
            ))}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00b8a6] transition-all duration-300"
            style={{ width: `${((currentKloeIndex + 1) / klos.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Guidance disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-700">
        <strong>Guidance only.</strong> Ratings produced here are for self-assessment purposes and do not represent the view of CQC or any regulatory body.
      </div>

      {/* KLOE card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            {(klo as any).key_questions?.name ?? ''}
          </p>
          <h2 className="text-lg font-bold text-[#1a1a1a]">{klo.title}</h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{klo.wording}</p>
        </div>

        {/* I statements */}
        {kloChecklist.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Evidence checklist — how well does your service meet each one?
            </h3>
            <div className="space-y-4">
              {kloChecklist.map(ci => (
                <div key={ci.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-800 mb-3">
                    <span className="font-mono text-xs text-gray-400 mr-2">{ci.ref}</span>
                    {ci.checklist_item}
                  </p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {RESPONSES.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setResponse(ci.id, 'response', opt.value)}
                        className={`
                          text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
                          ${responses[ci.id]?.response === opt.value
                            ? opt.value === 'met'     ? 'border-green-500 bg-green-100 text-green-700'
                            : opt.value === 'partial' ? 'border-amber-500 bg-amber-100 text-amber-700'
                                                      : 'border-red-500 bg-red-100 text-red-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }
                        `}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {(responses[ci.id]?.response === 'partial' || responses[ci.id]?.response === 'not_met') && (
                    <input
                      type="text"
                      value={responses[ci.id]?.note ?? ''}
                      onChange={e => setResponse(ci.id, 'note', e.target.value)}
                      placeholder="Note what needs to improve (optional)"
                      className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00b8a6] mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall KLOE rating */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Overall rating for this KLOE</h3>
          <div className="grid grid-cols-2 gap-2">
            {RATINGS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRating(r.value)}
                className={`
                  text-sm font-semibold py-3 px-4 rounded-xl border-2 transition-colors
                  ${rating === r.value ? r.colour + ' border-current' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}
                `}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Inspector notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="What did you observe? What evidence did you review?"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00b8a6] resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {!isFirst && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/mock-inspections/${inspectionId}?kloe=${currentKloeIndex - 1}`)}
              disabled={isPending}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              ← Previous
            </button>
          )}
          <button
            type="button"
            onClick={() => saveAndNavigate(isLast ? 'complete' : currentKloeIndex + 1)}
            disabled={isPending}
            className="flex-1 bg-[#00b8a6] text-white font-semibold text-sm py-3 rounded-xl hover:bg-[#009d8e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending
              ? 'Saving…'
              : isLast
              ? 'Complete inspection →'
              : 'Save & continue →'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
