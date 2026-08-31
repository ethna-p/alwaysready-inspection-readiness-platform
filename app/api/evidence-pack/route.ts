/**
 * GET /api/evidence-pack
 *
 * Generates and streams a CQC Evidence Pack PDF for the authenticated user's
 * organisation. The pack structures all KLOE compliance records against
 * CQC's six evidence categories.
 *
 * Authentication: requires a valid session cookie.
 * No query params — always generates for the caller's own organisation.
 */
import 'server-only'
import { NextResponse }      from 'next/server'
import { renderToBuffer }    from '@react-pdf/renderer'
import React                 from 'react'
import { createClient }      from '@/lib/supabase/server'
import { calculateRAG }      from '@/lib/rag'
import { KLOE_CATEGORY_MAP } from '@/lib/evidence-categories'
import { EvidencePackDocument } from './document'
import type { KloeRow, EvidencePackDocumentProps } from './document'
import type { EvidenceCategoryId } from '@/lib/evidence-categories'

export async function GET() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // ── Profile & org ─────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organisation_id) {
    return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })
  }

  const orgId = profile.organisation_id

  const { data: org } = await supabase
    .from('organisations')
    .select('name, cqc_location_id, cqc_location_name, cqc_rating, service_types(name)')
    .eq('id', orgId)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })
  }

  // ── KLOEs with key questions ──────────────────────────────────────────────
  const { data: kloItems } = await supabase
    .from('klo_items')
    .select('id, title, key_questions(name)')
    .order('display_order', { ascending: true })

  if (!kloItems || kloItems.length === 0) {
    return NextResponse.json({ error: 'No KLOEs found' }, { status: 500 })
  }

  // ── Compliance records ────────────────────────────────────────────────────
  const { data: complianceRecords } = await supabase
    .from('compliance_records')
    .select('klo_item_id, status, date_reviewed, next_review_due, evidence_location, notes')
    .eq('organisation_id', orgId)

  const recordByKloId = new Map(
    (complianceRecords ?? []).map(r => [r.klo_item_id, r])
  )

  // ── Evidence files ────────────────────────────────────────────────────────
  const { data: evidenceFiles } = await supabase
    .from('kloe_evidence')
    .select('klo_item_id, file_name, uploaded_at')
    .eq('organisation_id', orgId)
    .eq('scan_status', 'clean')
    .order('uploaded_at', { ascending: false })

  const filesByKloId = new Map<string, { fileName: string; uploadedAt: string }[]>()
  for (const f of evidenceFiles ?? []) {
    const existing = filesByKloId.get(f.klo_item_id) ?? []
    existing.push({ fileName: f.file_name, uploadedAt: f.uploaded_at })
    filesByKloId.set(f.klo_item_id, existing)
  }

  // ── Build KloeRow list and group by evidence category ─────────────────────
  const now = new Date()
  const kloesByCategory: Record<string, KloeRow[]> = {}

  for (const klo of kloItems) {
    const record = recordByKloId.get(klo.id) ?? null
    const ragStatus = calculateRAG(record, now)

    // key_questions is a joined row — Supabase returns it as object or array
    const kqRaw = klo.key_questions
    const keyQuestion = Array.isArray(kqRaw)
      ? (kqRaw[0] as { name: string } | undefined)?.name ?? ''
      : (kqRaw as { name: string } | null)?.name ?? ''

    const row: KloeRow = {
      id:                klo.id,
      title:             klo.title,
      keyQuestion,
      ragStatus,
      complianceStatus:  record?.status ?? null,
      lastReviewed:      record?.date_reviewed ?? null,
      nextReviewDue:     record?.next_review_due ?? null,
      evidenceLocation:  record?.evidence_location ?? null,
      notes:             record?.notes ?? null,
      evidenceFiles:     filesByKloId.get(klo.id) ?? [],
    }

    const categoryId: EvidenceCategoryId =
      KLOE_CATEGORY_MAP[klo.title] ?? 'processes' // fallback

    if (!kloesByCategory[categoryId]) kloesByCategory[categoryId] = []
    kloesByCategory[categoryId].push(row)
  }

  // ── Render PDF ────────────────────────────────────────────────────────────
  const serviceTypeName =
    org.service_types && !Array.isArray(org.service_types)
      ? (org.service_types as { name: string }).name
      : Array.isArray(org.service_types)
        ? (org.service_types[0] as { name: string } | undefined)?.name ?? null
        : null

  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const docProps: EvidencePackDocumentProps = {
    orgName:          org.name,
    cqcLocationId:    org.cqc_location_id,
    cqcRegisteredName: org.cqc_location_name,
    cqcRating:        org.cqc_rating,
    serviceType:      serviceTypeName,
    generatedAt,
    kloesByCategory,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pdf renderToBuffer does not accept the typed ReactElement union
  const buffer = await renderToBuffer(React.createElement(EvidencePackDocument, docProps) as any)

  const filename = `evidence-pack-${org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`

  // Convert Node Buffer → Uint8Array for the Web API Response constructor
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
