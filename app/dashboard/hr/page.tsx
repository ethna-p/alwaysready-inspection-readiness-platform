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
