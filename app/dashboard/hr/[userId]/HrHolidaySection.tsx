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

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]'

  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-[#014D4E] mb-4">
        Holiday / Leave Allowance <span className="text-xs font-normal text-gray-500">({holidayUnit})</span>
      </h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
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
              <p className="text-3xl font-bold text-[#014D4E]">
                {remaining % 1 === 0 ? remaining : remaining.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{holidayUnit} remaining</p>
            </div>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-3 rounded-full bg-[#00b8a6] transition-all"
                style={{ width: `${barPct}%` }}
              />
            </div>
          </div>
        )}

        {!hasData && (
          <p className="text-sm text-gray-500 mb-5">
            No leave year configured yet. Set a leave year start date and entitlement below.
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Leave year start */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Leave Year Start Date</label>
            <input
              type="date"
              value={leaveYearStart}
              onChange={e => setLeaveYearStart(e.target.value)}
              className={`${inputCls} sm:w-56`}
            />
          </div>

          {/* Three numeric fields side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { label: `Entitlement (${holidayUnit})`, value: total,     set: setTotal },
              { label: `Carry Over (${holidayUnit})`,  value: carryOver, set: setCarryOver },
              { label: `Taken (${holidayUnit})`,       value: taken,     set: setTaken },
            ] as const).map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">{label}</label>
                <input
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
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-[#014D4E] mb-2">Previous leave years</p>
            <div className="space-y-2">
              {allowances.slice(1).map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
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
