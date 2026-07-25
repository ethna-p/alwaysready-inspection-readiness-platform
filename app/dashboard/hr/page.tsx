/**
 * HR Overview — admin only.
 *
 * Shows all staff members with a quick compliance status:
 * - DBS status (overdue / due soon / ok / not set)
 * - Supervision status
 * - Appraisal status
 * - Training: mandatory training complete flag
 *
 * Seeds default training types on first visit if none exist.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'

const DUE_SOON_DAYS = 30

type StatusBadge = 'overdue' | 'due_soon' | 'ok' | 'not_set'

function getDateStatus(nextDue: string | null): StatusBadge {
  if (!nextDue) return 'not_set'
  const now = new Date()
  const due = new Date(nextDue)
  if (due < now) return 'overdue'
  const daysUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (daysUntil <= DUE_SOON_DAYS) return 'due_soon'
  return 'ok'
}

// ── HR RAG summary card ────────────────────────────────────────────────────

type SummaryCardProps = {
  label: string
  total: number
  okCount: number
  dueSoonCount?: number
  overdueCount?: number
  notSetCount: number
}

function HrSummaryCard({
  label, total, okCount, dueSoonCount = 0, overdueCount = 0, notSetCount,
}: SummaryCardProps) {
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))

  const okPct      = pct(okCount)
  const dueSoonPct = pct(dueSoonCount)
  const overduePct = pct(overdueCount)

  const hasOverdue = overdueCount > 0
  const hasDueSoon = dueSoonCount > 0

  const accentClass = hasOverdue  ? 'border-red-300   bg-red-50'
                    : hasDueSoon  ? 'border-amber-300 bg-amber-50'
                    : okCount > 0 ? 'border-green-300 bg-green-50'
                    :               'border-gray-200  bg-gray-50'

  const headlineColour = hasOverdue  ? 'text-red-700'
                       : hasDueSoon  ? 'text-amber-700'
                       : okCount > 0 ? 'text-green-700'
                       :               'text-gray-500'

  // Headline shows the most urgent stat, not always "% current"
  const headlinePct   = hasOverdue ? overduePct : hasDueSoon ? dueSoonPct : okPct
  const headlineLabel = hasOverdue ? 'overdue'  : hasDueSoon ? 'due soon'  : 'current'

  return (
    <div className={`rounded-xl border p-4 ${accentClass}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold mb-3 ${headlineColour}`}>
        {headlinePct}<span className="text-lg font-medium">%</span>
        <span className="ml-1 text-xs font-normal text-gray-500">{headlineLabel}</span>
      </p>

      {/* Stacked RAG bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-3 bg-gray-200">
        {overdueCount  > 0 && <div className="bg-red-500"   style={{ width: `${overduePct}%`  }} />}
        {dueSoonCount  > 0 && <div className="bg-amber-400" style={{ width: `${dueSoonPct}%`  }} />}
        {okCount       > 0 && <div className="bg-green-500" style={{ width: `${okPct}%`       }} />}
      </div>

      {/* Count legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
            {overdueCount} overdue
          </span>
        )}
        {dueSoonCount > 0 && (
          <span className="flex items-center gap-1 text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
            {dueSoonCount} due soon
          </span>
        )}
        {okCount > 0 && (
          <span className="flex items-center gap-1 text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
            {okCount} current
          </span>
        )}
        {notSetCount > 0 && (
          <span className="flex items-center gap-1 text-gray-500">
            <span className="h-2 w-2 rounded-full bg-gray-300 shrink-0" aria-hidden="true" />
            {notSetCount} not set
          </span>
        )}
      </div>
    </div>
  )
}

// ── Needs-attention section ────────────────────────────────────────────────

type AttentionField = {
  label: string
  status: 'overdue' | 'due_soon'
  dueDate: string | null
}

type AttentionPerson = {
  userId: string
  name: string
  role: string
  fields: AttentionField[]
}

const DATE_FIELDS = [
  { key: 'dbs_next_review_due'   as const, label: 'DBS' },
  { key: 'supervision_next_due'  as const, label: 'Supervision' },
  { key: 'appraisal_next_due'    as const, label: 'Appraisal' },
]

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function AttentionBadge({ label, status, dueDate }: AttentionField) {
  if (status === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
        {label} overdue
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
      {label} due {dueDate ? formatShortDate(dueDate) : 'soon'}
    </span>
  )
}

function AttentionSection({
  title,
  people,
  variant,
}: {
  title: string
  people: AttentionPerson[]
  variant: 'overdue' | 'due_soon'
}) {
  if (people.length === 0) return null

  const headerStyle = variant === 'overdue'
    ? 'border-red-200 bg-red-50'
    : 'border-amber-200 bg-amber-50'
  const iconStyle = variant === 'overdue' ? 'text-red-600' : 'text-amber-600'
  const countStyle = variant === 'overdue' ? 'text-red-700' : 'text-amber-700'

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3 border-b ${headerStyle}`}>
        <span className={`text-sm ${iconStyle}`} aria-hidden="true">
          {variant === 'overdue' ? '●' : '◑'}
        </span>
        <p className="text-sm font-semibold text-[#1a1a1a]">{title}</p>
        <span className={`ml-auto text-xs font-medium ${countStyle}`}>
          {people.length} {people.length === 1 ? 'staff member' : 'staff members'}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {people.map(person => (
          <div key={person.userId} className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1a1a1a]">{person.name}</p>
              <p className="text-xs text-gray-500 capitalize">{person.role}</p>
            </div>
            <div className="ml-4 flex flex-wrap gap-1.5">
              {person.fields.map(f => (
                <AttentionBadge key={f.label} {...f} />
              ))}
            </div>
            <Link
              href={`/dashboard/hr/${person.userId}`}
              className="ml-auto shrink-0 text-sm font-medium text-[#014D4E] hover:underline"
            >
              View →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Per-row status pill ────────────────────────────────────────────────────

function StatusPill({ status, label }: { status: StatusBadge; label: string }) {
  const styles: Record<StatusBadge, string> = {
    overdue:  'bg-red-100 text-red-700',
    due_soon: 'bg-amber-100 text-amber-700',
    ok:       'bg-green-100 text-green-700',
    not_set:  'bg-gray-100 text-gray-500',
  }
  const icons: Record<StatusBadge, string> = {
    overdue:  '●',
    due_soon: '●',
    ok:       '●',
    not_set:  '○',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      <span aria-hidden="true">{icons[status]}</span>
      {label}
    </span>
  )
}

export default async function HrOverviewPage() {
  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const adminClient = createAdminClient()
  const orgId = profile.organisation_id

  // Seed default training types if this org has none yet
  const { count: typeCount } = await supabase
    .from('hr_training_types')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', orgId)

  if ((typeCount ?? 0) === 0) {
    await adminClient.rpc('seed_default_training_types', { p_organisation_id: orgId })
  }

  // Get all staff for this org
  const { data: staffUsers } = await supabase
    .from('users')
    .select('id, full_name, username, role')
    .eq('organisation_id', orgId)
    .neq('role', 'viewer')
    .order('full_name')

  // Get all HR profiles for this org
  const { data: hrProfiles } = await supabase
    .from('hr_staff_profiles')
    .select(`
      user_id,
      job_title,
      employment_status,
      dbs_next_review_due,
      supervision_next_due,
      appraisal_next_due,
      mandatory_training_complete,
      right_to_work_verified,
      references_obtained
    `)
    .eq('organisation_id', orgId)

  const profileMap = new Map(hrProfiles?.map(p => [p.user_id, p]) ?? [])

  // Get org holiday unit setting
  const { data: org } = await supabase
    .from('organisations')
    .select('holiday_unit')
    .eq('id', orgId)
    .single()

  const staffList = staffUsers ?? []
  const total = staffList.length

  // ── Compute per-field RAG summary ─────────────────────────────────────────
  type Counts = Record<StatusBadge, number>

  function countField(field: 'dbs_next_review_due' | 'supervision_next_due' | 'appraisal_next_due'): Counts {
    const c: Counts = { ok: 0, due_soon: 0, overdue: 0, not_set: 0 }
    for (const user of staffList) {
      const hr = profileMap.get(user.id)
      c[hr ? getDateStatus(hr[field]) : 'not_set']++
    }
    return c
  }

  const dbsCounts          = countField('dbs_next_review_due')
  const supervisionCounts  = countField('supervision_next_due')
  const appraisalCounts    = countField('appraisal_next_due')

  const trainingCounts = { ok: 0, not_set: 0 }
  for (const user of staffList) {
    const hr = profileMap.get(user.id)
    if (hr?.mandatory_training_complete) trainingCounts.ok++
    else trainingCounts.not_set++
  }

  // ── Build needs-attention lists ────────────────────────────────────────────
  const overdueList:  AttentionPerson[] = []
  const dueSoonList:  AttentionPerson[] = []

  for (const user of staffList) {
    const hr = profileMap.get(user.id)
    const overdueFields: AttentionField[] = []
    const dueSoonFields: AttentionField[] = []

    for (const { key, label } of DATE_FIELDS) {
      const nextDue = hr?.[key] ?? null
      const status  = getDateStatus(nextDue)
      if (status === 'overdue')  overdueFields.push({ label, status: 'overdue',  dueDate: nextDue })
      if (status === 'due_soon') dueSoonFields.push({ label, status: 'due_soon', dueDate: nextDue })
    }

    const name = user.full_name ?? user.username ?? 'Unknown'
    if (overdueFields.length > 0) {
      overdueList.push({ userId: user.id, name, role: user.role ?? '', fields: overdueFields })
    } else if (dueSoonFields.length > 0) {
      dueSoonList.push({ userId: user.id, name, role: user.role ?? '', fields: dueSoonFields })
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#014D4E]">HR Records</h1>
          <p className="text-sm text-gray-600 mt-1">
            Staff employment, training, and compliance records.
          </p>
        </div>
        <Link
          href="/dashboard/hr/settings"
          className="text-sm text-[#014D4E] hover:underline"
        >
          HR Settings
        </Link>
      </div>

      {/* Holiday unit notice */}
      <div className="mb-6 bg-[#e6f7f5] border border-[#00b8a6]/30 rounded-xl px-5 py-4 flex items-center justify-between">
        <p className="text-sm text-[#014D4E]">
          Holiday allowances are tracked in <strong>{org?.holiday_unit ?? 'days'}</strong>.
        </p>
        <Link href="/dashboard/hr/settings" className="text-xs text-[#014D4E] hover:underline">
          Change →
        </Link>
      </div>

      {/* ── RAG summary dashboard ─────────────────────────────────────────── */}
      {total > 0 && (
        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HrSummaryCard
            label="DBS"
            total={total}
            okCount={dbsCounts.ok}
            dueSoonCount={dbsCounts.due_soon}
            overdueCount={dbsCounts.overdue}
            notSetCount={dbsCounts.not_set}
          />
          <HrSummaryCard
            label="Supervision"
            total={total}
            okCount={supervisionCounts.ok}
            dueSoonCount={supervisionCounts.due_soon}
            overdueCount={supervisionCounts.overdue}
            notSetCount={supervisionCounts.not_set}
          />
          <HrSummaryCard
            label="Appraisal"
            total={total}
            okCount={appraisalCounts.ok}
            dueSoonCount={appraisalCounts.due_soon}
            overdueCount={appraisalCounts.overdue}
            notSetCount={appraisalCounts.not_set}
          />
          <HrSummaryCard
            label="Mandatory Training"
            total={total}
            okCount={trainingCounts.ok}
            notSetCount={trainingCounts.not_set}
          />
        </div>
      )}

      {/* ── Needs attention ───────────────────────────────────────────────── */}
      {(overdueList.length > 0 || dueSoonList.length > 0) && (
        <div className="mb-6 space-y-3">
          <AttentionSection
            title="Overdue"
            people={overdueList}
            variant="overdue"
          />
          <AttentionSection
            title="Due within 30 days"
            people={dueSoonList}
            variant="due_soon"
          />
        </div>
      )}

      {/* Staff table */}
      {staffList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">No staff members found. Add staff via the Team page first.</p>
          <Link href="/dashboard/admin/team" className="mt-3 inline-block text-sm text-[#014D4E] hover:underline">
            Go to Team →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-[#014D4E]">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-[#014D4E]">Job Title</th>
                <th className="text-left px-5 py-3 font-semibold text-[#014D4E]">DBS</th>
                <th className="text-left px-5 py-3 font-semibold text-[#014D4E]">Supervision</th>
                <th className="text-left px-5 py-3 font-semibold text-[#014D4E]">Appraisal</th>
                <th className="text-left px-5 py-3 font-semibold text-[#014D4E]">Training</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffList.map(user => {
                const hr = profileMap.get(user.id)
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#1a1a1a]">{user.full_name ?? user.username}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {hr?.job_title ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {hr
                        ? <StatusPill status={getDateStatus(hr.dbs_next_review_due)} label={
                            getDateStatus(hr.dbs_next_review_due) === 'overdue' ? 'Overdue'
                            : getDateStatus(hr.dbs_next_review_due) === 'due_soon' ? 'Due soon'
                            : getDateStatus(hr.dbs_next_review_due) === 'ok' ? 'Current'
                            : 'Not set'
                          } />
                        : <span className="text-xs text-gray-400">No record</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      {hr
                        ? <StatusPill status={getDateStatus(hr.supervision_next_due)} label={
                            getDateStatus(hr.supervision_next_due) === 'overdue' ? 'Overdue'
                            : getDateStatus(hr.supervision_next_due) === 'due_soon' ? 'Due soon'
                            : getDateStatus(hr.supervision_next_due) === 'ok' ? 'Current'
                            : 'Not set'
                          } />
                        : <span className="text-xs text-gray-400">No record</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      {hr
                        ? <StatusPill status={getDateStatus(hr.appraisal_next_due)} label={
                            getDateStatus(hr.appraisal_next_due) === 'overdue' ? 'Overdue'
                            : getDateStatus(hr.appraisal_next_due) === 'due_soon' ? 'Due soon'
                            : getDateStatus(hr.appraisal_next_due) === 'ok' ? 'Current'
                            : 'Not set'
                          } />
                        : <span className="text-xs text-gray-400">No record</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      {hr?.mandatory_training_complete
                        ? <StatusPill status="ok" label="Complete" />
                        : <StatusPill status="not_set" label="Incomplete" />
                      }
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/hr/${user.id}`}
                        className="text-sm font-medium text-[#014D4E] hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
