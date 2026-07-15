/**
 * /dashboard/my-kloes — Personal KLOE view for user-role staff.
 *
 * Shows only the KLOEs assigned to the current user.
 * Admins are redirected to /dashboard (they see the full view).
 * Viewers are redirected to /dashboard (read-only full view).
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import { calculateRAG } from '@/lib/rag'
import RagBadge from '@/components/RagBadge'
import StatusBadge from '@/components/StatusBadge'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default async function MyKloesPage() {
  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/login')

  // Admins and viewers use the main dashboard / KLOE list
  if (profile.role !== 'user') redirect('/dashboard')

  const supabase = await createClient()

  // Fetch compliance records assigned to this user
  const { data: assignedRecords } = await supabase
    .from('compliance_records')
    .select('*')
    .eq('assigned_to', profile.id)

  // Fetch the corresponding KLOE items
  const kloIds = (assignedRecords ?? []).map(r => r.klo_item_id)
  const { data: kloItems } = kloIds.length > 0
    ? await supabase
        .from('klo_items')
        .select('id, title, key_question_id')
        .in('id', kloIds)
    : { data: [] }

  // Fetch key question names
  const { data: keyQuestions } = await supabase
    .from('key_questions')
    .select('id, name')

  const kqNameById = new Map((keyQuestions ?? []).map(kq => [kq.id, kq.name]))
  const recordByKloId = new Map((assignedRecords ?? []).map(r => [r.klo_item_id, r]))
  const kloById = new Map((kloItems ?? []).map(k => [k.id, k]))

  // Sort: red first, then amber, then green, then grey
  const RAG_SORT: Record<string, number> = { red: 0, amber: 1, green: 2, grey: 3 }
  const sorted = (assignedRecords ?? []).slice().sort((a, b) => {
    const ragA = calculateRAG(a)
    const ragB = calculateRAG(b)
    return (RAG_SORT[ragA] ?? 3) - (RAG_SORT[ragB] ?? 3)
  })

  const displayName = profile.full_name ?? profile.email

  return (
    <div className="max-w-3xl">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#014D4E]">My KLOEs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome, {displayName}. Here are the KLOEs assigned to you.
        </p>
      </div>

      {sorted.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="font-semibold text-[#014D4E] mb-1">Nothing assigned to you yet</h2>
          <p className="text-sm text-gray-500">
            Your admin will assign KLOEs to you. Check back after speaking to your manager.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(record => {
            const klo = kloById.get(record.klo_item_id)
            const rag = calculateRAG(record)
            const kqName = klo ? (kqNameById.get(klo.key_question_id) ?? '—') : '—'

            return (
              <div
                key={record.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start gap-3">
                  {/* RAG dot */}
                  <div className="mt-0.5 shrink-0">
                    <RagBadge status={rag} compact />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#00b8a6] uppercase tracking-wide mb-0.5">
                      {kqName}
                    </p>
                    <Link
                      href={`/dashboard/kloes/${record.klo_item_id}`}
                      className="font-semibold text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
                    >
                      {klo?.title ?? 'KLOE'}
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <StatusBadge status={record.status} />
                      <span>
                        Next due:{' '}
                        <span className={rag === 'red' ? 'text-red-600 font-medium' : ''}>
                          {formatDate(record.next_review_due)}
                        </span>
                      </span>
                      {record.evidence_location && (
                        <span className="truncate max-w-[200px]" title={record.evidence_location}>
                          📁 {record.evidence_location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Update link */}
                  <Link
                    href={`/dashboard/kloes/${record.klo_item_id}`}
                    className="
                      shrink-0 text-xs font-medium text-white bg-[#014D4E]
                      px-3 py-1.5 rounded-lg
                      hover:bg-[#013838]
                      focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1
                      transition-colors
                    "
                  >
                    Update →
                  </Link>
                </div>

                {/* Overdue warning */}
                {rag === 'red' && (
                  <div className="mt-3 ml-7 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    This KLOE is overdue. Please update it as soon as possible.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer link to full KLOE list */}
      {sorted.length > 0 && (
        <div className="mt-6 text-sm text-center">
          <Link
            href="/dashboard/kloes"
            className="text-[#014D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#014D4E] rounded"
          >
            View all KLOEs →
          </Link>
        </div>
      )}
    </div>
  )
}
