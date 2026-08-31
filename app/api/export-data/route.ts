/**
 * GET /api/export-data
 *
 * Generates a ZIP file containing CSVs of all organisation data:
 *   - kloe-records.csv       — compliance status, priority, notes, review dates
 *   - kloe-history.csv       — full audit trail of compliance changes
 *   - hr-staff.csv           — staff profiles
 *   - hr-training.csv        — training records per staff member
 *   - hr-holidays.csv        — holiday allowances
 *   - team-members.csv       — platform users and roles
 *
 * Evidence files (Supabase Storage) are not included — phase 2.
 * Admin-only. Scoped strictly to the authenticated user's organisation.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

// ── CSV helpers ────────────────────────────────────────────────────────────

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escapeCsv(row[h])).join(',')),
  ]
  return lines.join('\r\n')
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Role check — admin only
  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = profile.organisation_id

  // ── Fetch all data ──────────────────────────────────────────────────────

  const [
    { data: complianceRecords },
    { data: complianceHistory },
    { data: hrStaff },
    { data: hrTraining },
    { data: hrHolidays },
    { data: teamMembers },
  ] = await Promise.all([
    // KLOE compliance records with KLOE title and key question
    supabase
      .from('compliance_records')
      .select(`
        klo_item_id,
        klo_items ( title, key_question_id, key_questions ( name ) ),
        status,
        priority,
        date_reviewed,
        next_review_due,
        review_frequency_days,
        evidence_location,
        notes,
        last_updated_by,
        assigned_to,
        created_at,
        updated_at
      `)
      .eq('organisation_id', orgId)
      .order('updated_at', { ascending: false }),

    // Full compliance audit trail
    supabase
      .from('compliance_record_history')
      .select(`
        klo_item_id,
        klo_items ( title ),
        status,
        priority,
        date_reviewed,
        next_review_due,
        review_frequency_days,
        evidence_location,
        notes,
        changed_by,
        system_recorded_at
      `)
      .eq('organisation_id', orgId)
      .order('system_recorded_at', { ascending: false }),

    // HR staff profiles with name and email from users
    supabase
      .from('hr_staff_profiles')
      .select(`
        users ( full_name, email ),
        job_title,
        department,
        employee_type,
        contracted_hours,
        employment_start,
        leaving_date,
        employment_status,
        dbs_review_date,
        dbs_next_review_due,
        right_to_work_verified,
        references_obtained,
        supervision_review_date,
        supervision_next_due,
        appraisal_review_date,
        appraisal_next_due,
        mandatory_training_complete,
        created_at
      `)
      .eq('organisation_id', orgId),

    // HR training records
    supabase
      .from('hr_training_records')
      .select(`
        users ( full_name, email ),
        hr_training_types ( name ),
        date_completed,
        next_due,
        frequency_days,
        notes,
        created_at,
        updated_at
      `)
      .eq('organisation_id', orgId)
      .order('updated_at', { ascending: false }),

    // HR holiday allowances
    supabase
      .from('hr_holiday_allowances')
      .select(`
        users ( full_name, email ),
        leave_year_start,
        total_allowance,
        taken,
        carry_over,
        created_at
      `)
      .eq('organisation_id', orgId),

    // Team members
    supabase
      .from('users')
      .select('full_name, email, role, onboarding_complete, created_at')
      .eq('organisation_id', orgId)
      .order('role'),
  ])

  // ── Shape rows for CSV ──────────────────────────────────────────────────

  const kloeCsv = toCsv(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase joined query shape; typed below by field access
    (complianceRecords ?? []).map((r: any) => ({
      key_question:         r.klo_items?.key_questions?.name ?? '',
      kloe_title:           r.klo_items?.title ?? '',
      status:               r.status,
      priority:             r.priority,
      date_reviewed:        r.date_reviewed ?? '',
      next_review_due:      r.next_review_due ?? '',
      review_frequency_days: r.review_frequency_days,
      evidence_location:    r.evidence_location ?? '',
      notes:                r.notes ?? '',
      last_updated_by:      r.last_updated_by ?? '',
      assigned_to:          r.assigned_to ?? '',
      created_at:           r.created_at,
      updated_at:           r.updated_at,
    }))
  )

  const histCsv = toCsv(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase joined query shape
    (complianceHistory ?? []).map((r: any) => ({
      kloe_title:           r.klo_items?.title ?? '',
      status:               r.status ?? '',
      priority:             r.priority ?? '',
      date_reviewed:        r.date_reviewed ?? '',
      next_review_due:      r.next_review_due ?? '',
      review_frequency_days: r.review_frequency_days ?? '',
      evidence_location:    r.evidence_location ?? '',
      notes:                r.notes ?? '',
      changed_by:           r.changed_by,
      recorded_at:          r.system_recorded_at,
    }))
  )

  const staffCsv = toCsv(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase joined query shape
    (hrStaff ?? []).map((r: any) => ({
      name:                       r.users?.full_name ?? '',
      email:                      r.users?.email ?? '',
      job_title:                  r.job_title ?? '',
      department:                 r.department ?? '',
      employee_type:              r.employee_type ?? '',
      contracted_hours:           r.contracted_hours ?? '',
      employment_start:           r.employment_start ?? '',
      leaving_date:               r.leaving_date ?? '',
      employment_status:          r.employment_status,
      dbs_review_date:            r.dbs_review_date ?? '',
      dbs_next_review_due:        r.dbs_next_review_due ?? '',
      right_to_work_verified:     r.right_to_work_verified,
      references_obtained:        r.references_obtained,
      supervision_review_date:    r.supervision_review_date ?? '',
      supervision_next_due:       r.supervision_next_due ?? '',
      appraisal_review_date:      r.appraisal_review_date ?? '',
      appraisal_next_due:         r.appraisal_next_due ?? '',
      mandatory_training_complete: r.mandatory_training_complete,
      created_at:                 r.created_at,
    }))
  )

  const trainingCsv = toCsv(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase joined query shape
    (hrTraining ?? []).map((r: any) => ({
      name:             r.users?.full_name ?? '',
      email:            r.users?.email ?? '',
      training_type:    r.hr_training_types?.name ?? '',
      date_completed:   r.date_completed ?? '',
      next_due:         r.next_due ?? '',
      frequency_days:   r.frequency_days,
      notes:            r.notes ?? '',
      created_at:       r.created_at,
      updated_at:       r.updated_at,
    }))
  )

  const holidayCsv = toCsv(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase joined query shape
    (hrHolidays ?? []).map((r: any) => ({
      name:             r.users?.full_name ?? '',
      email:            r.users?.email ?? '',
      leave_year_start: r.leave_year_start,
      total_allowance:  r.total_allowance,
      taken:            r.taken,
      carry_over:       r.carry_over,
      remaining:        r.total_allowance + r.carry_over - r.taken,
      created_at:       r.created_at,
    }))
  )

  const teamCsv = toCsv(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase joined query shape
    (teamMembers ?? []).map((r: any) => ({
      name:                r.full_name ?? '',
      email:               r.email,
      role:                r.role,
      onboarding_complete: r.onboarding_complete,
      created_at:          r.created_at,
    }))
  )

  // ── Build ZIP ───────────────────────────────────────────────────────────

  const zip = new JSZip()
  const folder = zip.folder('alwaysready-export')!

  folder.file('kloe-records.csv',  kloeCsv  || 'No records found')
  folder.file('kloe-history.csv',  histCsv  || 'No records found')
  folder.file('hr-staff.csv',      staffCsv || 'No records found')
  folder.file('hr-training.csv',   trainingCsv || 'No records found')
  folder.file('hr-holidays.csv',   holidayCsv  || 'No records found')
  folder.file('team-members.csv',  teamCsv  || 'No records found')

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

  const today = new Date().toISOString().split('T')[0]
  const filename = `alwaysready-export-${today}.zip`

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(zipBuffer.byteLength),
    },
  })
}
