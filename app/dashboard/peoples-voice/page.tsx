/**
 * /dashboard/peoples-voice
 *
 * Displays the 19 authentic TLAP "I" statements published by CQC as part
 * of the draft 2026 assessment framework. Staff record evidence against
 * each statement, rate evidence quality, set review dates, and manage
 * action plans for gaps.
 *
 * CQC gathers this evidence directly from people using services, their
 * families, and carers during inspections. This module helps teams
 * understand what inspectors will ask and prepare accordingly.
 *
 * Source: CQC draft assessment framework v9 (2026), TLAP "I" statements.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import { calculateRAG } from '@/lib/rag'
import PeoplesVoiceClient, { type StatementWithEvidence, type EvidenceHistoryEntry } from './PeoplesVoiceClient'
import type { IStatementEvidenceFileItem } from './IStatementEvidencePanel'
import HelpWidget from '@/components/HelpWidget'
import type { TeamMember } from './IStatementActionPanel'

export const metadata = { title: "People's Voice | AlwaysReady" }

export default async function PeoplesVoicePage() {
  const supabase = await createClient()
  const profile  = await getCurrentUserProfile()
  const isViewer = profile?.role === 'viewer'
  const isAdmin  = profile?.role === 'admin'

  // ── Fetch all 19 statements ───────────────────────────────────────────────
  const { data: statements, error: stmtError } = await supabase
    .from('i_statements')
    .select('*')
    .order('statement_order', { ascending: true })

  if (stmtError || !statements) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700">
        <strong>Error loading statements:</strong> {stmtError?.message ?? 'Unknown error'}
      </div>
    )
  }

  // ── Fetch this org's evidence (RLS scopes to org automatically) ───────────
  const { data: evidenceRows } = await supabase
    .from('i_statement_evidence')
    .select('*')

  const evidenceMap = new Map(
    (evidenceRows ?? []).map(e => [e.i_statement_id, e])
  )

  // ── Fetch evidence history ────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: historyRows } = await (supabase as any)
    .from('i_statement_evidence_history')
    .select('i_statement_id, confidence, evidence_summary, action_needed, recorded_by, recorded_at')
    .order('recorded_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedHistory = historyRows ?? []
  const recorderIds = [...new Set(typedHistory.map((h: any) => h.recorded_by).filter(Boolean))] as string[]
  const recorderMap = new Map<string, string>()
  if (recorderIds.length > 0) {
    const { data: recorders } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', recorderIds)
    for (const u of recorders ?? []) {
      recorderMap.set(u.id, u.full_name ?? u.email ?? 'Unknown')
    }
  }

  const historyByStatement = new Map<string, EvidenceHistoryEntry[]>()
  for (const h of typedHistory) {
    if (!historyByStatement.has(h.i_statement_id)) {
      historyByStatement.set(h.i_statement_id, [])
    }
    historyByStatement.get(h.i_statement_id)!.push({
      confidence:       h.confidence,
      evidence_summary: h.evidence_summary,
      action_needed:    h.action_needed,
      recorded_by_name: h.recorded_by ? (recorderMap.get(h.recorded_by) ?? null) : null,
      recorded_at:      h.recorded_at,
    })
  }

  // ── Fetch action items ────────────────────────────────────────────────────
  const { data: actionRows } = await supabase
    .from('i_statement_actions')
    .select('*')
    .order('status', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })

  const actionsByStatement = new Map<string, typeof actionRows>()
  for (const a of actionRows ?? []) {
    if (!actionsByStatement.has(a.i_statement_id)) {
      actionsByStatement.set(a.i_statement_id, [])
    }
    actionsByStatement.get(a.i_statement_id)!.push(a)
  }

  // ── Fetch evidence files ──────────────────────────────────────────────────
  const { data: evidenceFileRows } = await supabase
    .from('i_statement_evidence_files')
    .select('id, i_statement_id, file_name, storage_path, file_size, mime_type, scan_status, uploaded_at, uploaded_by')
    .order('uploaded_at', { ascending: false })

  // Resolve uploader names
  const uploaderIds = [...new Set(
    (evidenceFileRows ?? []).map(f => f.uploaded_by).filter(Boolean) as string[]
  )]
  const { data: uploaderUsers } = uploaderIds.length > 0
    ? await supabase.from('users').select('id, full_name, email').in('id', uploaderIds)
    : { data: [] }
  const uploaderNameById = new Map((uploaderUsers ?? []).map(u => [u.id, u.full_name ?? u.email ?? 'Unknown']))

  const filesByStatement = new Map<string, IStatementEvidenceFileItem[]>()
  for (const f of evidenceFileRows ?? []) {
    if (!filesByStatement.has(f.i_statement_id)) {
      filesByStatement.set(f.i_statement_id, [])
    }
    filesByStatement.get(f.i_statement_id)!.push({
      id:               f.id,
      file_name:        f.file_name,
      storage_path:     f.storage_path,
      file_size:        f.file_size,
      mime_type:        f.mime_type,
      uploaded_at:      f.uploaded_at,
      uploaded_by_name: f.uploaded_by ? (uploaderNameById.get(f.uploaded_by) ?? null) : null,
      scan_status:      f.scan_status,
    })
  }

  // ── Fetch team members for action plan assignment ─────────────────────────
  const { data: teamRows } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('organisation_id', profile?.organisation_id ?? '')
    .in('role', ['admin', 'user'])
    .order('full_name', { ascending: true })

  const teamMembers: TeamMember[] = (teamRows ?? []).map(u => ({
    id:        u.id,
    full_name: u.full_name,
    email:     u.email,
  }))

  // ── Merge statements with evidence, history, and actions ─────────────────
  const grouped: Record<string, StatementWithEvidence[]> = {}
  for (const stmt of statements) {
    if (!grouped[stmt.key_question]) grouped[stmt.key_question] = []
    grouped[stmt.key_question].push({
      ...stmt,
      evidence:      evidenceMap.get(stmt.id) ?? null,
      history:       historyByStatement.get(stmt.id) ?? [],
      actions:       actionsByStatement.get(stmt.id) ?? [],
      evidenceFiles: filesByStatement.get(stmt.id) ?? [],
    })
  }

  // ── Summary counts ────────────────────────────────────────────────────────
  const total      = statements.length
  const evidList   = evidenceRows ?? []
  const green      = evidList.filter(e => e.confidence === 'green').length
  const amber      = evidList.filter(e => e.confidence === 'amber' || e.confidence === 'red').length
  const unassessed = total - evidList.filter(e => e.confidence !== 'not_assessed').length

  // RAG counts (date-driven)
  const ragCounts = { green: 0, amber: 0, red: 0, grey: 0 }
  for (const e of evidList) {
    const rag = calculateRAG({ date_reviewed: e.date_reviewed, next_review_due: e.next_review_due })
    ragCounts[rag]++
  }
  ragCounts.grey += (total - evidList.length) // statements with no evidence row at all

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-ink">People&apos;s Voice</h1>
          <HelpWidget title="People's Voice" items={[
            { heading: 'What are I statements?', body: 'I statements are the 19 experience-based outcomes published by CQC as part of the 2026 assessment framework, drawn from the Think Local Act Personal standards. They describe what good care looks like from the perspective of the person receiving it — for example, "I am treated with dignity and respect."' },
            { heading: 'How does CQC use these?', body: 'During inspections, CQC gathers evidence directly from residents, families, and carers to assess whether each statement is met. Having your own evidence already organised against each statement puts you in a much stronger position.' },
            { heading: 'What should I record as evidence?', body: 'Anything that demonstrates the statement is met — resident feedback, survey results, care plan entries, observations, complaints and compliments records, or meeting notes. The stronger and more recent the evidence, the better.' },
            { heading: 'What is evidence quality?', body: 'The quality rating (Strong, Adequate, Weak, None) is your own honest assessment of how well your evidence supports the statement. Use it to prioritise where to focus improvement efforts.' },
            { heading: 'What are action items?', body: 'If evidence is weak or missing for a statement, you can create an action item directly from that statement to track what needs to be done, assign it to a team member, and set a due date.' },
          ]} />
        </div>
        <p className="text-sm text-ink-dim leading-relaxed">
          These are the <strong>"I" statements</strong> published by CQC as part of the draft 2026 assessment
          framework, drawn from the Think Local Act Personal (TLAP) standards. During inspections, CQC gathers
          evidence directly from residents, families, and carers to assess whether each statement is met.
          Use this page to record what evidence you hold, rate its quality, set review dates, and track
          actions for any gaps.
        </p>
        <p className="text-sm text-ink-muted mt-2">
          Source: CQC draft assessment framework v9 (2026). Well-Led has no published "I" statements in the
          current draft.
        </p>
      </div>

      {/* Summary strips */}
      <div className="space-y-3">
        {/* Review schedule (RAG) */}
        <div>
          <p className="text-xs font-semibold text-ink-dim mb-2 uppercase tracking-wide">Review schedule</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Up to date',   value: ragCounts.green, style: 'bg-green-50 text-green-700 border-green-200' },
              { label: 'Due soon',     value: ragCounts.amber, style: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Overdue',      value: ragCounts.red,   style: 'bg-red-50   text-red-700   border-red-200'   },
              { label: 'Not reviewed', value: ragCounts.grey,  style: 'bg-fill  text-ink-muted  border-line'        },
            ].map(({ label, value, style }) => (
              <div key={label} className={`rounded-xl border px-4 py-3 text-center ${style}`}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence quality */}
        <div>
          <p className="text-xs font-semibold text-ink-dim mb-2 uppercase tracking-wide">Evidence quality</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Evidence strong',     value: green,      style: 'bg-green-50 text-green-700 border-green-200' },
              { label: 'Evidence needs work', value: amber,      style: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Not assessed',        value: unassessed, style: 'bg-fill  text-ink-muted  border-line'        },
            ].map(({ label, value, style }) => (
              <div key={label} className={`rounded-xl border px-4 py-3 text-center ${style}`}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Viewer notice */}
      {isViewer && (
        <div className="bg-[#e6f7f5] border border-[#c0eae5] rounded-xl px-4 py-3 text-sm text-brand">
          You are viewing People's Voice in read-only mode.
        </div>
      )}

      {/* Statement groups */}
      <PeoplesVoiceClient
        grouped={grouped}
        isViewer={isViewer}
        isAdmin={isAdmin}
        orgId={profile?.organisation_id ?? ''}
        currentUserId={profile?.id ?? ''}
        teamMembers={teamMembers}
      />

    </div>
  )
}
