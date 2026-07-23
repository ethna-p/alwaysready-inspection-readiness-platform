/**
 * /dashboard/mock-inspections/[id] — mock inspection session.
 * Steps through KLOEs one at a time. Admin only.
 */
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import MockInspectionSession from './MockInspectionSession'

export const metadata = { title: 'Mock Inspection — AlwaysReady' }

export default async function MockInspectionSessionPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { kloe?: string }
}) {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Load the inspection record
  const { data: inspection } = await (supabase as any)
    .from('mock_inspections')
    .select('id, type, status, key_question_id, key_questions ( id, name )')
    .eq('id', params.id)
    .single()

  if (!inspection) notFound()
  if (inspection.status === 'completed') {
    redirect(`/dashboard/mock-inspections/${params.id}/report`)
  }

  // Load KLOEs — scoped to key question if partial
  let kloQuery = supabase
    .from('klo_items')
    .select('id, title, wording, key_question_id, key_questions ( name )')
    .order('key_question_id')
    .order('display_order')

  if (inspection.type === 'partial' && inspection.key_question_id) {
    kloQuery = kloQuery.eq('key_question_id', inspection.key_question_id)
  }

  const { data: klos } = await kloQuery

  if (!klos || klos.length === 0) notFound()

  // Load checklist items for these KLOEs (for this org's service type)
  const { data: orgProfile } = await supabase
    .from('organisations')
    .select('service_type_id')
    .eq('id', profile!.organisation_id!)
    .single()

  const kloIds = klos.map((k: any) => k.id)

  const { data: checklistItems } = await supabase
    .from('klo_checklist_items')
    .select('id, klo_item_id, ref, checklist_item, item_type, display_order')
    .in('klo_item_id', kloIds)
    .or(`service_type_id.eq.${orgProfile?.service_type_id},service_type_id.is.null`)
    .is('sub_service', null)
    .order('display_order')

  // Load existing findings and responses for this inspection
  const { data: existingFindings } = await (supabase as any)
    .from('mock_inspection_findings')
    .select('klo_item_id, rating, notes')
    .eq('mock_inspection_id', params.id)

  const { data: existingResponses } = await (supabase as any)
    .from('mock_inspection_checklist_responses')
    .select('checklist_item_id, response, note')
    .eq('mock_inspection_id', params.id)

  // Determine current KLOE index from URL param
  const currentKloeIndex = searchParams.kloe
    ? Math.max(0, Math.min(parseInt(searchParams.kloe, 10), klos.length - 1))
    : 0

  return (
    <MockInspectionSession
      inspectionId={params.id}
      inspectionType={inspection.type}
      keyQuestionName={(inspection.key_questions as any)?.name ?? null}
      klos={klos ?? []}
      checklistItems={checklistItems ?? []}
      existingFindings={existingFindings ?? []}
      existingResponses={existingResponses ?? []}
      currentKloeIndex={currentKloeIndex}
    />
  )
}
