'use client'

import { useState, useTransition } from 'react'
import { upsertIStatementEvidence } from './actions'
import type { IStatement, IStatementEvidence, IStatementConfidence } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatementWithEvidence = IStatement & {
  evidence: IStatementEvidence | null
}

interface Props {
  grouped: Record<string, StatementWithEvidence[]>
  isViewer: boolean
}

// ─── Key question display config ──────────────────────────────────────────────

const KQ_ORDER = ['Safe', 'Effective', 'Caring', 'Responsive']

const KQ_STYLES: Record<string, { header: string; border: string }> = {
  Safe:       { header: 'bg-[#e6f7f5] text-[#014D4E]', border: 'border-[#c0eae5]' },
  Effective:  { header: 'bg-blue-50  text-blue-800',    border: 'border-blue-200'  },
  Caring:     { header: 'bg-purple-50 text-purple-800', border: 'border-purple-200'},
  Responsive: { header: 'bg-amber-50  text-amber-800',  border: 'border-amber-200' },
}

// ─── Confidence badge ─────────────────────────────────────────────────────────

const CONFIDENCE_LABELS: Record<IStatementConfidence, string> = {
  green:        'Green',
  amber:        'Amber',
  red:          'Red',
  not_assessed: 'Not assessed',
}

const CONFIDENCE_STYLES: Record<IStatementConfidence, string> = {
  green:        'bg-green-100 text-green-700',
  amber:        'bg-amber-100 text-amber-700',
  red:          'bg-red-100   text-red-700',
  not_assessed: 'bg-gray-100  text-gray-500',
}

function ConfidenceBadge({ confidence }: { confidence: IStatementConfidence }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${CONFIDENCE_STYLES[confidence]}`}>
      {CONFIDENCE_LABELS[confidence]}
    </span>
  )
}

// ─── Single statement row ─────────────────────────────────────────────────────

function StatementRow({
  item,
  isViewer,
}: {
  item: StatementWithEvidence
  isViewer: boolean
}) {
  const existing = item.evidence
  const [open, setOpen]                         = useState(false)
  const [confidence, setConfidence]             = useState<IStatementConfidence>(existing?.confidence ?? 'not_assessed')
  const [evidenceSummary, setEvidenceSummary]   = useState(existing?.evidence_summary ?? '')
  const [actionNeeded, setActionNeeded]         = useState(existing?.action_needed ?? '')
  const [savedMsg, setSavedMsg]                 = useState<string | null>(null)
  const [errorMsg, setErrorMsg]                 = useState<string | null>(null)
  const [isPending, startTransition]            = useTransition()

  const currentConfidence: IStatementConfidence = existing?.confidence ?? 'not_assessed'

  function handleSave() {
    setErrorMsg(null)
    setSavedMsg(null)
    startTransition(async () => {
      const result = await upsertIStatementEvidence(
        item.id,
        confidence,
        evidenceSummary,
        actionNeeded,
      )
      if ('error' in result) {
        setErrorMsg(result.error)
      } else {
        setSavedMsg('Saved ✓')
        setTimeout(() => setSavedMsg(null), 2500)
        setOpen(false)
      }
    })
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* Collapsed row */}
      <div className="flex items-start gap-3 px-4 py-3">
        <ConfidenceBadge confidence={currentConfidence} />
        <p className="flex-1 text-sm text-[#1a1a1a] leading-snug">{item.statement_text}</p>
        {!isViewer && (
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="shrink-0 text-xs font-medium text-[#014D4E] bg-[#e6f7f5] hover:bg-[#ccf0ec] rounded px-2.5 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00b8a6]"
          >
            {open ? 'Close' : existing ? 'Edit' : 'Add evidence'}
          </button>
        )}
      </div>

      {/* Read-only evidence summary for viewers */}
      {isViewer && existing?.evidence_summary && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-600 bg-[#f0faf9] border border-[#c0eae5] rounded px-3 py-2 leading-relaxed">
            {existing.evidence_summary}
          </p>
          {existing.action_needed && (
            <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 leading-relaxed">
              <span className="font-semibold">Action needed: </span>{existing.action_needed}
            </p>
          )}
        </div>
      )}

      {/* Edit panel */}
      {open && !isViewer && (
        <div className="px-4 pb-4 space-y-3">
          {/* Confidence selector */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Confidence level</p>
            <div className="flex flex-wrap gap-2">
              {(['green', 'amber', 'red', 'not_assessed'] as IStatementConfidence[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConfidence(c)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#00b8a6] ${
                    confidence === c
                      ? CONFIDENCE_STYLES[c] + ' border-current ring-1'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {CONFIDENCE_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence summary */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Evidence we hold
            </label>
            <textarea
              value={evidenceSummary}
              onChange={e => setEvidenceSummary(e.target.value)}
              rows={3}
              placeholder="Describe the evidence you hold that demonstrates this statement is met…"
              className="w-full text-sm rounded border border-gray-200 px-3 py-2 bg-white text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#014D4E] focus:border-[#014D4E] resize-y"
            />
          </div>

          {/* Action needed — shown when amber or red */}
          {(confidence === 'amber' || confidence === 'red') && (
            <div>
              <label className="block text-xs font-semibold text-amber-700 mb-1">
                Action needed
              </label>
              <textarea
                value={actionNeeded}
                onChange={e => setActionNeeded(e.target.value)}
                rows={2}
                placeholder="What needs to happen to address this gap?"
                className="w-full text-sm rounded border border-amber-200 px-3 py-2 bg-amber-50 text-[#1a1a1a] placeholder:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 resize-y"
              />
            </div>
          )}

          {/* Save row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#014D4E] text-white hover:bg-[#00b8a6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00b8a6] disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            {savedMsg && <span className="text-xs text-green-600 font-medium">{savedMsg}</span>}
            {errorMsg && <span className="text-xs text-red-600">{errorMsg}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function PeoplesVoiceClient({ grouped, isViewer }: Props) {
  return (
    <div className="space-y-8">
      {KQ_ORDER.filter(kq => grouped[kq]?.length > 0).map(kq => {
        const styles = KQ_STYLES[kq]
        const statements = grouped[kq]
        const assessed   = statements.filter(s => s.evidence && s.evidence.confidence !== 'not_assessed').length
        const total      = statements.length

        return (
          <section key={kq}>
            {/* Key question header */}
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-xl ${styles.header} border ${styles.border}`}>
              <h2 className="text-sm font-bold uppercase tracking-wide">{kq}</h2>
              <span className="text-xs font-medium opacity-70">{assessed}/{total} assessed</span>
            </div>

            {/* Statement rows */}
            <div className={`rounded-b-xl border-x border-b ${styles.border} bg-white divide-y divide-gray-50 overflow-hidden`}>
              {statements.map(item => (
                <StatementRow key={item.id} item={item} isViewer={isViewer} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
