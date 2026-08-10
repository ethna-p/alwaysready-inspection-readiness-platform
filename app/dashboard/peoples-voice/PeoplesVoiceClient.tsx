'use client'

import { useState, useTransition } from 'react'
import { upsertIStatementEvidence } from './actions'
import IStatementActionPanel, { type TeamMember } from './IStatementActionPanel'
import RagBadge from '@/components/RagBadge'
import { calculateRAG } from '@/lib/rag'
import type { IStatement, IStatementEvidence, IStatementConfidence, IStatementAction } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvidenceHistoryEntry = {
  confidence:       string
  evidence_summary: string | null
  action_needed:    string | null
  recorded_by_name: string | null
  recorded_at:      string
}

export type StatementWithEvidence = IStatement & {
  evidence: IStatementEvidence | null
  history:  EvidenceHistoryEntry[]
  actions:  IStatementAction[]
}

interface Props {
  grouped:       Record<string, StatementWithEvidence[]>
  isViewer:      boolean
  isAdmin:       boolean
  orgId:         string
  currentUserId: string
  teamMembers:   TeamMember[]
}

// ─── Key question display config ──────────────────────────────────────────────

const KQ_ORDER = ['Safe', 'Effective', 'Caring', 'Responsive']

const KQ_STYLES: Record<string, { header: string; border: string }> = {
  Safe:       { header: 'bg-[#e6f7f5] text-brand', border: 'border-[#c0eae5]' },
  Effective:  { header: 'bg-blue-50  text-blue-800',    border: 'border-blue-200'  },
  Caring:     { header: 'bg-purple-50 text-purple-800', border: 'border-purple-200'},
  Responsive: { header: 'bg-amber-50  text-amber-800',  border: 'border-amber-200' },
}

// ─── Evidence quality badge ───────────────────────────────────────────────────

const CONFIDENCE_UI: Record<string, { label: string; className: string }> = {
  green:        { label: 'Evidence strong',       className: 'bg-green-100 text-green-700' },
  amber:        { label: 'Evidence needs work',   className: 'bg-amber-100 text-amber-700' },
  red:          { label: 'Evidence needs work',   className: 'bg-amber-100 text-amber-700' },
  not_assessed: { label: 'Not assessed',          className: 'bg-fill-dim  text-ink-muted' },
}

function EvidenceQualityBadge({ confidence }: { confidence: string }) {
  const cfg = CONFIDENCE_UI[confidence] ?? CONFIDENCE_UI.not_assessed
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHistoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Single statement row ─────────────────────────────────────────────────────

function StatementRow({
  item,
  isViewer,
  isAdmin,
  currentUserId,
  teamMembers,
}: {
  item: StatementWithEvidence
  isViewer: boolean
  isAdmin: boolean
  currentUserId: string
  teamMembers: TeamMember[]
}) {
  const existing = item.evidence

  const [open, setOpen]                       = useState(false)
  const [showHistory, setShowHistory]         = useState(false)
  const [showActions, setShowActions]         = useState(false)

  // Form state
  const [confidence, setConfidence]           = useState<IStatementConfidence>(existing?.confidence ?? 'not_assessed')
  const [evidenceSummary, setEvidenceSummary] = useState(existing?.evidence_summary ?? '')
  const [dateReviewed, setDateReviewed]       = useState(existing?.date_reviewed ?? '')
  const [nextReviewDue, setNextReviewDue]     = useState(existing?.next_review_due ?? '')

  const [savedMsg, setSavedMsg]               = useState<string | null>(null)
  const [errorMsg, setErrorMsg]               = useState<string | null>(null)
  const [isPending, startTransition]          = useTransition()

  const rag     = calculateRAG(existing ? { date_reviewed: existing.date_reviewed, next_review_due: existing.next_review_due } : null)
  const history = item.history ?? []
  const actions = item.actions ?? []
  const openActionCount = actions.filter(a => a.status !== 'completed').length

  function handleSave() {
    setErrorMsg(null)
    setSavedMsg(null)
    startTransition(async () => {
      const result = await upsertIStatementEvidence(
        item.id,
        confidence,
        evidenceSummary,
        '',          // action_needed field removed — replaced by structured action plan
        dateReviewed,
        nextReviewDue,
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
    <div className="border-b border-line last:border-0">

      {/* Collapsed row */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex flex-col gap-1 shrink-0 items-start">
          <RagBadge status={rag} />
          {existing && existing.confidence !== 'not_assessed' && (
            <EvidenceQualityBadge confidence={existing.confidence} />
          )}
        </div>
        <p className="flex-1 text-sm text-ink leading-snug">{item.statement_text}</p>
        {!isViewer && (
          <button
            type="button"
            onClick={() => { setOpen(v => !v); setShowActions(false) }}
            className="shrink-0 text-xs font-medium text-brand bg-[#e6f7f5] hover:bg-[#ccf0ec] rounded px-2.5 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00b8a6]"
          >
            {open ? 'Close' : existing ? 'Edit' : 'Add evidence'}
          </button>
        )}
      </div>

      {/* Read-only evidence summary (viewers and collapsed state) */}
      {!open && existing?.evidence_summary && (
        <div className="px-4 pb-3">
          <p className="text-xs text-ink-dim bg-[#f0faf9] border border-[#c0eae5] rounded px-3 py-2 leading-relaxed">
            {existing.evidence_summary}
          </p>
        </div>
      )}

      {/* Action plan toggle — shown for all roles when actions exist or user can add */}
      {(actions.length > 0 || (!isViewer && existing)) && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => { setShowActions(v => !v); setOpen(false) }}
            className="text-xs font-medium text-brand hover:underline underline-offset-2 focus:outline-none focus:ring-1 focus:ring-brand rounded"
          >
            {showActions
              ? 'Hide actions'
              : openActionCount > 0
                ? `Action plan (${openActionCount} open)`
                : 'Action plan'
            }
          </button>
        </div>
      )}

      {/* Action plan panel */}
      {showActions && (
        <div className="px-4 pb-4">
          <IStatementActionPanel
            statementId={item.id}
            items={actions}
            teamMembers={teamMembers}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isViewer={isViewer}
          />
        </div>
      )}

      {/* History toggle */}
      {history.length > 0 && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => setShowHistory(v => !v)}
            className="text-xs text-ink-dim hover:text-ink underline underline-offset-2 focus:outline-none focus:ring-1 focus:ring-brand rounded"
          >
            {showHistory ? 'Hide history' : `Show history (${history.length} update${history.length !== 1 ? 's' : ''})`}
          </button>

          {showHistory && (
            <div className="mt-2 space-y-2">
              {history.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 text-xs border-l-2 border-line pl-3 py-1">
                  <div className="shrink-0 mt-0.5">
                    <EvidenceQualityBadge confidence={entry.confidence} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.evidence_summary && (
                      <p className="text-ink leading-snug mb-0.5 line-clamp-2">{entry.evidence_summary}</p>
                    )}
                    <p className="text-ink-dim">
                      {formatHistoryDate(entry.recorded_at)}
                      {entry.recorded_by_name && <> · {entry.recorded_by_name}</>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit panel */}
      {open && !isViewer && (
        <div className="px-4 pb-4 space-y-4 bg-canvas border-t border-line">
          <div className="pt-4 space-y-4">

            {/* Review dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`date-reviewed-${item.id}`} className="block text-xs font-semibold text-ink-dim mb-1">
                  Date of this review
                </label>
                <input
                  id={`date-reviewed-${item.id}`}
                  type="date"
                  value={dateReviewed}
                  onChange={e => setDateReviewed(e.target.value)}
                  className="w-full text-sm rounded border border-line px-3 py-2 bg-card text-ink focus:outline-none focus:ring-1 focus:ring-[#014D4E] focus:border-[#014D4E]"
                />
              </div>
              <div>
                <label htmlFor={`next-review-${item.id}`} className="block text-xs font-semibold text-ink-dim mb-1">
                  Next review due
                </label>
                <input
                  id={`next-review-${item.id}`}
                  type="date"
                  value={nextReviewDue}
                  onChange={e => setNextReviewDue(e.target.value)}
                  className="w-full text-sm rounded border border-line px-3 py-2 bg-card text-ink focus:outline-none focus:ring-1 focus:ring-[#014D4E] focus:border-[#014D4E]"
                />
              </div>
            </div>

            {/* Evidence quality */}
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-1.5">Evidence quality</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'green' as IStatementConfidence, label: 'Evidence strong' },
                  { value: 'red'   as IStatementConfidence, label: 'Evidence needs work' },
                  { value: 'not_assessed' as IStatementConfidence, label: 'Not assessed' },
                ]).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setConfidence(value)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#00b8a6] ${
                      confidence === value
                        ? (CONFIDENCE_UI[value]?.className ?? '') + ' border-current ring-1'
                        : 'bg-card text-ink-muted border-line hover:border-ink-dim'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence summary */}
            <div>
              <label htmlFor={`evidence-${item.id}`} className="block text-xs font-semibold text-ink-dim mb-1">
                Evidence we hold
              </label>
              <textarea
                id={`evidence-${item.id}`}
                value={evidenceSummary}
                onChange={e => setEvidenceSummary(e.target.value)}
                rows={3}
                placeholder="Describe the evidence you hold that demonstrates this statement is met…"
                className="w-full text-sm rounded border border-line px-3 py-2 bg-card text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-[#014D4E] focus:border-[#014D4E] resize-y"
              />
            </div>

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
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function PeoplesVoiceClient({
  grouped,
  isViewer,
  isAdmin,
  currentUserId,
  teamMembers,
}: Props) {
  return (
    <div className="space-y-8">
      {KQ_ORDER.filter(kq => grouped[kq]?.length > 0).map(kq => {
        const styles     = KQ_STYLES[kq]
        const statements = grouped[kq]
        const assessed   = statements.filter(s => s.evidence && s.evidence.confidence !== 'not_assessed').length
        const total      = statements.length

        return (
          <section key={kq}>
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-xl ${styles.header} border ${styles.border}`}>
              <h2 className="text-sm font-bold uppercase tracking-wide">{kq}</h2>
              <span className="text-xs font-medium opacity-70">{assessed}/{total} assessed</span>
            </div>

            <div className={`rounded-b-xl border-x border-b ${styles.border} bg-card divide-y divide-gray-50 overflow-hidden`}>
              {statements.map(item => (
                <StatementRow
                  key={item.id}
                  item={item}
                  isViewer={isViewer}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                  teamMembers={teamMembers}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
