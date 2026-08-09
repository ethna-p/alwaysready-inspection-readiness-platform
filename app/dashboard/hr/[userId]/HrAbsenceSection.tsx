'use client'

/**
 * HrAbsenceSection — sick leave and absence episode tracking.
 *
 * Per episode: start date, end date, days (default: calendar days, editable),
 * reason category, notes, and return-to-work (RTW) interview fields.
 *
 * Displays:
 *  - Total sick days in the current leave year (running total)
 *  - Bradford Factor for the rolling 52 weeks (S² × D, computed in browser)
 *  - Episode list (newest first)
 *  - Add episode form
 */

import { useState, useTransition } from 'react'
import { saveAbsenceRecord, updateAbsenceRecord, deleteAbsenceRecord } from '../actions'
import type { HrAbsenceRecord } from '@/lib/types'

const REASON_CATEGORIES = [
  'Musculoskeletal',
  'Respiratory / Cold / Flu',
  'Mental health / Stress / Anxiety',
  'Gastrointestinal',
  'Injury',
  'Other',
] as const

type ReasonCategory = typeof REASON_CATEGORIES[number]

// ── Bradford Factor helpers ───────────────────────────────────────────────────

function bradfordFactor(records: HrAbsenceRecord[]): { score: number; band: 'low' | 'medium' | 'high' } {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 364) // rolling 52 weeks

  const rolling = records.filter(r => {
    if (r.absence_type !== 'sick') return false
    return new Date(r.start_date) >= cutoff
  })

  const S = rolling.length
  const D = rolling.reduce((sum, r) => sum + (r.absence_days ?? 0), 0)
  const score = S * S * D

  let band: 'low' | 'medium' | 'high' = 'low'
  if (score >= 451) band = 'high'
  else if (score >= 51) band = 'medium'

  return { score, band }
}

// ── Year-to-date days ─────────────────────────────────────────────────────────

function ytdSickDays(records: HrAbsenceRecord[], leaveYearStart: Date): number {
  return records
    .filter(r => r.absence_type === 'sick' && new Date(r.start_date) >= leaveYearStart)
    .reduce((sum, r) => sum + (r.absence_days ?? 0), 0)
}

// ── Formatting ────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  userId: string
  records: HrAbsenceRecord[]
  leaveYearStart: string | null   // e.g. '2026-04-01' from hr_holiday_allowances, or null
  isViewer?: boolean
}

type FormState = {
  absenceType: 'sick' | 'other'
  startDate: string
  endDate: string
  absenceDays: string
  daysManual: boolean
  reasonCategory: string
  notes: string
  rtwInterviewCompleted: boolean
  rtwInterviewDate: string
  rtwNotes: string
}

function emptyForm(): FormState {
  return {
    absenceType: 'sick',
    startDate: '',
    endDate: '',
    absenceDays: '',
    daysManual: false,
    reasonCategory: '',
    notes: '',
    rtwInterviewCompleted: false,
    rtwInterviewDate: '',
    rtwNotes: '',
  }
}

// Auto-calculate calendar days from date range
function calcDays(start: string, end: string): string {
  if (!start || !end) return ''
  const s = new Date(start)
  const e = new Date(end)
  if (e < s) return ''
  return String(Math.round((e.getTime() - s.getTime()) / 86400000) + 1)
}

export default function HrAbsenceSection({ userId, records, leaveYearStart, isViewer = false }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState<FormState>(emptyForm())
  const [message, setMessage]         = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)

  // Editing an existing record
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editForm, setEditForm]       = useState<Partial<FormState>>({})
  const [editError, setEditError]     = useState<string | null>(null)
  const [editMessage, setEditMessage] = useState<string | null>(null)

  // Stats
  const lys = leaveYearStart ? new Date(leaveYearStart) : new Date(new Date().getFullYear(), 3, 1) // default Apr 1
  const ytd = ytdSickDays(records, lys)
  const { score: bf, band: bfBand } = bradfordFactor(records)

  const bfColor = {
    low:    'text-green-700 bg-green-50',
    medium: 'text-amber-700 bg-amber-50',
    high:   'text-red-700   bg-red-50',
  }[bfBand]

  const bfLabel = { low: 'Low risk', medium: 'Medium risk', high: 'High risk' }[bfBand]

  // ── Form handlers ─────────────────────────────────────────────────────────

  function handleFormChange(key: keyof FormState, value: string | boolean) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      // Auto-fill days when dates change (unless user has manually set days)
      if (!next.daysManual && (key === 'startDate' || key === 'endDate')) {
        const auto = calcDays(next.startDate, next.endDate)
        if (auto) next.absenceDays = auto
      }
      // Mark days as manual if user edits the days field directly
      if (key === 'absenceDays') next.daysManual = true
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    if (!form.startDate) { setError('Start date is required.'); return }

    startTransition(async () => {
      const result = await saveAbsenceRecord(userId, {
        absenceType:            form.absenceType,
        startDate:              form.startDate,
        endDate:                form.endDate || null,
        absenceDays:            form.absenceDays ? parseFloat(form.absenceDays) : null,
        reasonCategory:         form.reasonCategory || null,
        notes:                  form.notes || null,
        rtwInterviewCompleted:  form.rtwInterviewCompleted,
        rtwInterviewDate:       form.rtwInterviewDate || null,
        rtwNotes:               form.rtwNotes || null,
      })
      if (result.success) {
        setMessage(result.message ?? 'Saved.')
        setForm(emptyForm())
        setShowForm(false)
      } else {
        setError(result.error)
      }
    })
  }

  function startEdit(r: HrAbsenceRecord) {
    setEditingId(r.id)
    setEditError(null)
    setEditMessage(null)
    setEditForm({
      endDate:               r.end_date ?? '',
      absenceDays:           r.absence_days != null ? String(r.absence_days) : '',
      daysManual:            true,
      reasonCategory:        r.reason_category ?? '',
      notes:                 r.notes ?? '',
      rtwInterviewCompleted: r.rtw_interview_completed,
      rtwInterviewDate:      r.rtw_interview_date ?? '',
      rtwNotes:              r.rtw_notes ?? '',
    })
  }

  function handleEditChange(key: keyof FormState, value: string | boolean) {
    setEditForm(prev => ({ ...prev, [key]: value }))
  }

  function handleEditSave(r: HrAbsenceRecord) {
    setEditError(null)
    setEditMessage(null)
    startTransition(async () => {
      const result = await updateAbsenceRecord(r.id, userId, {
        endDate:               (editForm.endDate as string) || null,
        absenceDays:           editForm.absenceDays ? parseFloat(editForm.absenceDays as string) : null,
        reasonCategory:        (editForm.reasonCategory as string) || null,
        notes:                 (editForm.notes as string) || null,
        rtwInterviewCompleted: !!editForm.rtwInterviewCompleted,
        rtwInterviewDate:      (editForm.rtwInterviewDate as string) || null,
        rtwNotes:              (editForm.rtwNotes as string) || null,
      })
      if (result.success) {
        setEditMessage(result.message ?? 'Saved.')
        setEditingId(null)
      } else {
        setEditError(result.error)
      }
    })
  }

  function handleDelete(recordId: string) {
    if (!confirm('Delete this absence record? This cannot be undone.')) return
    startTransition(async () => {
      await deleteAbsenceRecord(recordId, userId)
    })
  }

  // ── Shared input class ───────────────────────────────────────────────────

  const inputCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-card focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]'

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-brand mb-4">Absence Records</h2>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-card rounded-xl border border-line p-4 text-center">
          <p className="text-2xl font-bold text-ink">{ytd % 1 === 0 ? ytd : ytd.toFixed(1)}</p>
          <p className="text-xs text-ink-muted mt-0.5">sick days this leave year</p>
        </div>
        <div className="bg-card rounded-xl border border-line p-4 text-center">
          <p className={`text-2xl font-bold ${bf === 0 ? 'text-ink' : bfColor.split(' ')[0]}`}>{bf}</p>
          <p className="text-xs text-ink-muted mt-0.5">
            Bradford Factor{' '}
            {bf > 0 && (
              <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${bfColor}`}>
                {bfLabel}
              </span>
            )}
          </p>
          <p className="text-[10px] text-ink-muted mt-1">rolling 52 weeks · sick only</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-line p-6">

        {/* Global feedback */}
        {message && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{message}</div>
        )}
        {editMessage && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{editMessage}</div>
        )}

        {/* Episode list */}
        {records.length === 0 && !showForm && (
          <p className="text-sm text-ink-muted mb-5">No absence records yet.</p>
        )}

        {records.length > 0 && (
          <div className="mb-6 space-y-3">
            {records.map(r => (
              <div key={r.id} className="border border-line rounded-lg overflow-hidden">
                {/* Summary row */}
                <div className="flex items-start justify-between gap-4 px-4 py-3 bg-fill">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className={`text-[11px] font-medium rounded px-1.5 py-0.5 ${
                        r.absence_type === 'sick'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-ink-muted/10 text-ink-muted'
                      }`}>
                        {r.absence_type === 'sick' ? 'Sick leave' : 'Other absence'}
                      </span>
                      {r.reason_category && (
                        <span className="text-[11px] text-ink-muted">{r.reason_category}</span>
                      )}
                      {!r.end_date && (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">Ongoing</span>
                      )}
                    </div>
                    <p className="text-sm text-ink font-medium">
                      {fmt(r.start_date)}
                      {r.end_date ? ` – ${fmt(r.end_date)}` : ' – present'}
                      {r.absence_days != null && (
                        <span className="ml-2 text-ink-muted font-normal">
                          ({r.absence_days % 1 === 0 ? r.absence_days : r.absence_days.toFixed(1)} {r.absence_days === 1 ? 'day' : 'days'})
                        </span>
                      )}
                    </p>
                    {/* RTW status */}
                    {r.end_date && (
                      <p className="text-xs mt-0.5">
                        {r.rtw_interview_completed ? (
                          <span className="text-green-700">✓ RTW interview completed{r.rtw_interview_date ? ` ${fmt(r.rtw_interview_date)}` : ''}</span>
                        ) : (
                          <span className="text-amber-700">RTW interview not recorded</span>
                        )}
                      </p>
                    )}
                  </div>
                  {!isViewer && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => editingId === r.id ? setEditingId(null) : startEdit(r)}
                        className="text-xs text-brand hover:underline"
                      >
                        {editingId === r.id ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={isPending}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Notes (collapsed unless present) */}
                {r.notes && editingId !== r.id && (
                  <div className="px-4 py-2 border-t border-line text-xs text-ink-muted">{r.notes}</div>
                )}

                {/* Inline edit form */}
                {editingId === r.id && (
                  <div className="px-4 py-4 border-t border-line bg-card space-y-3">
                    {editError && (
                      <p className="text-sm text-red-700 bg-red-50 rounded px-3 py-2">{editError}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`edit-end-${r.id}`} className="block text-xs font-medium text-ink mb-1">End Date</label>
                        <input
                          id={`edit-end-${r.id}`}
                          type="date"
                          value={editForm.endDate as string}
                          onChange={e => handleEditChange('endDate', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-days-${r.id}`} className="block text-xs font-medium text-ink mb-1">Days absent</label>
                        <input
                          id={`edit-days-${r.id}`}
                          type="number"
                          min="0"
                          step="0.5"
                          value={editForm.absenceDays as string}
                          onChange={e => handleEditChange('absenceDays', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`edit-reason-${r.id}`} className="block text-xs font-medium text-ink mb-1">Reason category</label>
                      <select
                        id={`edit-reason-${r.id}`}
                        value={editForm.reasonCategory as string}
                        onChange={e => handleEditChange('reasonCategory', e.target.value)}
                        className={inputCls}
                      >
                        <option value="">— select —</option>
                        {REASON_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`edit-notes-${r.id}`} className="block text-xs font-medium text-ink mb-1">Notes</label>
                      <textarea
                        id={`edit-notes-${r.id}`}
                        rows={2}
                        value={editForm.notes as string}
                        onChange={e => handleEditChange('notes', e.target.value)}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                    {/* RTW */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          id={`edit-rtw-${r.id}`}
                          type="checkbox"
                          checked={!!editForm.rtwInterviewCompleted}
                          onChange={e => handleEditChange('rtwInterviewCompleted', e.target.checked)}
                          className="h-4 w-4 rounded border-line text-[#014D4E] focus:ring-[#014D4E]"
                        />
                        <label htmlFor={`edit-rtw-${r.id}`} className="text-xs font-medium text-ink">Return to work interview completed</label>
                      </div>
                      {editForm.rtwInterviewCompleted && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor={`edit-rtw-date-${r.id}`} className="block text-xs font-medium text-ink mb-1">RTW interview date</label>
                            <input
                              id={`edit-rtw-date-${r.id}`}
                              type="date"
                              value={editForm.rtwInterviewDate as string}
                              onChange={e => handleEditChange('rtwInterviewDate', e.target.value)}
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-rtw-notes-${r.id}`} className="block text-xs font-medium text-ink mb-1">RTW notes</label>
                            <input
                              id={`edit-rtw-notes-${r.id}`}
                              type="text"
                              value={editForm.rtwNotes as string}
                              onChange={e => handleEditChange('rtwNotes', e.target.value)}
                              className={inputCls}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleEditSave(r)}
                        disabled={isPending}
                        className="rounded-lg bg-[#014D4E] text-white text-sm font-medium px-4 py-2 hover:bg-[#013a3b] disabled:opacity-60 transition-colors"
                      >
                        {isPending ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add episode form */}
        {!isViewer && !showForm && (
          <button
            onClick={() => { setShowForm(true); setMessage(null); setError(null) }}
            className="text-sm text-brand hover:underline font-medium"
          >
            + Add absence episode
          </button>
        )}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-line pt-5 mt-2">
            <h3 className="text-sm font-semibold text-ink">New absence episode</h3>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Type */}
            <fieldset>
              <legend className="block text-sm font-medium text-ink mb-1">Type</legend>
              <div className="flex gap-4">
                {(['sick', 'other'] as const).map(t => (
                  <label key={t} className="flex items-center gap-1.5 text-sm text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="absence-type"
                      value={t}
                      checked={form.absenceType === t}
                      onChange={() => handleFormChange('absenceType', t)}
                      className="text-[#014D4E] focus:ring-[#014D4E]"
                    />
                    {t === 'sick' ? 'Sick leave' : 'Other absence'}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Dates + days */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="absence-start" className="block text-sm font-medium text-ink mb-1">Start date <span aria-hidden="true">*</span></label>
                <input
                  id="absence-start"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={e => handleFormChange('startDate', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="absence-end" className="block text-sm font-medium text-ink mb-1">End date <span className="text-ink-muted font-normal">(leave blank if ongoing)</span></label>
                <input
                  id="absence-end"
                  type="date"
                  value={form.endDate}
                  onChange={e => handleFormChange('endDate', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="absence-days" className="block text-sm font-medium text-ink mb-1">
                  Days absent
                  <span className="ml-1 text-ink-muted font-normal text-xs">(auto-calculated, editable)</span>
                </label>
                <input
                  id="absence-days"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.absenceDays}
                  onChange={e => handleFormChange('absenceDays', e.target.value)}
                  placeholder="e.g. 3"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="absence-reason" className="block text-sm font-medium text-ink mb-1">Reason category</label>
              <select
                id="absence-reason"
                value={form.reasonCategory}
                onChange={e => handleFormChange('reasonCategory', e.target.value)}
                className={inputCls}
              >
                <option value="">— select —</option>
                {REASON_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="absence-notes" className="block text-sm font-medium text-ink mb-1">Notes</label>
              <textarea
                id="absence-notes"
                rows={2}
                value={form.notes}
                onChange={e => handleFormChange('notes', e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="Optional — any context useful for inspection or management review"
              />
            </div>

            {/* RTW */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  id="absence-rtw"
                  type="checkbox"
                  checked={form.rtwInterviewCompleted}
                  onChange={e => handleFormChange('rtwInterviewCompleted', e.target.checked)}
                  className="h-4 w-4 rounded border-line text-[#014D4E] focus:ring-[#014D4E]"
                />
                <label htmlFor="absence-rtw" className="text-sm font-medium text-ink">Return to work interview completed</label>
              </div>
              {form.rtwInterviewCompleted && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                  <div>
                    <label htmlFor="absence-rtw-date" className="block text-sm font-medium text-ink mb-1">RTW interview date</label>
                    <input
                      id="absence-rtw-date"
                      type="date"
                      value={form.rtwInterviewDate}
                      onChange={e => handleFormChange('rtwInterviewDate', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="absence-rtw-notes" className="block text-sm font-medium text-ink mb-1">RTW notes</label>
                    <input
                      id="absence-rtw-notes"
                      type="text"
                      value={form.rtwNotes}
                      onChange={e => handleFormChange('rtwNotes', e.target.value)}
                      placeholder="e.g. phased return agreed"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm()); setError(null) }}
                className="text-sm text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-[#014D4E] text-white text-sm font-medium px-4 py-2 hover:bg-[#013a3b] disabled:opacity-60 transition-colors"
              >
                {isPending ? 'Saving…' : 'Save episode'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bradford Factor explanation */}
      <p className="mt-2 text-xs text-ink-muted">
        Bradford Factor = S² × D (S = number of separate absences, D = total days absent in rolling 52 weeks, sick leave only). Score ≤ 50 = low · 51–450 = medium · 451+ = high.
      </p>
    </section>
  )
}
