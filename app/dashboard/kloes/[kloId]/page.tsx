/**
 * /dashboard/kloes/[kloId] — KLOE detail: current status + edit form + audit trail.
 *
 * Server component: fetches KLOE, current record, history, and user profile.
 * Role-based rendering:
 *   admin  → sees all fields, assignment panel, full edit form
 *   user   → sees edit form with status/date/evidence/notes only (RLS enforces assignment)
 *   viewer → read-only; edit form hidden
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import { calculateRAG } from '@/lib/rag'
import RagBadge from '@/components/RagBadge'
import StatusBadge from '@/components/StatusBadge'
import KloeForm from './kloe-form'
import AssignForm from './assign-form'
import ChecklistPanel from './checklist-panel'
import type { ItemWithCompletion } from './checklist-panel'
import EvidencePanel from './EvidencePanel'
import type { EvidenceFile } from './EvidencePanel'

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

  // ── User profile + role ───────────────────────────────────────────────
  const profile = await getCurrentUserProfile()
  if (!profile) notFound() // middleware should have redirected; defensive fallback
  const isAdmin  = profile.role === 'admin'
  const isViewer = profile.role === 'viewer'

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

  // ── Resolve display names for history entries ─────────────────────────
  const changedByIds = [...new Set((history ?? []).map(h => h.changed_by))]
  const { data: userRows } = changedByIds.length > 0
    ? await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', changedByIds)
    : { data: [] }

  const nameById = new Map(
    (userRows ?? []).map(u => [u.id, u.full_name ?? u.email])
  )

  // ── Fetch org + service type (for checklist filtering) ─────────────────
  const { data: org } = await supabase
    .from('organisations')
    .select('service_type_id, service_types(name)')
    .eq('id', profile.organisation_id)
    .single()

  const orgServiceTypeName: string =
    (org as unknown as { service_types: { name: string } | null })?.service_types?.name ?? ''
  const isDualReg = orgServiceTypeName === 'Dual-Registered Care Home'

  // ── Fetch this org's enabled sub-services ────────────────────────────────
  const { data: subServiceRows } = await supabase
    .from('organisation_sub_services')
    .select('sub_service')
    .eq('organisation_id', profile.organisation_id)
  const enabledSubServices = (subServiceRows ?? []).map(r => r.sub_service)

  // ── Fetch checklist items for this KLOE + this org's service type ────────
  let checklistItems: ItemWithCompletion[] = []
  if (org?.service_type_id) {
    // Build sub-service filter:
    // Always include Core items (sub_service IS NULL).
    // Also include items for any sub-service the org has opted into.
    const subServiceFilter = enabledSubServices.length > 0
      ? `sub_service.is.null,sub_service.in.(${enabledSubServices.join(',')})`
      : 'sub_service.is.null'

    const { data: ciRows } = await supabase
      .from('klo_checklist_items')
      .select('*')
      .eq('klo_item_id', kloId)
      .or(`service_type_id.eq.${org.service_type_id},service_type_id.is.null`)
      .or(subServiceFilter)
      .order('display_order', { ascending: true })

    if (ciRows && ciRows.length > 0) {
      const ciIds = ciRows.map(ci => ci.id)
      const { data: completions } = await supabase
        .from('klo_checklist_completions')
        .select('id, checklist_item_id, is_complete, evidence_location')
        .in('checklist_item_id', ciIds)

      const completionByItemId = new Map(
        (completions ?? []).map(c => [c.checklist_item_id, c])
      )

      checklistItems = ciRows.map(ci => ({
        ...ci,
        completion: completionByItemId.get(ci.id) ?? null,
      }))
    }
  }

  // ── Fetch evidence files for this KLOE ───────────────────────────────────
  const { data: evidenceRows } = await supabase
    .from('kloe_evidence')
    .select('id, file_name, storage_path, file_size, mime_type, uploaded_at, uploaded_by, scan_status')
    .eq('klo_item_id', kloId)
    .order('uploaded_at', { ascending: false })

  // Resolve uploader display names
  const uploaderIds = [...new Set((evidenceRows ?? []).map(e => e.uploaded_by))]
  const { data: uploaderRows } = uploaderIds.length > 0
    ? await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', uploaderIds)
    : { data: [] }

  const uploaderNameById = new Map(
    (uploaderRows ?? []).map(u => [u.id, u.full_name ?? u.email])
  )

  const evidenceFiles: EvidenceFile[] = (evidenceRows ?? []).map(e => ({
    id: e.id,
    file_name: e.file_name,
    storage_path: e.storage_path,
    file_size: e.file_size,
    mime_type: e.mime_type,
    uploaded_at: e.uploaded_at,
    uploaded_by_name: uploaderNameById.get(e.uploaded_by) ?? null,
    scan_status: e.scan_status ?? 'clean',
  }))

  // ── Fetch all org team members (admins only, for assignment dropdown) ──
  const teamMembers: { id: string; email: string; full_name: string | null; role: string }[] = []
  if (isAdmin) {
    const { data: members } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('organisation_id', profile.organisation_id)
      .in('role', ['admin', 'user'])
      .order('full_name', { ascending: true })
    if (members) teamMembers.push(...members)
  }

  // ── Resolve assigned-to display name ─────────────────────────────────
  const assignedToName = record?.assigned_to
    ? (teamMembers.find(m => m.id === record.assigned_to)?.full_name
        ?? teamMembers.find(m => m.id === record.assigned_to)?.email
        ?? (userRows ?? []).find(u => u.id === record.assigned_to)?.full_name
        ?? (userRows ?? []).find(u => u.id === record.assigned_to)?.email
        ?? null)
    : null

  const rag = calculateRAG(record)
  // The nested join returns key_questions as an object
  const kqName = (klo as unknown as { key_questions: { name: string } | null })
    ?.key_questions?.name ?? '—'

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-2" aria-label="Breadcrumb">
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
        <p className="text-xs font-semibold text-[#014D4E] uppercase tracking-widest mb-1">
          {kqName}
        </p>
        <h1 className="text-2xl font-bold text-[#014D4E]">{klo.title}</h1>
        {klo.wording && (
          <p className="mt-3 text-base text-[#1a1a1a] leading-relaxed">
            {klo.wording}
          </p>
        )}
        {klo.scope && (
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Scope: </span>{klo.scope}
          </p>
        )}
      </div>

      <div className="space-y-6">

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
                <dt className="text-xs text-gray-600 mb-1">RAG</dt>
                <dd><RagBadge status={rag} /></dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600 mb-1">Status</dt>
                <dd><StatusBadge status={record.status} /></dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600 mb-1">Priority</dt>
                <dd>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#014D4E] text-white text-sm font-bold" aria-label={`Priority ${record.priority}`}>
                    {record.priority}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600 mb-1">Last reviewed</dt>
                <dd className="text-[#1a1a1a]">{formatDate(record.date_reviewed)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600 mb-1">Next due</dt>
                <dd className={`font-medium ${rag === 'red' ? 'text-red-600' : 'text-[#1a1a1a]'}`}>
                  {formatDate(record.next_review_due)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600 mb-1">Review frequency</dt>
                <dd className="text-[#1a1a1a]">{frequencyLabel(record.review_frequency_days)}</dd>
              </div>
              {record.assigned_to && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-gray-600 mb-1">Assigned to</dt>
                  <dd className="text-[#1a1a1a]">{assignedToName ?? record.assigned_to}</dd>
                </div>
              )}
              {record.evidence_location && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-gray-600 mb-1">Evidence location</dt>
                  <dd className="text-[#1a1a1a] break-words">{record.evidence_location}</dd>
                </div>
              )}
              {record.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-gray-600 mb-1">Notes</dt>
                  <dd className="text-[#1a1a1a]">{record.notes}</dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="flex items-center gap-3">
              <RagBadge status="grey" />
              <p className="text-sm text-gray-600">
                No review recorded yet.{!isViewer && ' Use the form below to log your first entry.'}
              </p>
            </div>
          )}
        </section>

        {/* Compliance checklist */}
        {checklistItems.length > 0 && (
          <section
            className="bg-white rounded-xl border border-gray-200 p-5"
            aria-labelledby="checklist-heading"
          >
            <h2 id="checklist-heading" className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide mb-1">
              Compliance checklist
            </h2>
            <p className="text-xs text-gray-600 mb-1">
              Tick each item as your team gathers the required evidence. This does not affect the RAG status — that reflects
              how recently this KLOE was formally reviewed, not checklist completion.
            </p>
            <p className="text-xs text-gray-500 mb-4 italic">
              CQC does not publish a prescribed list of evidence types. The evidence suggestions shown here are derived from
              the evidence statements published by CQC and are intended to guide your preparation — they are not CQC requirements.
            </p>
            <ChecklistPanel
              items={checklistItems}
              isViewer={isViewer}
              isDualReg={isDualReg}
              kloItemId={kloId}
            />
          </section>
        )}

        {/* Assignment panel — admins only */}
        {isAdmin && (
          <section
            className="bg-white rounded-xl border border-gray-200 p-5"
            aria-labelledby="assign-heading"
          >
            <h2 id="assign-heading" className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide mb-1">
              Assign this KLOE
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Assign a team member to own this KLOE. They will be able to update status, evidence, and notes.
            </p>
            <AssignForm
              kloItemId={kloId}
              currentAssignedTo={record?.assigned_to ?? null}
              teamMembers={teamMembers}
            />
          </section>
        )}

        {/* Evidence files */}
        <section
          className="bg-white rounded-xl border border-gray-200 p-5"
          aria-labelledby="evidence-heading"
        >
          <h2 id="evidence-heading" className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide mb-1">
            Evidence files
          </h2>
          <p className="text-xs text-gray-600 mb-4">
            Upload supporting documents for this KLOE. All files are private and accessible only to your team.
          </p>
          <EvidencePanel
            kloItemId={kloId}
            organisationId={profile.organisation_id}
            initialFiles={evidenceFiles}
            isAdmin={isAdmin}
            canUpload={!isViewer}
          />
        </section>

        {/* Edit form — hidden for viewers */}
        {!isViewer && (
          <section
            className="bg-white rounded-xl border border-gray-200 p-5"
            aria-labelledby="update-heading"
          >
            <h2 id="update-heading" className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide mb-4">
              {record ? 'Update this KLOE' : 'Log first review'}
            </h2>
            {/* Non-admin users: show a note if this KLOE isn't assigned to them */}
            {!isAdmin && record && !record.assigned_to && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                This KLOE is not yet assigned. An admin needs to assign it to you before you can save changes.
              </p>
            )}
            {!isAdmin && record?.assigned_to && record.assigned_to !== profile.id && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                This KLOE is assigned to another team member. Contact your admin if you need access.
              </p>
            )}
            <KloeForm
              kloItemId={kloId}
              currentRecord={record ?? null}
              isAdmin={isAdmin}
            />
          </section>
        )}

        {/* Viewer notice */}
        {isViewer && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-600">
            You have view-only access. Contact your admin to make changes.
          </div>
        )}

        {/* CQC rating characteristics — prominent card */}
        {(klo.rating_outstanding || klo.rating_good || klo.rating_ri || klo.rating_inadequate) && (
          <Link
            href={`/dashboard/kloes/${kloId}/ratings`}
            className="
              flex items-center justify-between gap-4
              bg-[#014D4E] text-white
              rounded-xl px-5 py-4
              hover:bg-[#013838]
              focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
              transition-colors group
            "
          >
            <div>
              <p className="text-sm font-semibold">CQC Rating Characteristics</p>
              <p className="text-xs text-[#a8d8d5] mt-0.5">
                What Outstanding, Good, Requires Improvement and Inadequate look like for this KLOE
              </p>
            </div>
            <span className="text-xl font-light shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
          </Link>
        )}

      </div>

      {/* ── Audit trail summary ──────────────────────────────────────────── */}
      {(() => {
        const historyCount = (history ?? []).length
        const fileCount    = evidenceFiles.length
        const totalEntries = historyCount + fileCount
        return (
          <section
            className="mt-6 bg-white rounded-xl border border-gray-200 p-5 flex flex-wrap items-center justify-between gap-4"
            aria-labelledby="history-heading"
          >
            <div>
              <h2 id="history-heading" className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide">
                Audit trail
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {totalEntries === 0
                  ? 'No entries yet. Your first save will appear here.'
                  : `${historyCount} compliance ${historyCount === 1 ? 'update' : 'updates'} · ${fileCount} ${fileCount === 1 ? 'file' : 'files'} uploaded`}
              </p>
            </div>
            {totalEntries > 0 && (
              <Link
                href={`/dashboard/kloes/${kloId}/timeline`}
                className="
                  inline-flex items-center gap-1.5 text-sm font-medium
                  bg-[#014D4E] text-white px-4 py-2 rounded-lg
                  hover:bg-[#013838]
                  focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
                  transition-colors shrink-0
                "
              >
                View full audit trail →
              </Link>
            )}
          </section>
        )
      })()}
    </div>
  )
}
