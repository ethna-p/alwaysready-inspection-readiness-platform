'use client'

/**
 * HrHolidaySection — holiday allowance per leave year.
 */

import { useState, useTransition } from 'react'
import { saveHolidayAllowance } from '../actions'
import type { HrHolidayAllowance } from '@/lib/types'

type Props = {
  userId: string
  allowances: HrHolidayAllowance[]
  holidayUnit: string
}

export default function HrHolidaySection({ userId, allowances, holidayUnit }: Props) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  // Current year allowance (most recent)
  const current = allowances[0] ?? null
  const hasData = current !== null

  const [leaveYearStart, setLeaveYearStart] = useState(current?.leave_year_start ?? '')
  const [total, setTotal]                   = useState(current?.total_allowance?.toString() ?? '28')
  const [taken, setTaken]                   = useState(current?.taken?.toString() ?? '0')
  const [carryOver, setCarryOver]           = useState(current?.carry_over?.toString() ?? '0')

  const totalNum     = parseFloat(total) || 0
  const takenNum     = parseFloat(taken) || 0
  const carryNum     = parseFloat(carryOver) || 0
  const remaining    = totalNum + carryNum - takenNum
  const barMax       = totalNum + carryNum
  const barPct       = barMax > 0 ? Math.min(100, Math.max(0, (remaining / barMax) * 100)) : 0

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    if (!leaveYearStart) {
      setError('Please set a leave year start date.')
      return
    }

    startTransition(async () => {
      const result = await saveHolidayAllowance(
        userId,
        leaveYearStart,
        totalNum,
        takenNum,
        carryNum,
      )
      if (result.success) setMessage(result.message ?? 'Saved.')
      else setError(result.error)
    })
  }

  const inputCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-card focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]'

  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-brand mb-4">
        Holiday / Leave Allowance <span className="text-xs font-normal text-ink-muted">({holidayUnit})</span>
      </h2>

      <div className="bg-card rounded-xl border border-line p-6">
        {message && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{message}</div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>
        )}

        {/* Remaining display — only shown once a leave year is configured */}
        {hasData && (
          <div className="mb-6 flex items-center gap-6">
            <div className="text-center shrink-0">
              <p className="text-3xl font-bold text-brand">
                {remaining % 1 === 0 ? remaining : remaining.toFixed(1)}
              </p>
              <p className="text-sm text-ink-muted mt-0.5">{holidayUnit} remaining</p>
            </div>
            <div className="flex-1 h-3 bg-fill-dim rounded-full overflow-hidden">
              <div
                className="h-3 rounded-full bg-[#00b8a6] transition-all"
                style={{ width: `${barPct}%` }}
              />
            </div>
          </div>
        )}

        {!hasData && (
          <p className="text-sm text-ink-muted mb-5">
            No leave year configured yet. Set a leave year start date and entitlement below.
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Leave year start */}
          <div>
            <label htmlFor="leave-year-start" className="block text-sm font-medium text-ink mb-1">Leave Year Start Date</label>
            <input
              id="leave-year-start"
              type="date"
              value={leaveYearStart}
              onChange={e => setLeaveYearStart(e.target.value)}
              className={`${inputCls} sm:w-56`}
            />
          </div>

          {/* Three numeric fields side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { label: `Entitlement (${holidayUnit})`, id: 'holiday-entitlement', value: total,     set: setTotal },
              { label: `Carry Over (${holidayUnit})`,  id: 'holiday-carry-over',  value: carryOver, set: setCarryOver },
              { label: `Taken (${holidayUnit})`,       id: 'holiday-taken',       value: taken,     set: setTaken },
            ] as const).map(({ label, id, value, set }) => (
              <div key={label}>
                <label htmlFor={id} className="block text-sm font-medium text-ink mb-1">{label}</label>
                <input
                  id={id}
                  type="number"
                  min="0"
                  step="0.5"
                  value={value}
                  onChange={e => set(e.target.value)}
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-[#014D4E] text-white text-sm font-medium px-4 py-2 hover:bg-[#013a3b] disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Saving…' : 'Save allowance'}
            </button>
          </div>
        </form>

        {/* Previous years */}
        {allowances.length > 1 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-sm font-medium text-brand mb-2">Previous leave years</p>
            <div className="space-y-2">
              {allowances.slice(1).map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm text-ink-dim bg-fill rounded-lg px-3 py-2">
                  <span>Year starting {new Date(a.leave_year_start).toLocaleDateString('en-GB')}</span>
                  <span>{(a.total_allowance + a.carry_over - a.taken).toFixed(1)} {holidayUnit} remaining of {a.total_allowance} entitlement</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
