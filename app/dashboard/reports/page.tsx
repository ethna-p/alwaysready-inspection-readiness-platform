/**
 * /dashboard/reports — Custom report builder. Admin only.
 *
 * Fetches KLOE records, action items, and HR compliance data for the org,
 * then passes to the ReportBuilder client component for filtering and rendering.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import { calculateRAG } from '@/lib/rag'
import ReportBuilder from './ReportBuilder'
import type { KloeRow, ActionRow, HrRow } from './ReportBuilder'

export const metadata = { title: 'Custom Reports — AlwaysReady' }

export default async function ReportsPage() {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const orgId = profile.organisation_id

  // ── Org name ─────────────────────────────────────────────────────────────
  const { data: org } = await supabase
    .from('organisations')
    .select('name')
    .eq('id', orgId)
    .single()

  // ── Key questions (ordered) ───────────────────────────────────────────────
  const { data: kqRows } = await supabase
    .from('key_questions')
    .select('id, name')
    .order('display_order')

  const keyQuestions = (kqRows ?? []).map(kq => kq.name)

  // ── Team members (for resolving assigned_to names) ────────────────────────
  const { data: teamRows } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('organisation_id', orgId)
  const nameById = new Map((teamRows ?? []).map(u => [u.id, u.full_name ?? u.email]))

  // ── KLOE records ──────────────────────────────────────────────────────────
  const { data: complianceRows } = await supabase
    .from('compliance_records')
    .select(`
      id,
      klo_item_id,
      status,
      priority,
      next_review_due,
      date_reviewed,
      assigned_to,
      klo_items (
        title,
        key_questions ( name )
      )
    `)
    .eq('organisation_id', orgId)

  const kloes: KloeRow[] = (complianceRows ?? []).map(r => {
    const item = r.klo_items as unknown as {
      title: string
      key_questions: { name: string } | null
    } | null

    const rag = calculateRAG({
      status:          r.status as 'not_started' | 'in_progress' | 'completed',
      next_review_due: r.next_review_due,
      date_reviewed:   r.date_reviewed ?? null,
    } as Parameters<typeof calculateRAG>[0])

    return {
      id:                r.id,
      title:             item?.title ?? '—',
      key_question_name: item?.key_questions?.name ?? '—',
      status:            r.status,
      rag:               rag as KloeRow['rag'],
      next_review_due:   r.next_review_due,
      priority:          r.priority,
      assigned_to_name:  r.assigned_to ? (nameById.get(r.assigned_to) ?? null) : null,
    }
  }).sort((a, b) => {
    const kqOrder = keyQuestions.indexOf(a.key_question_name) - keyQuestions.indexOf(b.key_question_name)
    if (kqOrder !== 0) return kqOrder
    return a.priority - b.priority
  })

  // ── Action items ──────────────────────────────────────────────────────────
  const { data: actionRows } = await supabase
    .from('action_items')
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      assigned_to,
      completion_notes,
      completed_at,
      klo_item_id,
      klo_items (
        title,
        key_questions ( name )
      )
    `)
    .eq('organisation_id', orgId)
    .order('due_date', { ascending: true, nullsFirst: false })

  const actions: ActionRow[] = (actionRows ?? []).map(a => {
    const item = a.klo_items as unknown as {
      title: string
      key_questions: { name: string } | null
    } | null

    return {
      id:                a.id,
      klo_title:         item?.title ?? '—',
      key_question_name: item?.key_questions?.name ?? '—',
      title:             a.title,
      status:            a.status as ActionRow['status'],
      priority:          a.priority as ActionRow['priority'],
      due_date:          a.due_date,
      assigned_to_name:  a.assigned_to ? (nameById.get(a.assigned_to) ?? null) : null,
      completion_notes:  a.completion_notes,
      completed_at:      a.completed_at,
    }
  })

  // ── HR staff ──────────────────────────────────────────────────────────────
  const { data: staffUsers } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('organisation_id', orgId)
    .neq('role', 'viewer')
    .order('full_name')

  const { data: hrProfiles } = await supabase
    .from('hr_staff_profiles')
    .select('user_id, job_title, dbs_next_review_due, supervision_next_due, appraisal_next_due, mandatory_training_complete')
    .eq('organisation_id', orgId)

  const hrProfileMap = new Map((hrProfiles ?? []).map(p => [p.user_id, p]))

  const hrStaff: HrRow[] = (staffUsers ?? []).map(u => {
    const hr = hrProfileMap.get(u.id)
    return {
      user_id:                    u.id,
      full_name:                  u.full_name,
      job_title:                  hr?.job_title ?? null,
      dbs_next_review_due:        hr?.dbs_next_review_due ?? null,
      supervision_next_due:       hr?.supervision_next_due ?? null,
      appraisal_next_due:         hr?.appraisal_next_due ?? null,
      mandatory_training_complete: hr?.mandatory_training_complete ?? false,
    }
  })

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header — hidden when printing */}
      <div className="print:hidden mb-8">
        <h1 className="text-2xl font-bold text-brand mb-1">Custom Reports</h1>
        <p className="text-sm text-ink-dim">
          Choose which sections and filters to include, then print or save as PDF.
        </p>
      </div>

      <ReportBuilder
        orgName={org?.name ?? 'Your Organisation'}
        keyQuestions={keyQuestions}
        kloes={kloes}
        actions={actions}
        hrStaff={hrStaff}
      />
    </div>
  )
}
