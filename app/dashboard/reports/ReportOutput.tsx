'use client'

import StatusBadge from '@/components/StatusBadge'
import RagBadge from '@/components/RagBadge'
import type { ComplianceStatus } from '@/lib/types'
import type { RAGStatus } from '@/lib/rag'
import KloeTableHeader, { type KloeDir } from '../kloes/KloeTableHeader'
import {
  type KloeRow, type ActionRow, type HrRow, type MockInspectionYear, type ViewKey, type SnapshotData,
  REPORT_KLOE_COLUMNS, REPORT_KLOE_COLUMNS_PRE,
  RAG_COLOURS, HR_STATUS_LABELS, HR_STATUS_PILL,
  MOCK_RATING_LABELS, MOCK_RATING_COLOURS,
  formatDate, dateStatus, trendArrow,
} from './report-types'

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  orgName: string
  orgLogoUrl: string | null
  activeView: ViewKey | null
  generatedAt: string
  selectedKQs: Set<string>
  keyQuestions: string[]
  // filtered/sorted data
  sortedKloes: KloeRow[]
  filteredKloes: KloeRow[]
  filteredActions: ActionRow[]
  filteredHr: HrRow[]
  filteredMocks: MockInspectionYear[]
  evidenceCounts: Record<string, number>
  // computed stats
  ragCounts: { green: number; amber: number; red: number; grey: number; total: number }
  actionCounts: { open: number; overdue: number; total: number }
  previousSnapshot: SnapshotData | null
  // section visibility
  showKloes: boolean
  showActions: boolean
  showHr: boolean
  showAnnualReview: boolean
  reviewYear: number
  // KLOE sort
  kloeSort: string
  kloeSortDir: KloeDir
  onKloeSort: (col: string, dir: KloeDir) => void
  // AI narrative
  narrative: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportOutput({
  orgName, orgLogoUrl, activeView, generatedAt,
  selectedKQs, keyQuestions,
  sortedKloes, filteredKloes, filteredActions, filteredHr, filteredMocks,
  evidenceCounts, ragCounts, actionCounts, previousSnapshot,
  showKloes, showActions, showHr, showAnnualReview, reviewYear,
  kloeSort, kloeSortDir, onKloeSort,
  narrative,
}: Props) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#111' }}>

      {/* Report header */}
      <div style={{ marginBottom: '24px', borderBottom: '2px solid #014D4E', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {orgLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgLogoUrl}
                alt={`${orgName} logo`}
                style={{ height: '52px', maxWidth: '180px', width: 'auto', objectFit: 'contain' }}
              />
            )}
            <div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#014D4E', margin: 0 }}>
                {activeView === 'pre-inspection' ? 'Inspection Readiness Report' : 'Custom Report'}
              </p>
              <p style={{ fontSize: '14px', color: '#1a1a1a', margin: '2px 0 0' }}>{orgName}</p>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#1a1a1a', margin: 0 }}>Generated {generatedAt}</p>
        </div>
        {selectedKQs.size < keyQuestions.length && (
          <p style={{ fontSize: '11px', color: '#1a1a1a', marginTop: '6px' }}>
            Filtered to: {[...selectedKQs].join(' · ')}
          </p>
        )}
      </div>

      {/* ── RAG scorecard ─────────────────────────────────────────────────── */}
      {showKloes && ragCounts.total > 0 && (() => {
        const snap = previousSnapshot
        const snapDate = snap
          ? new Date(snap.captured_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          : null

        function delta(current: number, prev: number | undefined, lowerIsBetter: boolean): { diff: number; colour: string } | null {
          if (prev === undefined || prev === null) return null
          const diff = current - prev
          if (diff === 0) return null
          const improving = lowerIsBetter ? diff < 0 : diff > 0
          return { diff, colour: improving ? '#15803d' : '#b91c1c' }
        }

        function DeltaBadge({ d }: { d: { diff: number; colour: string } | null }) {
          if (!d || !snapDate) return null
          const arrow = d.diff > 0 ? '↑' : '↓'
          return (
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: d.colour, fontWeight: 600 }}>
              {arrow}{Math.abs(d.diff)} since {snapDate}
            </p>
          )
        }

        const kloeStats = [
          { label: 'Green',      value: ragCounts.green, prev: snap?.green, bg: '#f0fdf4', border: '#86efac', text: '#15803d', lowerIsBetter: false },
          { label: 'Amber',      value: ragCounts.amber, prev: snap?.amber, bg: '#fffbeb', border: '#fcd34d', text: '#b45309', lowerIsBetter: true  },
          { label: 'Red',        value: ragCounts.red,   prev: snap?.red,   bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', lowerIsBetter: true  },
          { label: 'Unassessed', value: ragCounts.grey,  prev: snap?.grey,  bg: '#f9fafb', border: '#d1d5db', text: '#6b7280', lowerIsBetter: true  },
        ]

        return (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '20px 0' }}>
            {kloeStats.map(s => {
              const d = delta(s.value, s.prev, s.lowerIsBetter)
              return (
                <div key={s.label} style={{
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: '8px', padding: '10px 18px', minWidth: '90px', textAlign: 'center',
                }}>
                  <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: s.text, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: s.text, fontWeight: 500 }}>{s.label}</p>
                  <DeltaBadge d={d} />
                </div>
              )
            })}
            {showActions && (
              <>
                <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />
                <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', padding: '10px 18px', minWidth: '90px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#1d4ed8', lineHeight: 1 }}>{actionCounts.open}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#1d4ed8', fontWeight: 500 }}>Open actions</p>
                  <DeltaBadge d={delta(actionCounts.open, snap?.open_actions, true)} />
                </div>
                {actionCounts.overdue > 0 && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 18px', minWidth: '90px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#b91c1c', lineHeight: 1 }}>{actionCounts.overdue}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b91c1c', fontWeight: 500 }}>Overdue</p>
                    <DeltaBadge d={delta(actionCounts.overdue, snap?.overdue_actions, true)} />
                  </div>
                )}
              </>
            )}
            {snap && snapDate && (
              <p style={{ alignSelf: 'flex-end', fontSize: '11px', color: '#1a1a1a', margin: '0 0 10px 4px' }}>
                vs {snapDate}
              </p>
            )}
          </div>
        )
      })()}

      {/* ── AI narrative ──────────────────────────────────────────────────── */}
      {narrative && (
        <div style={{
          background: '#f0fdf9', border: '1px solid #99f6e4',
          borderRadius: '8px', padding: '16px 20px', margin: '0 0 24px',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0d9488' }}>
            Summary
          </p>
          <p style={{ margin: 0, fontSize: '15px', color: '#1a1a1a', lineHeight: 1.6 }}>{narrative}</p>
        </div>
      )}

      {/* ── KLOE with Actions combined view ───────────────────────────────── */}
      {activeView === 'kloe-with-actions' && (
        <div>
          <SectionHeading>KLOEs with Actions ({filteredKloes.length} KLOEs)</SectionHeading>
          {filteredKloes.length === 0 ? (
            <p style={{ color: '#1a1a1a', fontSize: '14px' }}>No KLOEs match the selected filters.</p>
          ) : (
            filteredKloes.map(k => {
              const linkedActions = filteredActions.filter(a => a.klo_item_id === k.klo_item_id)
              return (
                <div key={k.id} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
                    borderRadius: '6px', padding: '10px 14px', marginBottom: '6px',
                  }}>
                    <span style={{ color: RAG_COLOURS[k.rag] ?? '#6b7280', fontSize: '18px', lineHeight: 1 }}>●</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>{k.title}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#1a1a1a' }}>
                        {k.key_question_name} · {k.status.replace('_', ' ')} · Next review: {formatDate(k.next_review_due)}
                      </p>
                    </div>
                  </div>
                  {linkedActions.length === 0 ? (
                    <p style={{ margin: '0 0 0 14px', fontSize: '13px', color: '#1a1a1a' }}>No action items linked to this KLOE.</p>
                  ) : (
                    <table style={{ width: 'calc(100% - 14px)', borderCollapse: 'collapse', fontSize: '14px', marginLeft: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          {['Action', 'Priority', 'Status', 'Due Date', 'Assigned To'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: '#1a1a1a', borderBottom: '1px solid #d1d5db' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {linkedActions.map((a, i) => (
                          <tr key={a.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{a.title}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.priority}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(a.due_date)}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>{a.assigned_to_name ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Section 1: KLOE Summary ───────────────────────────────────────── */}
      {showKloes && activeView !== 'kloe-with-actions' && (
        <div>
          <SectionHeading>
            {activeView === 'pre-inspection' ? 'Inspection Readiness' : 'KLOE Summary'} ({filteredKloes.length} KLOEs)
          </SectionHeading>
          {filteredKloes.length === 0 ? (
            <p style={{ color: '#1a1a1a', fontSize: '12px' }}>No KLOEs match the selected filters.</p>
          ) : (
            <table className="w-full text-sm table-fixed" style={{ borderCollapse: 'collapse' }}>
              <KloeTableHeader
                sort={kloeSort}
                dir={kloeSortDir}
                columns={activeView === 'pre-inspection' ? REPORT_KLOE_COLUMNS_PRE : REPORT_KLOE_COLUMNS}
                hasTrailingTh={false}
                onSort={onKloeSort}
              />
              <tbody className="divide-y divide-gray-50">
                {sortedKloes.map((k) => (
                  <tr key={k.id} className="hover:bg-canvas transition-colors">
                    <td className="px-4 py-3 text-ink-dim">{k.key_question_name}</td>
                    <td className="px-4 py-3 text-ink">{k.title}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={k.status as ComplianceStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <RagBadge status={k.rag as RAGStatus} compact />
                    </td>
                    <td className="px-4 py-3 text-ink-dim">{formatDate(k.next_review_due)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#014D4E] text-white text-xs font-bold">
                        {k.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-dim">{k.assigned_to_name ?? '—'}</td>
                    {activeView === 'pre-inspection' && (
                      <td className={`px-4 py-3 text-center font-medium ${(evidenceCounts[k.klo_item_id] ?? 0) === 0 ? 'text-red-600' : 'text-ink-dim'}`}>
                        {evidenceCounts[k.klo_item_id] ?? 0}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Section 2: Action Plan Items ──────────────────────────────────── */}
      {showActions && activeView !== 'kloe-with-actions' && (
        <div>
          <SectionHeading>Action Plan Items ({filteredActions.length})</SectionHeading>
          {filteredActions.length === 0 ? (
            <p style={{ color: '#1a1a1a', fontSize: '12px' }}>No action items match the selected filters.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  {['KLOE', 'Action', 'Priority', 'Status', 'Due Date', 'Assigned To', 'Completion Notes'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#1a1a1a', borderBottom: '1px solid #d1d5db' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredActions.map((a, i) => (
                  <tr key={a.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a', fontSize: '13px' }}>{a.klo_title}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{a.title}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.priority}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>{formatDate(a.due_date)}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>{a.assigned_to_name ?? '—'}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a', fontSize: '13px' }}>{a.completion_notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Section 3: HR Compliance ──────────────────────────────────────── */}
      {showHr && (
        <div>
          <SectionHeading>HR Compliance ({filteredHr.length} staff)</SectionHeading>
          {filteredHr.length === 0 ? (
            <p style={{ color: '#1a1a1a', fontSize: '12px' }}>No staff records found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  {['Name', 'Job Title', 'DBS', 'Supervision', 'Appraisal', 'Mandatory Training'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#1a1a1a', borderBottom: '1px solid #d1d5db' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredHr.map((h, i) => {
                  const dbsStatus = dateStatus(h.dbs_next_review_due)
                  const supStatus = dateStatus(h.supervision_next_due)
                  const appStatus = dateStatus(h.appraisal_next_due)
                  return (
                    <tr key={h.user_id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{h.full_name ?? '—'}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>{h.job_title ?? '—'}</td>
                      {[dbsStatus, supStatus, appStatus].map((s, idx) => (
                        <td key={idx} style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{ display: 'inline-block', borderRadius: '9999px', padding: '2px 8px', fontSize: '12px', fontWeight: 500, backgroundColor: HR_STATUS_PILL[s].bg, color: HR_STATUS_PILL[s].color }}>
                            {HR_STATUS_LABELS[s]}
                          </span>
                        </td>
                      ))}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>
                        {(() => {
                          const pill = h.mandatory_training_complete
                            ? { bg: '#dcfce7', color: '#15803d', label: 'Complete' }
                            : { bg: '#f3f4f6', color: '#6b7280', label: 'Incomplete' }
                          return (
                            <span style={{ display: 'inline-block', borderRadius: '9999px', padding: '2px 8px', fontSize: '12px', fontWeight: 500, backgroundColor: pill.bg, color: pill.color }}>
                              {pill.label}
                            </span>
                          )
                        })()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Section 4: Annual Review ──────────────────────────────────────── */}
      {showAnnualReview && (
        <div>
          <SectionHeading>Annual Review — Mock Inspections {reviewYear} ({filteredMocks.length})</SectionHeading>
          {filteredMocks.length === 0 ? (
            <p style={{ color: '#1a1a1a', fontSize: '12px' }}>No completed mock inspections found for {reviewYear}.</p>
          ) : (() => {
            const prevRatings: Record<string, string> = {}
            return filteredMocks.map((insp, inspIdx) => {
              const label = insp.type === 'full'
                ? 'Full Inspection'
                : `Partial — ${insp.key_question_name ?? 'Unknown'}`

              return (
                <div key={insp.id} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '15px' }}>{label}</span>
                      {insp.conducted_by_name && (
                        <span style={{ color: '#1a1a1a', fontSize: '13px', marginLeft: '12px' }}>
                          Conducted by {insp.conducted_by_name}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', color: '#1a1a1a' }}>
                      {formatDate(insp.started_at)}
                      {insp.completed_at && insp.completed_at !== insp.started_at
                        ? ` – ${formatDate(insp.completed_at)}`
                        : ''}
                    </span>
                  </div>
                  {insp.ratings.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          {['Key Question', 'Self-Assessed Rating', 'Trend'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#1a1a1a', borderBottom: '1px solid #d1d5db' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {insp.ratings.map((r, i) => {
                          const prevKey = `${r.name}`
                          const trend   = trendArrow(prevRatings[prevKey], r.worstRating)
                          prevRatings[prevKey] = r.worstRating
                          return (
                            <tr key={r.name} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                              <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{r.name}</td>
                              <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>
                                <span style={{ color: MOCK_RATING_COLOURS[r.worstRating] ?? '#374151', fontWeight: 600 }}>
                                  {MOCK_RATING_LABELS[r.worstRating] ?? r.worstRating}
                                </span>
                              </td>
                              <td style={{ padding: '7px 10px', borderBottom: '1px solid #e5e7eb' }}>
                                {trend ? (
                                  <span style={{ color: trend.colour, fontWeight: 700, fontSize: '16px' }}>
                                    {trend.symbol}
                                  </span>
                                ) : (
                                  <span style={{ color: '#1a1a1a', fontSize: '13px' }}>
                                    {inspIdx === 0 ? 'First inspection' : '—'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#1a1a1a', fontSize: '12px', paddingLeft: '8px' }}>No ratings recorded.</p>
                  )}
                </div>
              )
            })
          })()}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#1a1a1a', display: 'flex', justifyContent: 'space-between' }}>
        <span>AlwaysReady — {orgName}</span>
        <span>Generated {generatedAt} · For internal governance use only</span>
      </div>
    </div>
  )
}
