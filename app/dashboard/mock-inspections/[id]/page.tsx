/**
 * /dashboard/mock-inspections/[id] — mock inspection session.
 * Steps through KLOEs one at a time. Admin only.
 */
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import MockInspectionSession from './MockInspectionSession'
import type { MockInspectionRating, MockChecklistResponse } from '@/lib/types'

export const metadata = { title: 'Mock Inspection — AlwaysReady' }

type InspectionWithKQ = {
  id: string
  type: 'full' | 'partial'
  status: 'in_progress' | 'completed'
  key_question_id: string | null
  key_questions: { id: string; name: string } | null
}

type KloWithKQ = {
  id: string
  title: string
  wording: string | null
  key_question_id: string
  key_questions: { name: string } | null
}

type DbFinding = { klo_item_id: string; rating: MockInspectionRating; notes: string | null }
type DbResponse = { checklist_item_id: string; response: MockChecklistResponse; note: string | null }

export default async function MockInspectionSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ kloe?: string }>
}) {
  const { id } = await params
  const { kloe } = await searchParams

  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Load the inspection record
  const { data: inspectionRaw } = await supabase
    .from('mock_inspections')
    .select('id, type, status, key_question_id, key_questions ( id, name )')
    .eq('id', id)
    .single()
  const inspection = inspectionRaw as InspectionWithKQ | null

  if (!inspection) notFound()
  if (inspection.status === 'completed') {
    redirect(`/dashboard/mock-inspections/${id}/report`)
  }

  // Load KLOEs — scoped to key question if partial
  const isPartial = inspection.type === 'partial' && inspection.key_question_id

  const { data: klosRaw } = isPartial
    ? await supabase
        .from('klo_items')
        .select('id, title, wording, key_question_id, key_questions ( name )')
        .eq('key_question_id', inspection.key_question_id!)
        .order('display_order')
    : await supabase
        .from('klo_items')
        .select('id, title, wording, key_question_id, key_questions ( name )')
        .order('key_question_id')
        .order('display_order')
  const klos = klosRaw as KloWithKQ[] | null

  if (!klos || klos.length === 0) notFound()

  // Load checklist items for these KLOEs (for this org's service type)
  const { data: orgProfile } = await supabase
    .from('organisations')
    .select('service_type_id')
    .eq('id', profile!.organisation_id!)
    .single()

  const kloIds = klos.map(k => k.id)

  const { data: checklistItems } = await supabase
    .from('klo_checklist_items')
    .select('id, klo_item_id, ref, checklist_item, item_type, display_order')
    .in('klo_item_id', kloIds)
    .or(`service_type_id.eq.${orgProfile?.service_type_id},service_type_id.is.null`)
    .is('sub_service', null)
    .order('display_order')

  // Load existing findings and responses for this inspection
  const { data: existingFindingsRaw } = await supabase
    .from('mock_inspection_findings')
    .select('klo_item_id, rating, notes')
    .eq('mock_inspection_id', id)
  const existingFindings = existingFindingsRaw as DbFinding[] | null

  const { data: existingResponsesRaw } = await supabase
    .from('mock_inspection_checklist_responses')
    .select('checklist_item_id, response, note')
    .eq('mock_inspection_id', id)
  const existingResponses = existingResponsesRaw as DbResponse[] | null

  // Determine current KLOE index from URL param
  const currentKloeIndex = kloe
    ? Math.max(0, Math.min(parseInt(kloe, 10), klos.length - 1))
    : 0

  return (
    <MockInspectionSession
      inspectionId={id}
      inspectionType={inspection.type}
      keyQuestionName={inspection.key_questions?.name ?? null}
      klos={klos ?? []}
      checklistItems={checklistItems ?? []}
      existingFindings={existingFindings ?? []}
      existingResponses={existingResponses ?? []}
      currentKloeIndex={currentKloeIndex}
    />
  )
}
