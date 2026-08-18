/**
 * /dashboard/mock-inspections — list of past mock inspections + start new.
 * Admin only.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import StartMockInspectionForm from './StartMockInspectionForm'
import MockInspectionsList from './MockInspectionsList'
import type { InspectionListItem } from './MockInspectionsList'

export const metadata = { title: 'Mock Inspections — AlwaysReady' }

const RATING_ORDER: Record<string, number> = {
  inadequate: 0, requires_improvement: 1, good: 2, outstanding: 3,
}

function worstRating(ratings: string[]): string | null {
  if (!ratings.length) return null
  return ratings.reduce((worst, r) =>
    (RATING_ORDER[r] ?? 99) < (RATING_ORDER[worst] ?? 99) ? r : worst
  )
}

export default async function MockInspectionsPage() {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Fetch key questions for the start form
  const { data: keyQuestions } = await supabase
    .from('key_questions')
    .select('id, name')
    .order('display_order')

  // Fetch past mock inspections for this org
  const { data: inspectionsRaw } = await supabase
    .from('mock_inspections')
    .select(`
      id, type, status, started_at, completed_at,
      key_questions ( name )
    `)
    .order('started_at', { ascending: false })

  const inspectionList = (inspectionsRaw ?? []) as unknown as Omit<InspectionListItem, 'overall_rating'>[]

  // Fetch all findings for completed inspections in one query
  const completedIds = inspectionList
    .filter(i => i.status === 'completed')
    .map(i => i.id)

  const { data: findingsRaw } = completedIds.length > 0
    ? await supabase
        .from('mock_inspection_findings')
        .select('mock_inspection_id, rating')
        .in('mock_inspection_id', completedIds)
    : { data: [] }

  // Map inspection id → worst rating
  const ratingsByInspection = new Map<string, string[]>()
  for (const f of findingsRaw ?? []) {
    const arr = ratingsByInspection.get(f.mock_inspection_id) ?? []
    arr.push(f.rating)
    ratingsByInspection.set(f.mock_inspection_id, arr)
  }

  const inspections: InspectionListItem[] = inspectionList.map(i => ({
    ...i,
    overall_rating: worstRating(ratingsByInspection.get(i.id) ?? []),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand mb-1">Mock Inspections</h1>
        <p className="text-sm text-ink-dim">
          Run a mock inspection to identify areas for improvement before a real CQC visit.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Guidance only.</strong> Mock inspections are a self-assessment tool designed to help you identify areas for improvement. Ratings and recommendations do not represent the view of CQC. AlwaysReady makes no claim about how a CQC inspector would rate your service. CQC inspectors exercise independent professional judgement when forming their conclusions.
      </div>

      {/* Start new */}
      <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-brand mb-4">Start a new mock inspection</h2>
        <StartMockInspectionForm keyQuestions={keyQuestions ?? []} />
      </div>

      {/* Past inspections — always render so the empty state shows */}
      <MockInspectionsList inspections={inspections} />
    </div>
  )
}
