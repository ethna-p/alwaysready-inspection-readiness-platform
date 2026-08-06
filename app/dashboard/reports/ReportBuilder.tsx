'use client'

/**
 * ReportBuilder — filter controls + rendered report + print button.
 *
 * Filters (all client-side, no extra DB round-trips):
 *   Key questions   — which of the five CQC key question areas to include
 *   Sections        — KLOE Summary / Action Plan Items / HR Compliance
 *   Action status   — All / Open / In progress / Completed
 *   Staff member    — All staff / specific individual (HR section only)
 */

import { useState, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type KloeRow = {
  id: string
  title: string
  key_question_name: string
  status: string
  rag: 'green' | 'amber' | 'red' | 'grey'
  next_review_due: string | null
  priority: number
  assigned_to_name: string | null
}

export type ActionRow = {
  id: string
  klo_title: string
  key_question_name: string
  title: string
  status: 'open' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
  due_date: string | null
  assigned_to_name: string | null
  completion_notes: string | null
  completed_at: string | null
}

export type HrRow = {
  user_id: string
  full_name: string | null
  job_title: string | null
  dbs_next_review_due: string | null
  supervision_next_due: string | null
  appraisal_next_due: string | null
  mandatory_training_complete: boolean
}

interface Props {
  orgName: string
  keyQuestions: string[]
  kloes: KloeRow[]
  actions: ActionRow[]
  hrStaff: HrRow[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dateStatus(iso: string | null): 'overdue' | 'due_soon' | 'ok' | 'not_set' {
  if (!iso) return 'not_set'
  const now = new Date()
  const due = new Date(iso)
  if (due < now) return 'overdue'
  const days = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return days <= 30 ? 'due_soon' : 'ok'
}

const RAG_COLOURS: Record<string, string> = {
  green: '#15803d',
  amber: '#b45309',
  red:   '#b91c1c',
  grey:  '#6b7280',
}

const RAG_LABELS: Record<string, string> = {
  green: 'Green',
  amber: 'Amber',
  red:   'Red',
  grey:  'Not reviewed',
}

const HR_STATUS_LABELS: Record<string, string> = {
  overdue:  'Overdue',
  due_soon: 'Due soon',
  ok:       'Current',
  not_set:  'Not set',
}

const HR_STATUS_COLOURS: Record<string, string> = {
  overdue:  '#b91c1c',
  due_soon: '#b45309',
  ok:       '#15803d',
  not_set:  '#6b7280',
}

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

// ─── Section heading (print-safe) ─────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: '#014D4E',
      borderBottom: '1px solid #d1d5db',
      paddingBottom: '4px',
      marginBottom: '12px',
      marginTop: '24px',
    }}>
      {children}
    </h2>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportBuilder({ orgName, keyQuestions, kloes, actions, hrStaff }: Props) {
  // ── Filter state ────────────────────────────────────────────────────────────
  const [selectedKQs, setSelectedKQs]         = useState<Set<string>>(new Set(keyQuestions))
  const [showKloes, setShowKloes]             = useState(true)
  const [showActions, setShowActions]         = useState(true)
  const [showHr, setShowHr]                   = useState(true)
  const [actionStatus, setActionStatus]       = useState('all')
  const [selectedStaff, setSelectedStaff]     = useState('all')

  function toggleKQ(name: string, checked: boolean) {
    setSelectedKQs(prev => {
      const next = new Set(prev)
      checked ? next.add(name) : next.delete(name)
      return next
    })
  }

  function toggleAllKQs(checked: boolean) {
    setSelectedKQs(checked ? new Set(keyQuestions) : new Set())
  }

  // ── Filtered data ───────────────────────────────────────────────────────────
  const filteredKloes = useMemo(() =>
    kloes.filter(k => selectedKQs.has(k.key_question_name)),
    [kloes, selectedKQs]
  )

  const filteredActions = useMemo(() =>
    actions.filter(a => {
      if (!selectedKQs.has(a.key_question_name)) return false
      if (actionStatus !== 'all' && a.status !== actionStatus) return false
      return true
    }),
    [actions, selectedKQs, actionStatus]
  )

  const filteredHr = useMemo(() =>
    selectedStaff === 'all'
      ? hrStaff
      : hrStaff.filter(h => h.user_id === selectedStaff),
    [hrStaff, selectedStaff]
  )

  const allKQsSelected = selectedKQs.size === keyQuestions.length

  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const inputClass = `
    border border-line rounded-lg px-3 py-2 text-sm text-ink bg-card w-full
    focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
  `

  return (
    <div>
      {/* ── Filter panel (hidden when printing) ──────────────────────────── */}
      <div className="print:hidden space-y-6 mb-8">

        {/* Sections */}
        <div className="bg-card border border-line rounded-xl p-5">
          <p className="text-sm font-semibold text-ink mb-3">Sections to include</p>
          <div className="flex flex-wrap gap-4">
            <Toggle label="KLOE Summary"       checked={showKloes}   onChange={setShowKloes} />
            <Toggle label="Action Plan Items"  checked={showActions} onChange={setShowActions} />
            <Toggle label="HR Compliance"      checked={showHr}      onChange={setShowHr} />
          </div>
        </div>

        {/* Key questions */}
        <div className="bg-card border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-ink">Key question areas</p>
            <button
              type="button"
              onClick={() => toggleAllKQs(!allKQsSelected)}
              className="text-xs font-medium text-brand hover:underline focus:outline-none"
            >
              {allKQsSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            {keyQuestions.map(kq => (
              <Toggle
                key={kq}
                label={kq}
                checked={selectedKQs.has(kq)}
                onChange={v => toggleKQ(kq, v)}
              />
            ))}
          </div>
        </div>

        {/* Action plan filters */}
        {showActions && (
          <div className="bg-card border border-line rounded-xl p-5">
            <p className="text-sm font-semibold text-ink mb-3">Action plan filters</p>
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-ink-dim mb-1">Action status</label>
              <select value={actionStatus} onChange={e => setActionStatus(e.target.value)} className={inputClass}>
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        )}

        {/* HR filters */}
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

        {/* Print button */}
        <button
          type="button"
          onClick={() => window.print()}
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

      {/* ── Report output ─────────────────────────────────────────────────── */}
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#111' }}>

        {/* Report header */}
        <div style={{ marginBottom: '24px', borderBottom: '2px solid #014D4E', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#014D4E', margin: 0 }}>
                Custom Report
              </p>
              <p style={{ fontSize: '14px', color: '#374151', margin: '2px 0 0' }}>{orgName}</p>
            </div>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Generated {generatedAt}</p>
          </div>
          {selectedKQs.size < keyQuestions.length && (
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
              Filtered to: {[...selectedKQs].join(' · ')}
            </p>
          )}
        </div>

        {/* ── Section 1: KLOE Summary ──────────────────────────────────────── */}
        {showKloes && (
          <div>
            <SectionHeading>KLOE Summary ({filteredKloes.length} KLOEs)</SectionHeading>
            {filteredKloes.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '12px' }}>No KLOEs match the selected filters.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['Key Question', 'KLOE', 'Status', 'RAG', 'Next Review', 'Priority', 'Assigned To'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredKloes.map((k, i) => (
                    <tr key={k.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '11px' }}>{k.key_question_name}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{k.title}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{k.status.replace('_', ' ')}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ color: RAG_COLOURS[k.rag] ?? '#6b7280', fontWeight: 600 }}>
                          ● {RAG_LABELS[k.rag] ?? k.rag}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(k.next_review_due)}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{k.priority}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{k.assigned_to_name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Section 2: Action Plan Items ─────────────────────────────────── */}
        {showActions && (
          <div>
            <SectionHeading>Action Plan Items ({filteredActions.length})</SectionHeading>
            {filteredActions.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '12px' }}>No action items match the selected filters.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['KLOE', 'Action', 'Priority', 'Status', 'Due Date', 'Assigned To', 'Completion Notes'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActions.map((a, i) => (
                    <tr key={a.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '11px' }}>{a.klo_title}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{a.title}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.priority}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(a.due_date)}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{a.assigned_to_name ?? '—'}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '11px' }}>{a.completion_notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Section 3: HR Compliance ─────────────────────────────────────── */}
        {showHr && (
          <div>
            <SectionHeading>HR Compliance ({filteredHr.length} staff)</SectionHeading>
            {filteredHr.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '12px' }}>No staff records found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {['Name', 'Job Title', 'DBS', 'Supervision', 'Appraisal', 'Mandatory Training'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: '#374151', borderBottom: '1px solid #d1d5db' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHr.map((h, i) => {
                    const dbsStatus  = dateStatus(h.dbs_next_review_due)
                    const supStatus  = dateStatus(h.supervision_next_due)
                    const appStatus  = dateStatus(h.appraisal_next_due)
                    return (
                      <tr key={h.user_id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{h.full_name ?? '—'}</td>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{h.job_title ?? '—'}</td>
                        {[dbsStatus, supStatus, appStatus].map((s, idx) => (
                          <td key={idx} style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>
                            <span style={{ color: HR_STATUS_COLOURS[s], fontWeight: 600 }}>
                              {HR_STATUS_LABELS[s]}
                            </span>
                          </td>
                        ))}
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{ color: h.mandatory_training_complete ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                            {h.mandatory_training_complete ? 'Complete' : 'Incomplete'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontSize: '10px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
          <span>AlwaysReady — {orgName}</span>
          <span>Generated {generatedAt} · For internal governance use only</span>
        </div>
      </div>
    </div>
  )
}
