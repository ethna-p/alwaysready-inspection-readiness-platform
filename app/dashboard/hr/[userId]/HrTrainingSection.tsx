'use client'

/**
 * HrTrainingSection — training records with per-type date fields and certificate uploads.
 */

import { useState, useTransition, useRef } from 'react'
import { saveTrainingRecord, uploadTrainingCertificate, deleteTrainingCertificate } from '../actions'
import type { HrTrainingType, HrTrainingRecord, HrTrainingCertificate } from '@/lib/types'

type Props = {
  userId: string
  trainingTypes: HrTrainingType[]
  trainingRecords: HrTrainingRecord[]
  certificates: HrTrainingCertificate[]
  certUrls: Record<string, string>
}

const DUE_SOON_DAYS = 30

function getStatus(nextDue: string | null): 'overdue' | 'due_soon' | 'ok' | 'not_set' {
  if (!nextDue) return 'not_set'
  const now = new Date()
  const due = new Date(nextDue)
  if (due < now) return 'overdue'
  const days = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return days <= DUE_SOON_DAYS ? 'due_soon' : 'ok'
}

function statusLabel(s: ReturnType<typeof getStatus>) {
  return { overdue: 'Overdue', due_soon: 'Due soon', ok: 'Current', not_set: 'Not recorded' }[s]
}

function statusColour(s: ReturnType<typeof getStatus>) {
  return {
    overdue:  'text-red-600 bg-red-50',
    due_soon: 'text-amber-600 bg-amber-50',
    ok:       'text-green-700 bg-green-50',
    not_set:  'text-gray-500 bg-gray-50',
  }[s]
}

export default function HrTrainingSection({ userId, trainingTypes, trainingRecords, certificates, certUrls }: Props) {
  const [isPending, startTransition] = useTransition()
  const [expandedType, setExpandedType] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Local editable state per training type
  const [localRecords, setLocalRecords] = useState<Record<string, {
    dateCompleted: string
    frequencyDays: string
    notes: string
  }>>(() => {
    const init: Record<string, { dateCompleted: string; frequencyDays: string; notes: string }> = {}
    for (const type of trainingTypes) {
      const rec = trainingRecords.find(r => r.training_type_id === type.id)
      init[type.id] = {
        dateCompleted: rec?.date_completed ?? '',
        frequencyDays: rec?.frequency_days?.toString() ?? type.default_frequency_days.toString(),
        notes: rec?.notes ?? '',
      }
    }
    return init
  })

  function setField(typeId: string, field: string, value: string) {
    setLocalRecords(prev => ({ ...prev, [typeId]: { ...prev[typeId], [field]: value } }))
  }

  function calcNext(dateStr: string, freqDays: string) {
    if (!dateStr || !freqDays) return ''
    const d = new Date(dateStr)
    d.setDate(d.getDate() + parseInt(freqDays, 10))
    return d.toISOString().split('T')[0]
  }

  async function handleSave(typeId: string) {
    const { dateCompleted, frequencyDays, notes } = localRecords[typeId]
    startTransition(async () => {
      const result = await saveTrainingRecord(
        userId,
        typeId,
        dateCompleted || null,
        parseInt(frequencyDays, 10) || 365,
        notes || null
      )
      if (result.success) {
        setMessages(prev => ({ ...prev, [typeId]: 'Saved.' }))
        setErrors(prev => ({ ...prev, [typeId]: '' }))
      } else {
        setErrors(prev => ({ ...prev, [typeId]: result.error }))
      }
    })
  }

  async function handleUpload(typeId: string) {
    const record = trainingRecords.find(r => r.training_type_id === typeId)
    if (!record) {
      setErrors(prev => ({ ...prev, [typeId]: 'Save a completion date first before uploading a certificate.' }))
      return
    }
    const fileInput = fileInputRefs.current[typeId]
    if (!fileInput?.files?.[0]) return

    const formData = new FormData()
    formData.append('file', fileInput.files[0])
    formData.append('training_record_id', record.id)
    formData.append('user_id', userId)

    startTransition(async () => {
      const result = await uploadTrainingCertificate(formData)
      if (result.success) {
        setMessages(prev => ({ ...prev, [typeId]: 'Certificate uploaded.' }))
        setErrors(prev => ({ ...prev, [typeId]: '' }))
        if (fileInput) fileInput.value = ''
      } else {
        setErrors(prev => ({ ...prev, [typeId]: result.error }))
      }
    })
  }

  async function handleDeleteCert(certId: string, typeId: string) {
    startTransition(async () => {
      const result = await deleteTrainingCertificate(certId, userId)
      if (result.success) setMessages(prev => ({ ...prev, [typeId]: 'Certificate deleted.' }))
      else setErrors(prev => ({ ...prev, [typeId]: result.error }))
    })
  }

  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-[#014D4E] mb-4">Training Records</h2>

      <div className="space-y-3">
        {trainingTypes.map(type => {
          const rec = trainingRecords.find(r => r.training_type_id === type.id)
          const typeCerts = certificates.filter(c => c.training_record_id === rec?.id)
          const status = getStatus(rec?.next_due ?? null)
          const isOpen = expandedType === type.id
          const local = localRecords[type.id]

          return (
            <div key={type.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Row header */}
              <button
                type="button"
                onClick={() => setExpandedType(isOpen ? null : type.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#1a1a1a]">{type.name}</span>
                  {type.is_mandatory && (
                    <span className="text-xs bg-[#014D4E]/10 text-[#014D4E] px-1.5 py-0.5 rounded">
                      Mandatory
                    </span>
                  )}
                  {typeCerts.length > 0 && (
                    <span className="text-xs text-gray-500">
                      📎 {typeCerts.length} cert{typeCerts.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColour(status)}`}>
                    {statusLabel(status)}
                  </span>
                  {rec?.next_due && (
                    <span className="text-xs text-gray-500 hidden sm:block">
                      Due {new Date(rec.next_due).toLocaleDateString('en-GB')}
                    </span>
                  )}
                  <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Expanded panel */}
              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-5">
                  {messages[type.id] && (
                    <div className="mb-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                      {messages[type.id]}
                    </div>
                  )}
                  {errors[type.id] && (
                    <div className="mb-3 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
                      {errors[type.id]}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Date Completed</label>
                      <input
                        type="date"
                        value={local.dateCompleted}
                        onChange={e => setField(type.id, 'dateCompleted', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Frequency</label>
                      <select
                        value={local.frequencyDays}
                        onChange={e => setField(type.id, 'frequencyDays', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
                      >
                        <option value="180">Every 6 Months</option>
                        <option value="365">Annual</option>
                        <option value="730">Every 2 Years</option>
                        <option value="1095">Every 3 Years</option>
                        <option value="1825">Every 5 Years</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Next Due (calculated)</label>
                      <p className="text-sm text-gray-700 pt-2">
                        {calcNext(local.dateCompleted, local.frequencyDays)
                          ? new Date(calcNext(local.dateCompleted, local.frequencyDays)).toLocaleDateString('en-GB')
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Notes</label>
                      <input
                        type="text"
                        value={local.notes}
                        onChange={e => setField(type.id, 'notes', e.target.value)}
                        placeholder="Any notes…"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#014D4E]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-5">
                    <button
                      type="button"
                      onClick={() => handleSave(type.id)}
                      disabled={isPending}
                      className="rounded-lg bg-[#014D4E] text-white text-sm font-medium px-4 py-2 hover:bg-[#013a3b] disabled:opacity-60 transition-colors"
                    >
                      {isPending ? 'Saving…' : 'Save'}
                    </button>
                  </div>

                  {/* Certificates */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-[#014D4E] mb-3">Training certificates</p>

                    {typeCerts.length > 0 ? (
                      <ul className="space-y-2 mb-3">
                        {typeCerts.map(cert => (
                          <li key={cert.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span>📄</span>
                              {certUrls[cert.id] ? (
                                <a
                                  href={certUrls[cert.id]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#014D4E] hover:underline"
                                >
                                  {cert.file_name}
                                </a>
                              ) : (
                                <span className="text-gray-700">{cert.file_name}</span>
                              )}
                              {cert.scan_status === 'clean' && (
                                <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">✓ Scanned</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteCert(cert.id, type.id)}
                              disabled={isPending}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 mb-3">No certificates uploaded yet.</p>
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        ref={el => { fileInputRefs.current[type.id] = el }}
                        className="text-sm text-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpload(type.id)}
                        disabled={isPending}
                        className="rounded-lg border border-[#014D4E] text-[#014D4E] text-sm font-medium px-3 py-1.5 hover:bg-[#014D4E] hover:text-white disabled:opacity-60 transition-colors"
                      >
                        Upload
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PDF, Word, Excel, JPG or PNG — max 10 MB.</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
