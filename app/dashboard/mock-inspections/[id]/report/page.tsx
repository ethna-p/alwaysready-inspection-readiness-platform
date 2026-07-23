/**
 * /dashboard/mock-inspections/[id]/report — mock inspection report + action plan.
 * Forward-looking: "you need to..." not "you didn't...".
 */
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import type { MockInspectionRating } from '@/lib/types'

export const metadata = { title: 'Mock Inspection Report — AlwaysReady' }

const RATING_LABEL: Record<MockInspectionRating, string> = {
  outstanding:          'Outstanding',
  good:                 'Good',
  requires_improvement: 'Requires Improvement',
  inadequate:           'Inadequate',
}

const RATING_STYLE: Record<MockInspectionRating, string> = {
  outstanding:          'bg-purple-100 text-purple-700 border-purple-200',
  good:                 'bg-green-100 text-green-700 border-green-200',
  requires_improvement: 'bg-amber-100 text-amber-700 border-amber-200',
  inadequate:           'bg-red-100 text-red-700 border-red-200',
}

const RATING_ORDER: Record<MockInspectionRating, number> = {
  inadequate: 0, requires_improvement: 1, good: 2, outstanding: 3,
}

function overallRating(findings: { rating: MockInspectionRating }[]): MockInspectionRating | null {
  if (!findings.length) return null
  return findings.reduce((worst, f) =>
    RATING_ORDER[f.rating] < RATING_ORDER[worst.rating] ? f : worst
  ).rating
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function MockInspectionReportPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Load inspection
  const { data: inspection } = await (supabase as any)
    .from('mock_inspections')
    .select('id, type, status, started_at, completed_at, key_questions ( name )')
    .eq('id', params.id)
    .single()

  if (!inspection) notFound()
  if (inspection.status !== 'completed') {
    redirect(`/dashboard/mock-inspections/${params.id}`)
  }

  // Load findings with KLOE details
  const { data: findings } = await (supabase as any)
    .from('mock_inspection_findings')
    .select(`
      klo_item_id, rating, notes,
      klo_items ( id, title, wording, key_question_id, key_questions ( name ) )
    `)
    .eq('mock_inspection_id', params.id)

  // Load checklist responses with item detail
  const { data: responses } = await (supabase as any)
    .from('mock_inspection_checklist_responses')
    .select(`
      checklist_item_id, response, note,
      klo_checklist_items ( id, ref, checklist_item, klo_item_id )
    `)
    .eq('mock_inspection_id', params.id)

  // Load org name
  const { data: org } = await supabase
    .from('organisations')
    .select('name')
    .eq('id', profile!.organisation_id!)
    .single()

  if (!findings || findings.length === 0) notFound()

  // Group findings by key question
  const byKeyQuestion: Record<string, { name: string; findings: typeof findings }> = {}
  for (const f of findings) {
    const kq = (f.klo_items as any)?.key_questions
    const kqId = (f.klo_items as any)?.key_question_id
    if (!kqId) continue
    if (!byKeyQuestion[kqId]) byKeyQuestion[kqId] = { name: kq?.name ?? 'Unknown', findings: [] }
    byKeyQuestion[kqId].findings.push(f)
  }

  // Build action plan tiers
  const mustAddress: { title: string; action: string; rating: MockInspectionRating }[] = []
  const strengthen:  { title: string; action: string; rating: MockInspectionRating }[] = []
  const maintain:    { title: string }[] = []

  for (const f of findings) {
    const title = (f.klo_items as any)?.title ?? 'Unknown KLOE'
    const rating = f.rating as MockInspectionRating
    const kloId  = f.klo_item_id

    // Find not-met or partial checklist items for this KLOE
    const gaps = (responses ?? []).filter((r: any) =>
      (r.klo_checklist_items as any)?.klo_item_id === kloId &&
      (r.response === 'not_met' || r.response === 'partial')
    )

    if (rating === 'inadequate' || rating === 'requires_improvement') {
      const gapText = gaps.length > 0
        ? gaps.map((g: any) => {
            const ref = (g.klo_checklist_items as any)?.ref ?? ''
            const item = (g.klo_checklist_items as any)?.checklist_item ?? ''
            const note = g.note ? ` — ${g.note}` : ''
            return `${ref} ${item}${note}`
          }).join('; ')
        : f.notes ?? 'Review evidence and strengthen your approach for this area.'

      mustAddress.push({
        title,
        action: gapText || f.notes || 'Review and strengthen evidence for this KLOE.',
        rating,
      })
    } else if (rating === 'good') {
      const partialGaps = gaps.filter((g: any) => g.response === 'partial')
      if (partialGaps.length > 0 || !gaps.length) {
        strengthen.push({
          title,
          action: partialGaps.length > 0
            ? partialGaps.map((g: any) => {
                const ref = (g.klo_checklist_items as any)?.ref ?? ''
                const item = (g.klo_checklist_items as any)?.checklist_item ?? ''
                return `Strengthen evidence for ${ref} ${item}`
              }).join('; ')
            : 'Continue building and documenting evidence to maintain this rating.',
          rating,
        })
      } else {
        maintain.push({ title })
      }
    } else {
      // outstanding
      maintain.push({ title })
    }
  }

  const overall = overallRating(findings)

  return (
    <div className="max-w-3xl mx-auto space-y-8 print:space-y-6">

      {/* Back + print */}
      <div className="flex items-center justify-between print:hidden">
        <a href="/dashboard/mock-inspections" className="text-sm text-[#014D4E] hover:underline">
          ← Mock Inspections
        </a>
        <button
          onClick={() => window.print()}
          className="text-sm font-medium text-[#014D4E] border border-[#014D4E] rounded-lg px-4 py-2 hover:bg-[#014D4E] hover:text-white transition-colors"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Report header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm print:shadow-none print:border-gray-300">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Mock Inspection Report</p>
        <h1 className="text-2xl font-bold text-[#014D4E] mb-1">{org?.name ?? 'Your Service'}</h1>
        <p className="text-sm text-gray-500">
          {inspection.type === 'partial'
            ? `Partial inspection — ${(inspection.key_questions as any)?.name}`
            : 'Full inspection — all key questions'}
          {' · '}Completed {formatDate(inspection.completed_at ?? inspection.started_at)}
        </p>

        {/* Overall finding */}
        {overall && (
          <div className={`mt-4 inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-sm font-semibold ${RATING_STYLE[overall]}`}>
            Overall finding: {RATING_LABEL[overall]}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 leading-relaxed">
          <strong>Important — guidance only.</strong> This report is a self-assessment tool designed to help you identify areas for improvement. The ratings and recommendations it produces are for guidance only. They do not represent the view of CQC, and AlwaysReady makes no claim about how a CQC inspector would rate your service. CQC inspectors exercise independent professional judgement when forming their conclusions.
        </div>
      </div>

      {/* Summary findings by key question */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm print:shadow-none">
        <h2 className="text-base font-semibold text-[#014D4E] mb-4">Summary findings</h2>
        <div className="space-y-4">
          {Object.entries(byKeyQuestion).map(([kqId, { name, findings: kqFindings }]) => {
            const kqOverall = overallRating(kqFindings)
            return (
              <div key={kqId}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">{name}</h3>
                  {kqOverall && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${RATING_STYLE[kqOverall]}`}>
                      {RATING_LABEL[kqOverall]}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
                  {kqFindings.map((f: any) => (
                    <div key={f.klo_item_id} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-700">{(f.klo_items as any)?.title}</p>
                      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${RATING_STYLE[f.rating as MockInspectionRating]}`}>
                        {RATING_LABEL[f.rating as MockInspectionRating]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm print:shadow-none space-y-6">
        <h2 className="text-base font-semibold text-[#014D4E]">Your focus areas</h2>
        <p className="text-sm text-gray-600 -mt-3">
          The actions below tell you what to prioritise before your next inspection. Work through them in order.
        </p>

        {/* Must address */}
        {mustAddress.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
              <h3 className="text-sm font-bold text-red-700">Must address</h3>
            </div>
            <div className="space-y-3">
              {mustAddress.map((item, i) => (
                <div key={i} className="border border-red-100 bg-red-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-[#1a1a1a] mb-1">{item.title}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    You need to: {item.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengthen */}
        {strengthen.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
              <h3 className="text-sm font-bold text-amber-700">Strengthen before inspection</h3>
            </div>
            <div className="space-y-3">
              {strengthen.map((item, i) => (
                <div key={i} className="border border-amber-100 bg-amber-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-[#1a1a1a] mb-1">{item.title}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    We recommend: {item.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintain */}
        {maintain.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-3 w-3 rounded-full bg-green-500 shrink-0" />
              <h3 className="text-sm font-bold text-green-700">Maintain</h3>
            </div>
            <div className="border border-green-100 bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">These areas are performing well. Keep your evidence up to date and continue your current approach.</p>
              <ul className="space-y-1">
                {maintain.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="text-green-500">✓</span> {item.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {mustAddress.length === 0 && strengthen.length === 0 && maintain.length === 0 && (
          <p className="text-sm text-gray-500">No action items generated — check that all KLOEs were rated.</p>
        )}
      </div>

      {/* Footer disclaimer for print */}
      <div className="text-xs text-gray-400 text-center pb-4 print:block">
        Generated by AlwaysReady · {formatDate(new Date().toISOString())} · For guidance only — does not represent the view of CQC.
      </div>

    </div>
  )
}
