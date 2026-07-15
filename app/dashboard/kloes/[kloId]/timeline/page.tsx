/**
 * /dashboard/kloes/[kloId]/timeline — KLOE Audit Trail Timeline (Step 7)
 *
 * Merges all three history tables for a KLOE into one chronological timeline:
 *   • compliance_record_history — every status, evidence, notes update
 *   • review_frequency_history  — every change to review cadence
 *   • priority_history          — every change to priority
 *
 * This is the "trust screen" — the thing that turns "we track everything
 * properly" from a claim into something a prospect can click and verify.
 * It is read-only; no edits happen here.
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/StatusBadge'
import type { ComplianceStatus } from '@/lib/types'

type Props = { params: Promise<{ kloId: string }> }

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function frequencyLabel(days: number | null | undefined): string {
  if (!days) return '—'
  const map: Record<number, string> = {
    30: 'Monthly (30 days)',
    60: 'Every 2 months (60 days)',
    90: 'Quarterly (90 days)',
    180: 'Every 6 months (180 days)',
    365: 'Annually (365 days)',
  }
  return map[days] ?? `Every ${days} days`
}

// ── Unified timeline entry ────────────────────────────────────────────────────

type EntryType = 'review' | 'frequency' | 'priority'

type TimelineEntry =
  | {
      type: 'review'
      id: string
      timestamp: string
      changedByEmail: string
      status: ComplianceStatus | null
      dateReviewed: string | null
      nextReviewDue: string | null
      reviewFrequencyDays: number | null
      evidenceLocation: string | null
      notes: string | null
      // detected diff vs. previous review entry
      prevStatus?: ComplianceStatus | null
      prevDateReviewed?: string | null
      prevEvidenceLocation?: string | null
    }
  | {
      type: 'frequency'
      id: string
      timestamp: string
      changedByEmail: string
      oldFrequencyDays: number | null
      newFrequencyDays: number
    }
  | {
      type: 'priority'
      id: string
      timestamp: string
      changedByEmail: string
      oldPriority: number | null
      newPriority: number
    }

// ── Visual config per entry type ──────────────────────────────────────────────

const TYPE_CONFIG: Record<EntryType, { label: string; badge: string; dot: string }> = {
  review:    { label: 'Compliance review',   badge: 'bg-[#014D4E] text-white',          dot: 'bg-[#014D4E]' },
  frequency: { label: 'Review frequency changed', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
  priority:  { label: 'Priority changed',    badge: 'bg-purple-100 text-purple-800',    dot: 'bg-purple-500' },
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TimelinePage({ params }: Props) {
  const { kloId } = await params
  const supabase = await createClient()

  // ── Fetch KLOE + key question ─────────────────────────────────────────────
  const { data: klo } = await supabase
    .from('klo_items')
    .select('id, title, key_question_id, key_questions(name)')
    .eq('id', kloId)
    .single()

  if (!klo) notFound()

  const kqName = (klo as unknown as { key_questions: { name: string } | null })
    ?.key_questions?.name ?? '—'

  // ── Fetch all three history tables ────────────────────────────────────────
  const [
    { data: reviewHistory },
    { data: freqHistory },
    { data: priorityHistory },
  ] = await Promise.all([
    supabase
      .from('compliance_record_history')
      .select('*')
      .eq('klo_item_id', kloId)
      .order('system_recorded_at', { ascending: false }),

    supabase
      .from('review_frequency_history')
      .select('*')
      .eq('klo_item_id', kloId)
      .order('changed_at', { ascending: false }),

    supabase
      .from('priority_history')
      .select('*')
      .eq('klo_item_id', kloId)
      .order('changed_at', { ascending: false }),
  ])

  // ── Resolve user emails ───────────────────────────────────────────────────
  const allUserIds = new Set([
    ...(reviewHistory ?? []).map(r => r.changed_by),
    ...(freqHistory ?? []).map(r => r.changed_by),
    ...(priorityHistory ?? []).map(r => r.changed_by),
  ])

  const { data: userRows } = allUserIds.size > 0
    ? await supabase.from('users').select('id, email, full_name').in('id', [...allUserIds])
    : { data: [] }

  const emailById = new Map((userRows ?? []).map(u => [u.id, u.full_name ?? u.email]))

  // ── Build unified timeline ────────────────────────────────────────────────
  const entries: TimelineEntry[] = []

  // Review history — newest first in DB, we'll sort everything at end
  const reviewsSorted = [...(reviewHistory ?? [])].sort(
    (a, b) => a.system_recorded_at.localeCompare(b.system_recorded_at)
  )
  reviewsSorted.forEach((r, i) => {
    const prev = i > 0 ? reviewsSorted[i - 1] : null
    entries.push({
      type: 'review',
      id: r.id,
      timestamp: r.system_recorded_at,
      changedByEmail: emailById.get(r.changed_by) ?? r.changed_by,
      status: r.status as ComplianceStatus | null,
      dateReviewed: r.date_reviewed,
      nextReviewDue: r.next_review_due,
      reviewFrequencyDays: r.review_frequency_days,
      evidenceLocation: r.evidence_location,
      notes: r.notes,
      prevStatus: prev?.status as ComplianceStatus | null ?? null,
      prevDateReviewed: prev?.date_reviewed ?? null,
      prevEvidenceLocation: prev?.evidence_location ?? null,
    })
  })

  for (const r of freqHistory ?? []) {
    entries.push({
      type: 'frequency',
      id: r.id,
      timestamp: r.changed_at,
      changedByEmail: emailById.get(r.changed_by) ?? r.changed_by,
      oldFrequencyDays: r.old_frequency_days,
      newFrequencyDays: r.new_frequency_days,
    })
  }

  for (const r of priorityHistory ?? []) {
    entries.push({
      type: 'priority',
      id: r.id,
      timestamp: r.changed_at,
      changedByEmail: emailById.get(r.changed_by) ?? r.changed_by,
      oldPriority: r.old_priority,
      newPriority: r.new_priority,
    })
  }

  // Sort all entries newest first
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const totalEntries = entries.length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1">
          <li><Link href="/dashboard" className="hover:text-[#014D4E] underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/dashboard/kloes" className="hover:text-[#014D4E] underline">KLOEs</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/dashboard/kloes/${kloId}`} className="hover:text-[#014D4E] underline">{klo.title}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[#1a1a1a]" aria-current="page">Audit trail</li>
        </ol>
      </nav>

      {/* Heading */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-[#00b8a6] uppercase tracking-widest mb-1">
          {kqName}
        </p>
        <h1 className="text-2xl font-bold text-[#014D4E]">{klo.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete audit trail — every change, in order, with who made it and when.
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-[#014D4E]">{totalEntries}</span>
          <span className="text-sm text-gray-500">total {totalEntries === 1 ? 'entry' : 'entries'}</span>
        </div>
        {(['review', 'frequency', 'priority'] as const).map(type => {
          const count = entries.filter(e => e.type === type).length
          if (count === 0) return null
          const { label, badge } = TYPE_CONFIG[type]
          return (
            <div key={type} className={`rounded-xl px-4 py-3 text-sm font-medium ${badge} border border-transparent`}>
              {count} {label}{count !== 1 ? (type === 'frequency' ? 's' : type === 'priority' ? ' changes' : 's') : ''}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {totalEntries === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500">No history yet for this KLOE.</p>
          <Link
            href={`/dashboard/kloes/${kloId}`}
            className="inline-block mt-3 text-sm font-medium text-[#014D4E] underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
          >
            Log the first review →
          </Link>
        </div>
      )}

      {/* Timeline */}
      {totalEntries > 0 && (
        <ol className="relative border-l-2 border-gray-200 ml-3 space-y-0" aria-label="Audit trail timeline">
          {entries.map((entry, i) => {
            const { label, badge, dot } = TYPE_CONFIG[entry.type]
            const isFirst = i === 0

            return (
              <li key={entry.id} className="ml-6 pb-8 last:pb-0">
                {/* Timeline dot */}
                <span
                  className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white ${dot}`}
                  aria-hidden="true"
                />

                <div className={`bg-white rounded-xl border p-5 ${isFirst ? 'border-[#014D4E] shadow-sm' : 'border-gray-200'}`}>

                  {/* Entry header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge}`}>
                        {label}
                      </span>
                      {isFirst && (
                        <span className="text-xs font-medium bg-[#014D4E] text-white px-2 py-0.5 rounded-full">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-[#1a1a1a]">
                        {formatDateTime(entry.timestamp)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        by {entry.changedByEmail}
                      </p>
                    </div>
                  </div>

                  {/* Entry body — varies by type */}
                  {entry.type === 'review' && (
                    <ReviewEntryBody entry={entry} />
                  )}

                  {entry.type === 'frequency' && (
                    <FrequencyEntryBody entry={entry} />
                  )}

                  {entry.type === 'priority' && (
                    <PriorityEntryBody entry={entry} />
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {/* Back link */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <Link
          href={`/dashboard/kloes/${kloId}`}
          className="text-sm font-medium text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
        >
          ← Back to {klo.title}
        </Link>
      </div>
    </div>
  )
}

// ── Entry body sub-components ─────────────────────────────────────────────────

function ReviewEntryBody({ entry }: {
  entry: Extract<TimelineEntry, { type: 'review' }>
}) {
  const statusChanged = entry.prevStatus !== undefined && entry.status !== entry.prevStatus
  const dateChanged   = entry.prevDateReviewed !== undefined && entry.dateReviewed !== entry.prevDateReviewed
  const evidenceChanged = entry.prevEvidenceLocation !== undefined && entry.evidenceLocation !== entry.prevEvidenceLocation

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">

      {/* Status — highlight if changed */}
      <div>
        <dt className="text-xs text-gray-500 mb-1 flex items-center gap-1">
          Status
          {statusChanged && <ChangedPill />}
        </dt>
        <dd>
          {entry.status
            ? <StatusBadge status={entry.status} />
            : <span className="text-gray-400">—</span>}
          {statusChanged && entry.prevStatus && (
            <p className="text-xs text-gray-400 mt-0.5">
              was: <StatusBadge status={entry.prevStatus} />
            </p>
          )}
        </dd>
      </div>

      {/* Date reviewed */}
      <div>
        <dt className="text-xs text-gray-500 mb-1 flex items-center gap-1">
          Date of review
          {dateChanged && <ChangedPill />}
        </dt>
        <dd className="font-medium text-[#1a1a1a]">
          {formatDate(entry.dateReviewed)}
        </dd>
      </div>

      {/* Next review due */}
      {entry.nextReviewDue && (
        <div>
          <dt className="text-xs text-gray-500 mb-1">Next review due</dt>
          <dd className="font-medium text-[#1a1a1a]">{formatDate(entry.nextReviewDue)}</dd>
        </div>
      )}

      {/* Review frequency */}
      {entry.reviewFrequencyDays && (
        <div>
          <dt className="text-xs text-gray-500 mb-1">Review frequency</dt>
          <dd className="text-[#1a1a1a]">{frequencyLabel(entry.reviewFrequencyDays)}</dd>
        </div>
      )}

      {/* Evidence location */}
      {(entry.evidenceLocation || evidenceChanged) && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            Evidence location
            {evidenceChanged && <ChangedPill />}
          </dt>
          <dd className="text-[#1a1a1a] break-words">
            {entry.evidenceLocation ?? <span className="text-gray-400 italic">Cleared</span>}
          </dd>
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-gray-500 mb-1">Notes</dt>
          <dd className="text-[#1a1a1a]">{entry.notes}</dd>
        </div>
      )}
    </dl>
  )
}

function FrequencyEntryBody({ entry }: {
  entry: Extract<TimelineEntry, { type: 'frequency' }>
}) {
  return (
    <div className="flex items-center gap-3 text-sm flex-wrap">
      {entry.oldFrequencyDays !== null ? (
        <>
          <span className="text-gray-500 line-through">{frequencyLabel(entry.oldFrequencyDays)}</span>
          <span className="text-gray-400" aria-hidden="true">→</span>
        </>
      ) : (
        <span className="text-xs text-gray-400 italic mr-1">First set:</span>
      )}
      <span className="font-semibold text-[#014D4E]">{frequencyLabel(entry.newFrequencyDays)}</span>
    </div>
  )
}

function PriorityEntryBody({ entry }: {
  entry: Extract<TimelineEntry, { type: 'priority' }>
}) {
  return (
    <div className="flex items-center gap-3 text-sm flex-wrap">
      {entry.oldPriority !== null ? (
        <>
          <PriorityDot value={entry.oldPriority} muted />
          <span className="text-gray-400" aria-hidden="true">→</span>
        </>
      ) : (
        <span className="text-xs text-gray-400 italic mr-1">First set:</span>
      )}
      <PriorityDot value={entry.newPriority} />
      <span className="text-xs text-gray-500">
        {entry.newPriority === 1 ? '(Critical — most serious if non-compliant)'
          : entry.newPriority === 2 ? '(High)'
          : entry.newPriority === 3 ? '(Medium)'
          : entry.newPriority === 4 ? '(Low)'
          : '(Minimal)'}
      </span>
    </div>
  )
}

function PriorityDot({ value, muted = false }: { value: number; muted?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
        muted
          ? 'bg-gray-200 text-gray-500 line-through'
          : 'bg-[#014D4E] text-white'
      }`}
      aria-label={`Priority ${value}`}
    >
      {value}
    </span>
  )
}

function ChangedPill() {
  return (
    <span className="inline-block text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full leading-none">
      changed
    </span>
  )
}
