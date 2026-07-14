/**
 * /dashboard/kloes/[kloId] — KLOE detail: current status + edit form + audit trail.
 *
 * Server component: fetches KLOE, current record, and history.
 * KloeForm is the only client component (needs useActionState).
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateRAG } from '@/lib/rag'
import RagBadge from '@/components/RagBadge'
import StatusBadge from '@/components/StatusBadge'
import KloeForm from './kloe-form'

type Props = { params: Promise<{ kloId: string }> }

function formatDate(iso: string | null | undefined, includeTime = false): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  if (!includeTime) return date
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${date} at ${time}`
}

function frequencyLabel(days: number | null): string {
  if (!days) return '—'
  if (days === 30)  return 'Monthly'
  if (days === 60)  return 'Every 2 months'
  if (days === 90)  return 'Quarterly'
  if (days === 180) return 'Every 6 months'
  if (days === 365) return 'Annually'
  return `Every ${days} days`
}

export default async function KloeDetailPage({ params }: Props) {
  const { kloId } = await params
  const supabase = await createClient()

  // ── Fetch KLOE + its key question ─────────────────────────────────────
  const { data: klo } = await supabase
    .from('klo_items')
    .select('*, key_questions(name)')
    .eq('id', kloId)
    .single()

  if (!klo) notFound()

  // ── Fetch this org's compliance record for this KLOE ─────────────────
  const { data: record } = await supabase
    .from('compliance_records')
    .select('*')
    .eq('klo_item_id', kloId)
    .maybeSingle()

  // ── Fetch history (newest first) ──────────────────────────────────────
  const { data: history } = await supabase
    .from('compliance_record_history')
    .select('*')
    .eq('klo_item_id', kloId)
    .order('system_recorded_at', { ascending: false })

  // ── Resolve user emails for history entries ───────────────────────────
  const changedByIds = [...new Set((history ?? []).map(h => h.changed_by))]
  const { data: userRows } = changedByIds.length > 0
    ? await supabase
        .from('users')
        .select('id, email')
        .in('id', changedByIds)
    : { data: [] }

  const emailById = new Map((userRows ?? []).map(u => [u.id, u.email]))

  const rag = calculateRAG(record)
  // The nested join returns key_questions as an object
  const kqName = (klo as unknown as { key_questions: { name: string } | null })
    ?.key_questions?.name ?? '—'

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
        <ol className="flex gap-1">
          <li><Link href="/dashboard" className="hover:text-[#014D4E] underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/dashboard/kloes" className="hover:text-[#014D4E] underline">KLOEs</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[#1a1a1a]" aria-current="page">{klo.title}</li>
        </ol>
      </nav>

      {/* KLOE heading */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-[#00b8a6] uppercase tracking-widest mb-1">
          {kqName}
        </p>
        <h1 className="text-2xl font-bold text-[#014D4E]">{klo.title}</h1>
        {klo.wording && (
          <p className="mt-3 text-sm text-[#1a1a1a] leading-relaxed max-w-2xl">
            {klo.wording}
          </p>
        )}
        {klo.scope && (
          <p className="mt-2 text-xs text-gray-500 max-w-2xl">
            <span className="font-medium">Scope: </span>{klo.scope}
          </p>
        )}
      </div>

      <div className="space-y-6 max-w-2xl">

          {/* Current status card */}
          <section
            className="bg-white rounded-xl border border-gray-200 p-5"
            aria-labelledby="current-status-heading"
          >
            <h2 id="current-status-heading" className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide mb-4">
              Current status
            </h2>

            {record ? (
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-gray-500 mb-1">RAG</dt>
                  <dd><RagBadge status={rag} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Status</dt>
                  <dd><StatusBadge status={record.status} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Priority</dt>
                  <dd>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#014D4E] text-white text-sm font-bold" aria-label={`Priority ${record.priority}`}>
                      {record.priority}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Last reviewed</dt>
                  <dd className="text-[#1a1a1a]">{formatDate(record.date_reviewed)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Next due</dt>
                  <dd className={`font-medium ${rag === 'red' ? 'text-red-600' : 'text-[#1a1a1a]'}`}>
                    {formatDate(record.next_review_due)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Review frequency</dt>
                  <dd className="text-[#1a1a1a]">{frequencyLabel(record.review_frequency_days)}</dd>
                </div>
                {record.evidence_location && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs text-gray-500 mb-1">Evidence location</dt>
                    <dd className="text-[#1a1a1a] break-words">{record.evidence_location}</dd>
                  </div>
                )}
                {record.notes && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs text-gray-500 mb-1">Notes</dt>
                    <dd className="text-[#1a1a1a]">{record.notes}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <div className="flex items-center gap-3">
                <RagBadge status="grey" />
                <p className="text-sm text-gray-500">
                  No review recorded yet. Use the form below to log your first entry.
                </p>
              </div>
            )}
          </section>

          {/* Edit form */}
          <section
            className="bg-white rounded-xl border border-gray-200 p-5"
            aria-labelledby="update-heading"
          >
            <h2 id="update-heading" className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide mb-4">
              {record ? 'Update this KLOE' : 'Log first review'}
            </h2>
            <KloeForm kloItemId={kloId} currentRecord={record ?? null} />
          </section>

          {/* Link to CQC rating characteristics */}
          {(klo.rating_outstanding || klo.rating_good || klo.rating_ri || klo.rating_inadequate) && (
            <div className="text-sm">
              <Link
                href={`/dashboard/kloes/${kloId}/ratings`}
                className="text-[#014D4E] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
              >
                View CQC rating characteristics for this KLOE →
              </Link>
            </div>
          )}

      </div>

      {/* ── Audit trail ──────────────────────────────────────────────────── */}
      <section className="mt-8" aria-labelledby="history-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 id="history-heading" className="text-lg font-bold text-[#014D4E]">
            Audit trail
            {history && history.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({history.length} {history.length === 1 ? 'entry' : 'entries'})
              </span>
            )}
          </h2>
          {history && history.length > 0 && (
            <Link
              href={`/dashboard/kloes/${kloId}/timeline`}
              className="
                inline-flex items-center gap-1.5 text-sm font-medium
                bg-[#014D4E] text-white px-4 py-2 rounded-lg
                hover:bg-[#013838]
                focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
                transition-colors
              "
            >
              View full audit trail →
            </Link>
          )}
        </div>

        {!history || history.length === 0 ? (
          <p className="text-sm text-gray-500">
            No history yet. Your first save will appear here.
          </p>
        ) : (
          <ol className="relative border-l-2 border-gray-200 ml-3 space-y-6">
            {history.map((entry, i) => (
              <li key={entry.id} className="ml-6">
                {/* Timeline dot */}
                <span
                  className="absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white bg-[#014D4E]"
                  aria-hidden="true"
                />
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  {/* Header row */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {entry.status && <StatusBadge status={entry.status as 'not_started' | 'in_progress' | 'completed'} />}
                    {i === 0 && (
                      <span className="text-xs bg-[#014D4E] text-white px-2 py-0.5 rounded-full font-medium">
                        Latest
                      </span>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">
                      Recorded {formatDate(entry.system_recorded_at, true)}
                    </span>
                  </div>

                  {/* Entry details */}
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {entry.date_reviewed && (
                      <div>
                        <dt className="text-gray-500 mb-0.5">Review date</dt>
                        <dd className="font-medium text-[#1a1a1a]">{formatDate(entry.date_reviewed)}</dd>
                      </div>
                    )}
                    {entry.next_review_due && (
                      <div>
                        <dt className="text-gray-500 mb-0.5">Next due</dt>
                        <dd className="font-medium text-[#1a1a1a]">{formatDate(entry.next_review_due)}</dd>
                      </div>
                    )}
                    {entry.priority !== null && (
                      <div>
                        <dt className="text-gray-500 mb-0.5">Priority</dt>
                        <dd className="font-medium text-[#1a1a1a]">{entry.priority}</dd>
                      </div>
                    )}
                    {entry.review_frequency_days !== null && (
                      <div>
                        <dt className="text-gray-500 mb-0.5">Frequency</dt>
                        <dd className="font-medium text-[#1a1a1a]">{frequencyLabel(entry.review_frequency_days)}</dd>
                      </div>
                    )}
                    {entry.evidence_location && (
                      <div className="col-span-2 sm:col-span-3">
                        <dt className="text-gray-500 mb-0.5">Evidence</dt>
                        <dd className="font-medium text-[#1a1a1a] break-words">{entry.evidence_location}</dd>
                      </div>
                    )}
                    {entry.notes && (
                      <div className="col-span-2 sm:col-span-3">
                        <dt className="text-gray-500 mb-0.5">Notes</dt>
                        <dd className="text-[#1a1a1a]">{entry.notes}</dd>
                      </div>
                    )}
                    <div className="col-span-2 sm:col-span-3">
                      <dt className="text-gray-500 mb-0.5">Recorded by</dt>
                      <dd className="text-[#1a1a1a]">
                        {emailById.get(entry.changed_by) ?? entry.changed_by}
                      </dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
