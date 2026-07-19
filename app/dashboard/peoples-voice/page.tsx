/**
 * /dashboard/peoples-voice
 *
 * Displays the 19 authentic TLAP "I" statements published by CQC as part
 * of the draft 2026 assessment framework. Staff record evidence against
 * each statement and rate their confidence (Green / Amber / Red).
 *
 * CQC gathers this evidence directly from people using services, their
 * families, and carers during inspections. This module helps teams
 * understand what inspectors will ask and prepare accordingly.
 *
 * Source: CQC draft assessment framework v9 (2026), TLAP "I" statements.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import PeoplesVoiceClient, { type StatementWithEvidence } from './PeoplesVoiceClient'

export const metadata = { title: "People's Voice | AlwaysReady" }

export default async function PeoplesVoicePage() {
  const supabase = await createClient()
  const profile  = await getCurrentUserProfile()
  const isViewer = profile?.role === 'viewer'

  // Fetch all 19 statements ordered by key_question natural order then statement_order
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

  // Fetch this org's evidence (RLS scopes to org automatically)
  const { data: evidenceRows } = await supabase
    .from('i_statement_evidence')
    .select('*')

  // Build a lookup: i_statement_id → evidence row
  const evidenceMap = new Map(
    (evidenceRows ?? []).map(e => [e.i_statement_id, e])
  )

  // Merge statements with their evidence and group by key_question
  const grouped: Record<string, StatementWithEvidence[]> = {}
  for (const stmt of statements) {
    if (!grouped[stmt.key_question]) grouped[stmt.key_question] = []
    grouped[stmt.key_question].push({
      ...stmt,
      evidence: evidenceMap.get(stmt.id) ?? null,
    })
  }

  // Summary counts
  const total      = statements.length
  const green      = (evidenceRows ?? []).filter(e => e.confidence === 'green').length
  const amber      = (evidenceRows ?? []).filter(e => e.confidence === 'amber').length
  const red        = (evidenceRows ?? []).filter(e => e.confidence === 'red').length
  const unassessed = total - (evidenceRows ?? []).filter(e => e.confidence !== 'not_assessed').length

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">People's Voice</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          These are the <strong>"I" statements</strong> published by CQC as part of the draft 2026 assessment
          framework, drawn from the Think Local Act Personal (TLAP) standards. During inspections, CQC gathers
          evidence directly from residents, families, and carers to assess whether each statement is met.
          Use this page to record what evidence you hold and identify gaps before an inspection.
        </p>
        <p className="text-xs text-gray-400 mt-2 italic">
          Source: CQC draft assessment framework v9 (2026). Well-Led has no published "I" statements in the
          current draft.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Green',        value: green,      style: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Amber',        value: amber,      style: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'Red',          value: red,        style: 'bg-red-50   text-red-700   border-red-200'   },
          { label: 'Not assessed', value: unassessed, style: 'bg-gray-50  text-gray-500  border-gray-200'  },
        ].map(({ label, value, style }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 text-center ${style}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Viewer notice */}
      {isViewer && (
        <div className="bg-[#e6f7f5] border border-[#c0eae5] rounded-xl px-4 py-3 text-sm text-[#014D4E]">
          You are viewing People's Voice in read-only mode.
        </div>
      )}

      {/* Statement groups */}
      <PeoplesVoiceClient grouped={grouped} isViewer={isViewer} />

    </div>
  )
}
