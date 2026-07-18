'use client'

/**
 * HR Settings — admin only.
 * Configure holiday unit (days or hours) and manage training types.
 */

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { saveHolidayUnit, addTrainingType } from '../actions'

type TrainingType = {
  id: string
  name: string
  is_mandatory: boolean
  default_frequency_days: number
}

export default function HrSettingsPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [holidayUnit, setHolidayUnit] = useState<'days' | 'hours'>('days')
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeMandatory, setNewTypeMandatory] = useState(true)
  const [newTypeFrequency, setNewTypeFrequency] = useState(365)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('organisation_id')
        .eq('id', user.id)
        .single()

      if (!profile) return

      const [{ data: org }, { data: types }] = await Promise.all([
        supabase.from('organisations').select('holiday_unit').eq('id', profile.organisation_id).single(),
        supabase.from('hr_training_types').select('*').eq('organisation_id', profile.organisation_id).order('display_order'),
      ])

      if (org) setHolidayUnit(org.holiday_unit as 'days' | 'hours')
      if (types) setTrainingTypes(types)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveUnit() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await saveHolidayUnit(holidayUnit)
      if (result.success) setMessage('Holiday unit saved.')
      else setError(result.error)
    })
  }

  async function handleAddType(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await addTrainingType(newTypeName, newTypeMandatory, newTypeFrequency)
      if (result.success) {
        setMessage(result.message ?? 'Training type added.')
        setNewTypeName('')
        // Refresh list
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('users').select('organisation_id').eq('id', user.id).single()
        if (!profile) return
        const { data: types } = await supabase.from('hr_training_types').select('*').eq('organisation_id', profile.organisation_id).order('display_order')
        if (types) setTrainingTypes(types)
      } else {
        setError(result.error)
      }
    })
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/dashboard/hr')}
          className="text-sm text-gray-500 hover:text-[#014D4E] mb-4 flex items-center gap-1"
        >
          ← Back to HR Records
        </button>
        <h1 className="text-2xl font-bold text-[#014D4E]">HR Settings</h1>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Holiday unit */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-[#014D4E] mb-1">Holiday allowance unit</h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose whether holiday entitlement is measured in days or hours across your organisation.
          This applies to all staff records.
        </p>
        <div className="flex gap-4 mb-4">
          {(['days', 'hours'] as const).map(unit => (
            <label key={unit} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="holiday_unit"
                value={unit}
                checked={holidayUnit === unit}
                onChange={() => setHolidayUnit(unit)}
                className="accent-[#014D4E]"
              />
              <span className="text-sm capitalize text-[#1a1a1a]">{unit}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSaveUnit}
          disabled={isPending}
          className="rounded-lg bg-[#014D4E] text-white text-sm font-medium px-4 py-2 hover:bg-[#013a3b] disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </section>

      {/* Training types */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-[#014D4E] mb-1">Training types</h2>
        <p className="text-sm text-gray-600 mb-4">
          These are the training categories tracked for your staff. The defaults below are
          standard for care homes — add any additional types specific to your organisation.
        </p>

        <div className="divide-y divide-gray-100 mb-6">
          {trainingTypes.map(t => (
            <div key={t.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[#1a1a1a]">{t.name}</span>
                {t.is_mandatory && (
                  <span className="ml-2 text-xs bg-[#014D4E]/10 text-[#014D4E] px-1.5 py-0.5 rounded">
                    Mandatory
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                Every {t.default_frequency_days === 365 ? 'year'
                  : t.default_frequency_days === 1095 ? '3 years'
                  : `${t.default_frequency_days} days`}
              </span>
            </div>
          ))}
        </div>

        {/* Add new type */}
        <form onSubmit={handleAddType} className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-[#014D4E] mb-3">Add training type</h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              placeholder="e.g. Moving and Positioning"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
            />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTypeMandatory}
                  onChange={e => setNewTypeMandatory(e.target.checked)}
                  className="accent-[#014D4E]"
                />
                Mandatory
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Frequency (days):</label>
                <input
                  type="number"
                  min={1}
                  value={newTypeFrequency}
                  onChange={e => setNewTypeFrequency(Number(e.target.value))}
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-[#014D4E] text-white text-sm font-medium px-4 py-2 hover:bg-[#013a3b] disabled:opacity-60 transition-colors"
              >
                {isPending ? 'Adding…' : 'Add training type'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
