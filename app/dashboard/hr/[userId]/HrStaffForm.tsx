'use client'

/**
 * HrStaffForm — all profile sections in one form.
 * Sections: Employment | Personal | Emergency Contact | Compliance | Supervision | Appraisal
 */

import { useState, useTransition } from 'react'
import { saveStaffProfile } from '../actions'
import type { HrStaffProfile } from '@/lib/types'

type Props = {
  userId: string
  hrProfile: HrStaffProfile | null
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-[#014D4E]">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1a1a1a] mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputClass = `
  w-full rounded-lg border border-gray-300 px-3 py-2
  text-sm text-[#1a1a1a] bg-white
  focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
`

const selectClass = `
  w-full rounded-lg border border-gray-300 px-3 py-2
  text-sm text-[#1a1a1a] bg-white
  focus:outline-none focus:ring-2 focus:ring-[#014D4E]
`

export default function HrStaffForm({ userId, hrProfile }: Props) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const p = hrProfile

  // Employment
  const [niNumber, setNiNumber]               = useState(p?.ni_number ?? '')
  const [jobTitle, setJobTitle]               = useState(p?.job_title ?? '')
  const [department, setDepartment]           = useState(p?.department ?? '')
  const [employeeType, setEmployeeType]       = useState(p?.employee_type ?? '')
  const [contractedHours, setContractedHours] = useState(p?.contracted_hours?.toString() ?? '')
  const [employmentStart, setEmploymentStart] = useState(p?.employment_start ?? '')
  const [leavingDate, setLeavingDate]         = useState(p?.leaving_date ?? '')
  const [employmentStatus, setEmploymentStatus] = useState<'active' | 'inactive' | 'on_leave'>(p?.employment_status ?? 'active')

  // Personal
  const [dob, setDob]                   = useState(p?.date_of_birth ?? '')
  const [gender, setGender]             = useState(p?.gender ?? '')
  const [ethnicOrigin, setEthnicOrigin] = useState(p?.ethnic_origin ?? '')
  const [disability, setDisability]     = useState<boolean | null>(p?.disability ?? null)
  const [maritalStatus, setMaritalStatus] = useState(p?.marital_status ?? '')

  // Emergency contact
  const [nokName, setNokName]   = useState(p?.next_of_kin_name ?? '')
  const [nokPhone, setNokPhone] = useState(p?.next_of_kin_phone ?? '')

  // DBS
  const [dbsDate, setDbsDate]         = useState(p?.dbs_review_date ?? '')
  const [dbsNextDue, setDbsNextDue]   = useState(p?.dbs_next_review_due ?? '')
  const [dbsFreq, setDbsFreq]         = useState(p?.dbs_frequency_days?.toString() ?? '365')
  const [rightToWork, setRightToWork] = useState(p?.right_to_work_verified ?? false)
  const [references, setReferences]   = useState(p?.references_obtained ?? false)

  // Supervision
  const [supDate, setSupDate]     = useState(p?.supervision_review_date ?? '')
  const [supNext, setSupNext]     = useState(p?.supervision_next_due ?? '')
  const [supFreq, setSupFreq]     = useState(p?.supervision_frequency_days?.toString() ?? '90')

  // Appraisal
  const [appDate, setAppDate]     = useState(p?.appraisal_review_date ?? '')
  const [appNext, setAppNext]     = useState(p?.appraisal_next_due ?? '')
  const [appFreq, setAppFreq]     = useState(p?.appraisal_frequency_days?.toString() ?? '365')
  const [appNotes, setAppNotes]   = useState(p?.appraisal_notes ?? '')

  // Training summary
  const [mandatoryComplete, setMandatoryComplete] = useState(p?.mandatory_training_complete ?? false)

  // Auto-calculate next due from date + frequency
  function calcNext(dateStr: string, freqDays: string): string {
    if (!dateStr || !freqDays) return ''
    const d = new Date(dateStr)
    d.setDate(d.getDate() + parseInt(freqDays, 10))
    return d.toISOString().split('T')[0]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    startTransition(async () => {
      const result = await saveStaffProfile(userId, {
        ni_number: niNumber || null,
        job_title: jobTitle || null,
        department: department || null,
        employee_type: employeeType || null,
        contracted_hours: contractedHours ? parseFloat(contractedHours) : null,
        employment_start: employmentStart || null,
        leaving_date: leavingDate || null,
        employment_status: employmentStatus,
        date_of_birth: dob || null,
        gender: gender || null,
        ethnic_origin: ethnicOrigin || null,
        disability: disability,
        marital_status: maritalStatus || null,
        next_of_kin_name: nokName || null,
        next_of_kin_phone: nokPhone || null,
        dbs_review_date: dbsDate || null,
        dbs_next_review_due: dbsNextDue || null,
        dbs_frequency_days: dbsFreq ? parseInt(dbsFreq, 10) : null,
        right_to_work_verified: rightToWork,
        references_obtained: references,
        supervision_review_date: supDate || null,
        supervision_next_due: supNext || null,
        supervision_frequency_days: supFreq ? parseInt(supFreq, 10) : null,
        appraisal_review_date: appDate || null,
        appraisal_next_due: appNext || null,
        appraisal_frequency_days: appFreq ? parseInt(appFreq, 10) : null,
        appraisal_notes: appNotes || null,
        mandatory_training_complete: mandatoryComplete,
      })

      if (result.success) setMessage(result.message ?? 'Saved.')
      else setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mb-8">

      {message && (
        <div role="status" className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Save — top */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#014D4E] text-white text-sm font-semibold px-6 py-2.5 hover:bg-[#013a3b] disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]"
        >
          {isPending ? 'Saving…' : 'Save staff record'}
        </button>
      </div>

      {/* ── Employment ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeading title="Employment" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="NI Number">
            <input className={inputClass} value={niNumber} onChange={e => setNiNumber(e.target.value)} placeholder="e.g. AB123456C" />
          </Field>
          <Field label="Job Title">
            <input className={inputClass} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Support Worker" />
          </Field>
          <Field label="Department">
            <input className={inputClass} value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Residential" />
          </Field>
          <Field label="Employee Type">
            <select className={selectClass} value={employeeType} onChange={e => setEmployeeType(e.target.value)}>
              <option value="">— Select —</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="zero_hours">Zero Hours</option>
              <option value="bank">Bank</option>
              <option value="agency">Agency</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </Field>
          <Field label="Contracted Hours">
            <input className={inputClass} type="number" step="0.5" min="0" value={contractedHours} onChange={e => setContractedHours(e.target.value)} placeholder="e.g. 37.5" />
          </Field>
          <Field label="Status">
            <select className={selectClass} value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value as 'active' | 'inactive' | 'on_leave')}>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive / Left</option>
            </select>
          </Field>
          <Field label="Employment Start Date">
            <input className={inputClass} type="date" value={employmentStart} onChange={e => setEmploymentStart(e.target.value)} />
          </Field>
          <Field label="Leaving Date">
            <input className={inputClass} type="date" value={leavingDate} onChange={e => setLeavingDate(e.target.value)} />
          </Field>
        </div>
      </section>

      {/* ── Personal ───────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeading
          title="Personal Information"
          subtitle="Held for equality monitoring under the Equality Act 2010. Access is restricted to admin users only."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Date of Birth">
            <input className={inputClass} type="date" value={dob} onChange={e => setDob(e.target.value)} />
          </Field>
          <Field label="Gender">
            <input className={inputClass} value={gender} onChange={e => setGender(e.target.value)} placeholder="e.g. Female, Male, Non-binary" />
          </Field>
          <Field label="Ethnic Origin">
            <select className={selectClass} value={ethnicOrigin} onChange={e => setEthnicOrigin(e.target.value)}>
              <option value="">— Select —</option>
              <optgroup label="White">
                <option value="White British">White British</option>
                <option value="White Irish">White Irish</option>
                <option value="White Other">White Other</option>
              </optgroup>
              <optgroup label="Mixed / Multiple">
                <option value="Mixed White and Black Caribbean">Mixed White and Black Caribbean</option>
                <option value="Mixed White and Black African">Mixed White and Black African</option>
                <option value="Mixed White and Asian">Mixed White and Asian</option>
                <option value="Mixed Other">Mixed Other</option>
              </optgroup>
              <optgroup label="Asian / Asian British">
                <option value="Asian Indian">Asian Indian</option>
                <option value="Asian Pakistani">Asian Pakistani</option>
                <option value="Asian Bangladeshi">Asian Bangladeshi</option>
                <option value="Asian Chinese">Asian Chinese</option>
                <option value="Asian Other">Asian Other</option>
              </optgroup>
              <optgroup label="Black / African / Caribbean">
                <option value="Black African">Black African</option>
                <option value="Black Caribbean">Black Caribbean</option>
                <option value="Black Other">Black Other</option>
              </optgroup>
              <optgroup label="Other">
                <option value="Arab">Arab</option>
                <option value="Any Other Ethnic Group">Any Other Ethnic Group</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </optgroup>
            </select>
          </Field>
          <Field label="Marital Status">
            <select className={selectClass} value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)}>
              <option value="">— Select —</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Civil Partnership">Civil Partnership</option>
              <option value="Separated">Separated</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </Field>
          <Field label="Disability">
            <select
              className={selectClass}
              value={disability === null ? '' : disability ? 'yes' : 'no'}
              onChange={e => setDisability(e.target.value === '' ? null : e.target.value === 'yes')}
            >
              <option value="">— Select —</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="">Prefer not to say</option>
            </select>
          </Field>
        </div>
      </section>

      {/* ── Emergency Contact ──────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeading title="Emergency Contact" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Next of Kin Name">
            <input className={inputClass} value={nokName} onChange={e => setNokName(e.target.value)} placeholder="Full name" />
          </Field>
          <Field label="Emergency Contact Number">
            <input className={inputClass} type="tel" value={nokPhone} onChange={e => setNokPhone(e.target.value)} placeholder="e.g. 07700 900000" />
          </Field>
        </div>
      </section>

      {/* ── Compliance ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeading title="Compliance" subtitle="DBS, right to work, and references" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Field label="DBS Check Date">
            <input
              className={inputClass}
              type="date"
              value={dbsDate}
              onChange={e => {
                setDbsDate(e.target.value)
                setDbsNextDue(calcNext(e.target.value, dbsFreq))
              }}
            />
          </Field>
          <Field label="DBS Frequency">
            <select
              className={selectClass}
              value={dbsFreq}
              onChange={e => {
                setDbsFreq(e.target.value)
                setDbsNextDue(calcNext(dbsDate, e.target.value))
              }}
            >
              <option value="365">Annual</option>
              <option value="1095">Every 3 Years</option>
              <option value="1825">Every 5 Years</option>
            </select>
          </Field>
          <Field label="DBS Next Review Due">
            <input className={inputClass} type="date" value={dbsNextDue} onChange={e => setDbsNextDue(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rightToWork}
              onChange={e => setRightToWork(e.target.checked)}
              className="w-4 h-4 accent-[#014D4E]"
            />
            <span className="text-sm text-[#1a1a1a]">Right to Work verified</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={references}
              onChange={e => setReferences(e.target.checked)}
              className="w-4 h-4 accent-[#014D4E]"
            />
            <span className="text-sm text-[#1a1a1a]">References obtained</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mandatoryComplete}
              onChange={e => setMandatoryComplete(e.target.checked)}
              className="w-4 h-4 accent-[#014D4E]"
            />
            <span className="text-sm text-[#1a1a1a]">Mandatory training complete</span>
          </label>
        </div>
      </section>

      {/* ── Supervision ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeading title="Supervision" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Last Supervision Date">
            <input
              className={inputClass}
              type="date"
              value={supDate}
              onChange={e => {
                setSupDate(e.target.value)
                setSupNext(calcNext(e.target.value, supFreq))
              }}
            />
          </Field>
          <Field label="Frequency">
            <select
              className={selectClass}
              value={supFreq}
              onChange={e => {
                setSupFreq(e.target.value)
                setSupNext(calcNext(supDate, e.target.value))
              }}
            >
              <option value="30">Monthly</option>
              <option value="60">Every 2 Months</option>
              <option value="90">Quarterly</option>
              <option value="180">Every 6 Months</option>
              <option value="365">Annual</option>
            </select>
          </Field>
          <Field label="Next Supervision Due">
            <input className={inputClass} type="date" value={supNext} onChange={e => setSupNext(e.target.value)} />
          </Field>
        </div>
      </section>

      {/* ── Appraisal ──────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeading title="Appraisal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Field label="Last Appraisal Date">
            <input
              className={inputClass}
              type="date"
              value={appDate}
              onChange={e => {
                setAppDate(e.target.value)
                setAppNext(calcNext(e.target.value, appFreq))
              }}
            />
          </Field>
          <Field label="Frequency">
            <select
              className={selectClass}
              value={appFreq}
              onChange={e => {
                setAppFreq(e.target.value)
                setAppNext(calcNext(appDate, e.target.value))
              }}
            >
              <option value="180">Every 6 Months</option>
              <option value="365">Annual</option>
            </select>
          </Field>
          <Field label="Next Appraisal Due">
            <input className={inputClass} type="date" value={appNext} onChange={e => setAppNext(e.target.value)} />
          </Field>
        </div>
        <Field label="Appraisal Notes">
          <textarea
            className={inputClass}
            rows={3}
            value={appNotes}
            onChange={e => setAppNotes(e.target.value)}
            placeholder="Any notes from the last appraisal…"
          />
        </Field>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#014D4E] text-white text-sm font-semibold px-6 py-2.5 hover:bg-[#013a3b] disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]"
        >
          {isPending ? 'Saving…' : 'Save staff record'}
        </button>
      </div>
    </form>
  )
}
