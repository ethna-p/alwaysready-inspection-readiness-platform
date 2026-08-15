/**
 * Custom Report — PDF Document
 *
 * Rendered server-side via @react-pdf/renderer.
 * Do NOT add 'use client' — this file is server-only.
 */
import React from 'react'
import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'

// ── Shared colour constants ────────────────────────────────────────────────────
const TEAL   = '#014D4E'
const WHITE  = '#ffffff'
const LIGHT  = '#f3f4f6'
const MUTED  = '#4b5563'
const DARK   = '#1a1a1a'
const BORDER = '#e5e7eb'

const RAG_COLOUR: Record<string, string> = {
  green: '#16a34a',
  amber: '#d97706',
  red:   '#dc2626',
  grey:  '#6b7280',
}
const RAG_LABEL: Record<string, string> = {
  green: 'Up to Date',
  amber: 'Due Soon',
  red:   'Overdue',
  grey:  'Unassessed',
}

// ── Data types ────────────────────────────────────────────────────────────────

export type PdfKloeRow = {
  klo_item_id:       string
  title:             string
  key_question_name: string
  status:            string
  rag:               string
  next_review_due:   string | null
  priority:          number
  assigned_to_name:  string | null
}

export type PdfActionRow = {
  title:            string
  klo_title:        string
  status:           string
  priority:         string
  due_date:         string | null
  assigned_to_name: string | null
}

export type PdfHrRow = {
  full_name:                   string | null
  job_title:                   string | null
  dbs_next_review_due:         string | null
  supervision_next_due:        string | null
  appraisal_next_due:          string | null
  mandatory_training_complete: boolean
}

export type ReportPdfDocumentProps = {
  orgName:       string
  viewLabel:     string
  generatedAt:   string
  ragCounts:     { green: number; amber: number; red: number; grey: number; total: number }
  actionCounts:  { open: number; overdue: number; total: number }
  kloes:         PdfKloeRow[]
  actions:       PdfActionRow[]
  hrStaff:       PdfHrRow[]
  showHr:        boolean
  evidenceCounts: Record<string, number>
  showEvidenceCol: boolean
}

// ── Styles ────────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const s = StyleSheet.create({
  page: {
    fontFamily:       'Helvetica',
    fontSize:         8,
    color:            DARK,
    paddingTop:       40,
    paddingBottom:    40,
    paddingHorizontal: 40,
  },

  // Header
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   20,
    paddingBottom:  12,
    borderBottom:   `1pt solid ${BORDER}`,
  },
  headerLeft: { flexDirection: 'column', gap: 3 },
  reportTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: TEAL },
  orgName:     { fontSize: 10, color: MUTED },
  headerRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 3 },
  dateLine:    { fontSize: 7, color: MUTED },

  // RAG summary cards
  ragRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  16,
  },
  ragCard: {
    flex:            1,
    backgroundColor: LIGHT,
    borderRadius:    4,
    padding:         8,
    alignItems:      'center',
  },
  ragNum:   { fontSize: 20, fontFamily: 'Helvetica-Bold' },
  ragLbl:   { fontSize: 7, color: MUTED, marginTop: 2 },

  // Section heading
  sectionHeading: {
    fontSize:        10,
    fontFamily:      'Helvetica-Bold',
    color:           TEAL,
    marginBottom:    6,
    marginTop:       16,
    paddingBottom:   4,
    borderBottom:    `1pt solid ${BORDER}`,
  },

  // Table
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: TEAL,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection:     'row',
    paddingVertical:   4,
    paddingHorizontal: 6,
    borderBottom:      `0.5pt solid ${BORDER}`,
  },
  tableRowAlt: {
    flexDirection:     'row',
    paddingVertical:   4,
    paddingHorizontal: 6,
    borderBottom:      `0.5pt solid ${BORDER}`,
    backgroundColor:   '#f9fafb',
  },
  th: {
    fontSize:    7,
    fontFamily:  'Helvetica-Bold',
    color:       WHITE,
  },
  td: {
    fontSize: 7,
    color:    DARK,
  },
  tdMuted: {
    fontSize: 7,
    color:    MUTED,
  },

  // RAG dot
  ragDot: {
    fontSize:   7,
    fontFamily: 'Helvetica-Bold',
  },

  // Footer
  footer: {
    position:    'absolute',
    bottom:      24,
    left:        40,
    right:       40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop:   `0.5pt solid ${BORDER}`,
    paddingTop:  4,
  },
  footerText: { fontSize: 6, color: MUTED },
})

// ── Column width helpers ──────────────────────────────────────────────────────
const KL = (w: string) => ({ width: w } as const)

// ── Component ─────────────────────────────────────────────────────────────────

export function ReportPdfDocument({
  orgName, viewLabel, generatedAt,
  ragCounts, actionCounts,
  kloes, actions, hrStaff,
  showHr, evidenceCounts, showEvidenceCol,
}: ReportPdfDocumentProps) {
  return (
    <Document
      title={`${viewLabel} — ${orgName}`}
      author="AlwaysReady"
      creator="AlwaysReady Inspection Readiness Platform"
    >
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
            <Text style={s.reportTitle}>{viewLabel}</Text>
            <Text style={s.orgName}>{orgName}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.dateLine}>Generated {generatedAt}</Text>
            <Text style={s.dateLine}>For internal governance use only</Text>
          </View>
        </View>

        {/* ── RAG summary ─────────────────────────────────────────────────── */}
        <View style={s.ragRow}>
          <View style={s.ragCard}>
            <Text style={[s.ragNum, { color: '#6b7280' }]}>{ragCounts.grey}</Text>
            <Text style={s.ragLbl}>Unassessed</Text>
          </View>
          <View style={s.ragCard}>
            <Text style={[s.ragNum, { color: '#dc2626' }]}>{ragCounts.red}</Text>
            <Text style={s.ragLbl}>Overdue</Text>
          </View>
          <View style={s.ragCard}>
            <Text style={[s.ragNum, { color: '#d97706' }]}>{ragCounts.amber}</Text>
            <Text style={s.ragLbl}>Due Soon</Text>
          </View>
          <View style={s.ragCard}>
            <Text style={[s.ragNum, { color: '#16a34a' }]}>{ragCounts.green}</Text>
            <Text style={s.ragLbl}>Up to Date</Text>
          </View>
          <View style={s.ragCard}>
            <Text style={[s.ragNum, { color: TEAL }]}>{ragCounts.total}</Text>
            <Text style={s.ragLbl}>Total KLOEs</Text>
          </View>
          <View style={s.ragCard}>
            <Text style={[s.ragNum, { color: actionCounts.overdue > 0 ? '#dc2626' : DARK }]}>{actionCounts.open}</Text>
            <Text style={s.ragLbl}>Open Actions</Text>
          </View>
          <View style={s.ragCard}>
            <Text style={[s.ragNum, { color: actionCounts.overdue > 0 ? '#dc2626' : '#6b7280' }]}>{actionCounts.overdue}</Text>
            <Text style={s.ragLbl}>Overdue Actions</Text>
          </View>
        </View>

        {/* ── KLOE table ──────────────────────────────────────────────────── */}
        {kloes.length > 0 && (
          <View>
            <Text style={s.sectionHeading}>KLOE Summary ({kloes.length})</Text>
            {/* Header row */}
            <View style={s.tableHeader}>
              <Text style={[s.th, KL('14%')]}>Key Question</Text>
              <Text style={[s.th, KL('30%')]}>KLOE</Text>
              <Text style={[s.th, KL('12%')]}>Status</Text>
              <Text style={[s.th, KL('10%')]}>RAG</Text>
              <Text style={[s.th, KL('12%')]}>Next Review</Text>
              <Text style={[s.th, KL('6%')]}>Priority</Text>
              <Text style={[s.th, KL(showEvidenceCol ? '10%' : '16%')]}>Assigned To</Text>
              {showEvidenceCol && <Text style={[s.th, KL('6%')]}>Evidence</Text>}
            </View>
            {kloes.map((k, i) => (
              <View key={k.klo_item_id + i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tdMuted, KL('14%')]}>{k.key_question_name}</Text>
                <Text style={[s.td, KL('30%')]}>{k.title}</Text>
                <Text style={[s.td, KL('12%')]}>{k.status.replace('_', ' ')}</Text>
                <Text style={[s.ragDot, KL('10%'), { color: RAG_COLOUR[k.rag] ?? '#6b7280' }]}>
                  {RAG_LABEL[k.rag] ?? k.rag}
                </Text>
                <Text style={[s.td, KL('12%')]}>{formatDate(k.next_review_due)}</Text>
                <Text style={[s.td, KL('6%'), { textAlign: 'center' }]}>{k.priority}</Text>
                <Text style={[s.tdMuted, KL(showEvidenceCol ? '10%' : '16%')]}>{k.assigned_to_name ?? '—'}</Text>
                {showEvidenceCol && (
                  <Text style={[s.td, KL('6%'), { textAlign: 'center', color: (evidenceCounts[k.klo_item_id] ?? 0) === 0 ? '#dc2626' : DARK, fontFamily: (evidenceCounts[k.klo_item_id] ?? 0) === 0 ? 'Helvetica-Bold' : 'Helvetica' }]}>
                    {evidenceCounts[k.klo_item_id] ?? 0}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Actions table ────────────────────────────────────────────────── */}
        {actions.length > 0 && (
          <View>
            <Text style={s.sectionHeading}>Open Actions ({actions.length})</Text>
            <View style={s.tableHeader}>
              <Text style={[s.th, KL('28%')]}>Action</Text>
              <Text style={[s.th, KL('22%')]}>KLOE</Text>
              <Text style={[s.th, KL('10%')]}>Priority</Text>
              <Text style={[s.th, KL('12%')]}>Status</Text>
              <Text style={[s.th, KL('12%')]}>Due</Text>
              <Text style={[s.th, KL('16%')]}>Assigned To</Text>
            </View>
            {actions.map((a, i) => (
              <View key={a.title + i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.td, KL('28%')]}>{a.title}</Text>
                <Text style={[s.tdMuted, KL('22%')]}>{a.klo_title}</Text>
                <Text style={[s.td, KL('10%')]}>{a.priority}</Text>
                <Text style={[s.td, KL('12%')]}>{a.status.replace('_', ' ')}</Text>
                <Text style={[s.td, KL('12%')]}>{formatDate(a.due_date)}</Text>
                <Text style={[s.tdMuted, KL('16%')]}>{a.assigned_to_name ?? '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── HR table (admin only) ────────────────────────────────────────── */}
        {showHr && hrStaff.length > 0 && (
          <View>
            <Text style={s.sectionHeading}>HR Compliance ({hrStaff.length} staff)</Text>
            <View style={s.tableHeader}>
              <Text style={[s.th, KL('22%')]}>Name</Text>
              <Text style={[s.th, KL('18%')]}>Job Title</Text>
              <Text style={[s.th, KL('15%')]}>DBS Next Review</Text>
              <Text style={[s.th, KL('15%')]}>Supervision Due</Text>
              <Text style={[s.th, KL('15%')]}>Appraisal Due</Text>
              <Text style={[s.th, KL('15%')]}>Mandatory Training</Text>
            </View>
            {hrStaff.map((h, i) => (
              <View key={(h.full_name ?? '') + i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.td, KL('22%')]}>{h.full_name ?? '—'}</Text>
                <Text style={[s.tdMuted, KL('18%')]}>{h.job_title ?? '—'}</Text>
                <Text style={[s.td, KL('15%')]}>{formatDate(h.dbs_next_review_due)}</Text>
                <Text style={[s.td, KL('15%')]}>{formatDate(h.supervision_next_due)}</Text>
                <Text style={[s.td, KL('15%')]}>{formatDate(h.appraisal_next_due)}</Text>
                <Text style={[s.td, KL('15%')]}>{h.mandatory_training_complete ? 'Complete' : 'Incomplete'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>AlwaysReady — {orgName}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages} · ${viewLabel} · Generated ${generatedAt}`}
          />
        </View>
      </Page>
    </Document>
  )
}
