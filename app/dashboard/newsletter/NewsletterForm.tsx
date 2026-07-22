'use client'

import { useState, useTransition } from 'react'
import { generateNewsletter } from '@/app/actions/newsletter'

const AUDIENCES = [
  'Staff team',
  'Families and residents',
  'Staff team and families',
]

const OCCASIONS = [
  'Monthly update',
  'Upcoming CQC inspection',
  'Policy or procedure change',
  'Seasonal / holiday message',
  'Staff recognition',
  'CQC rating update',
  'New staff members',
  'Service changes',
  'Other (I\'ll describe in key points)',
]

const TONES = ['Warm and friendly', 'Professional', 'Brief and factual']

type Props = {
  initialRemaining: number
}

export default function NewsletterForm({ initialRemaining }: Props) {
  const [audience, setAudience]   = useState(AUDIENCES[0])
  const [occasion, setOccasion]   = useState(OCCASIONS[0])
  const [keyPoints, setKeyPoints] = useState('')
  const [tone, setTone]           = useState(TONES[0])
  const [draft, setDraft]         = useState('')
  const [remaining, setRemaining] = useState(initialRemaining)
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    setError('')
    setCopied(false)
    startTransition(async () => {
      const result = await generateNewsletter({ audience, occasion, keyPoints, tone })
      if (result.success) {
        setDraft(result.draft)
        setRemaining(result.remaining)
      } else {
        setError(result.error)
      }
    })
  }

  function handleCopy() {
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const atLimit = remaining <= 0

  return (
    <div className="max-w-2xl">

      {/* Usage pill */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
          atLimit
            ? 'bg-red-50 text-red-700'
            : remaining <= 3
            ? 'bg-amber-50 text-amber-700'
            : 'bg-[#014D4E]/10 text-[#014D4E]'
        }`}>
          {atLimit
            ? 'Monthly limit reached — resets on the 1st'
            : `${remaining} draft${remaining === 1 ? '' : 's'} remaining this month`}
        </span>
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">

        {/* Audience + Occasion */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1.5">
              Who is this for?
            </label>
            <select
              id="audience"
              value={audience}
              onChange={e => setAudience(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
            >
              {AUDIENCES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="occasion" className="block text-sm font-medium text-gray-700 mb-1.5">
              Topic or occasion
            </label>
            <select
              id="occasion"
              value={occasion}
              onChange={e => setOccasion(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
            >
              {OCCASIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Key points */}
        <div className="mb-5">
          <label htmlFor="keypoints" className="block text-sm font-medium text-gray-700 mb-1.5">
            Key points to include{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="keypoints"
            rows={3}
            value={keyPoints}
            onChange={e => setKeyPoints(e.target.value)}
            placeholder="e.g. New visiting hours from 1 August, welcome to two new staff members, summer BBQ on 15 August"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
          />
        </div>

        {/* Tone */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Tone</p>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`text-sm px-4 py-1.5 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#014D4E] ${
                  tone === t
                    ? 'bg-[#014D4E] text-white border-[#014D4E]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#014D4E]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending || atLimit}
          className="w-full py-3 bg-[#014D4E] text-white text-sm font-semibold rounded-lg hover:bg-[#00b8a6] hover:text-[#014D4E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2"
        >
          {isPending ? 'Generating draft…' : draft ? 'Regenerate draft' : 'Generate draft'}
        </button>
      </div>

      {/* Draft output */}
      {draft && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Your draft
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#014D4E] bg-[#014D4E]/10 px-2.5 py-1 rounded-full">
              AI generated
            </span>
          </div>

          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-[#faf9f6] rounded-lg p-4 mb-4 border border-gray-100">
            {draft}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm font-medium text-[#014D4E] border border-gray-300 rounded-lg px-4 py-2 hover:border-[#014D4E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
            >
              {copied ? '✓ Copied' : 'Copy text'}
            </button>
            <p className="text-xs text-gray-400">
              Review and edit before sending. AlwaysReady doesn&apos;t send on your behalf.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
