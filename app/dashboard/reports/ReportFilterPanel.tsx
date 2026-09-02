'use client'

import type { ViewKey } from './report-types'
import { SYSTEM_VIEWS } from './report-types'

// ─── Filter toggle ────────────────────────────────────────────────────────────

function Toggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-line text-brand focus:ring-2 focus:ring-[#00b8a6]"
      />
      <span className="text-sm text-ink">{label}</span>
    </label>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  // org
  isAdmin: boolean
  keyQuestions: string[]
  hrStaff: { user_id: string; full_name: string | null }[]
  mockInspections: { started_at: string }[]
  // view
  activeView: ViewKey | null
  onSelectView: (key: ViewKey) => void
  onClearView: () => void
  // section visibility
  showKloes: boolean
  setShowKloes: (v: boolean) => void
  showActions: boolean
  setShowActions: (v: boolean) => void
  showHr: boolean
  setShowHr: (v: boolean) => void
  showAnnualReview: boolean
  setShowAnnualReview: (v: boolean) => void
  // filters
  selectedKQs: Set<string>
  allKQsSelected: boolean
  onToggleKQ: (name: string, checked: boolean) => void
  onToggleAllKQs: (checked: boolean) => void
  actionStatus: 'all' | 'open' | 'in_progress' | 'completed'
  setActionStatus: (v: 'all' | 'open' | 'in_progress' | 'completed') => void
  selectedStaff: string
  setSelectedStaff: (v: string) => void
  reviewYear: number
  setReviewYear: (v: number) => void
  availableYears: number[]
  // print
  onPrint: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportFilterPanel({
  isAdmin, keyQuestions, hrStaff, mockInspections,
  activeView, onSelectView, onClearView,
  showKloes, setShowKloes, showActions, setShowActions,
  showHr, setShowHr, showAnnualReview, setShowAnnualReview,
  selectedKQs, allKQsSelected, onToggleKQ, onToggleAllKQs,
  actionStatus, setActionStatus, selectedStaff, setSelectedStaff,
  reviewYear, setReviewYear, availableYears,
  onPrint,
}: Props) {
  const inputClass = `
    border border-line rounded-lg px-3 py-2 text-sm text-ink bg-card w-full
    focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
  `

  return (
    <div className="print:hidden space-y-6 mb-8">

      {/* ── Report views ──────────────────────────────────────────────────── */}
      <div className="bg-card border border-line rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-ink">Report type</p>
          {activeView && (
            <button
              type="button"
              onClick={onClearView}
              className="text-xs font-medium text-ink-muted hover:text-ink focus:outline-none"
            >
              Clear — customise manually
            </button>
          )}
        </div>
        <p className="text-sm text-ink-muted mb-3">
          Choose a pre-built report for a common use case — the sections and filters below will configure automatically.
          {!activeView && <> Or skip this and set the options manually below.</>}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SYSTEM_VIEWS.filter(v => !v.adminOnly || isAdmin).map(v => (
            <button
              key={v.key}
              type="button"
              onClick={() => onSelectView(v.key)}
              className={`
                text-left px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#00b8a6]
                ${activeView === v.key
                  ? 'bg-[#014D4E] text-white border-[#014D4E]'
                  : 'bg-fill text-ink border-line hover:border-brand'}
              `}
            >
              <p className="text-sm font-semibold">{v.label}</p>
              <p className={`text-xs mt-0.5 ${activeView === v.key ? 'text-white/75' : 'text-ink-muted'}`}>
                {v.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Sections + Key questions — side by side */}
      <div className={!activeView ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
        {/* Sections — shown when no view selected */}
        {!activeView && (
          <div className="bg-card border border-line rounded-xl p-5">
            <p className="text-sm font-semibold text-ink mb-1">Sections to include</p>
            <p className="text-sm text-ink-muted mb-3">Tick the sections you want to appear in your report.</p>
            <div className="flex flex-wrap gap-4">
              <Toggle label="KLOE Summary"       checked={showKloes}        onChange={v => setShowKloes(v)} />
              <Toggle label="Action Plan Items"  checked={showActions}      onChange={v => setShowActions(v)} />
              {isAdmin && <Toggle label="HR Compliance" checked={showHr}   onChange={v => setShowHr(v)} />}
              <Toggle label="Annual Review"      checked={showAnnualReview} onChange={v => setShowAnnualReview(v)} />
            </div>
          </div>
        )}

        {/* Key questions */}
        <div className="bg-card border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-ink">Key question areas</p>
            <button
              type="button"
              onClick={() => onToggleAllKQs(!allKQsSelected)}
              className="text-xs font-medium text-brand hover:underline focus:outline-none"
            >
              {allKQsSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <p className="text-sm text-ink-muted mb-3">Filter the report to one or more CQC key questions, or leave all selected for a full picture.</p>
          <div className="flex flex-wrap gap-4">
            {keyQuestions.map(kq => (
              <Toggle
                key={kq}
                label={kq}
                checked={selectedKQs.has(kq)}
                onChange={v => onToggleKQ(kq, v)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action plan filters + HR filters — side by side when both visible */}
      {(showActions || (showHr && hrStaff.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {showActions && (
            <div className="bg-card border border-line rounded-xl p-5">
              <p className="text-sm font-semibold text-ink mb-3">Action plan filters</p>
              <div className="max-w-xs">
                <label className="block text-xs font-medium text-ink-dim mb-1">Action status</label>
                <select
                  value={actionStatus}
                  onChange={e => { setActionStatus(e.target.value as typeof actionStatus); onClearView() }}
                  className={inputClass}
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          )}
          {showHr && hrStaff.length > 0 && (
            <div className="bg-card border border-line rounded-xl p-5">
              <p className="text-sm font-semibold text-ink mb-3">HR filters</p>
              <div className="max-w-xs">
                <label className="block text-xs font-medium text-ink-dim mb-1">Staff member</label>
                <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className={inputClass}>
                  <option value="all">All staff</option>
                  {hrStaff.map(h => (
                    <option key={h.user_id} value={h.user_id}>
                      {h.full_name ?? h.user_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Annual review year selector */}
      {showAnnualReview && mockInspections.length > 0 && (
        <div className="bg-card border border-line rounded-xl p-5">
          <p className="text-sm font-semibold text-ink mb-3">Annual review filters</p>
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-ink-dim mb-1">Year</label>
            <select
              value={reviewYear}
              onChange={e => setReviewYear(Number(e.target.value))}
              className={inputClass}
            >
              {availableYears.length > 0
                ? availableYears.map(y => <option key={y} value={y}>{y}</option>)
                : <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              }
            </select>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrint}
          className="
            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-[#014D4E] text-white text-sm font-semibold
            hover:bg-[#013636] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
            transition-colors
          "
        >
          <span aria-hidden="true">🖨</span> Print / Save as PDF
        </button>
      </div>
    </div>
  )
}
