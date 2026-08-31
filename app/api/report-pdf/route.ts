/**
 * POST /api/report-pdf
 *
 * Accepts the current report state as JSON and returns a PDF download.
 * Admin only.
 */
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { getCurrentUserProfile } from '@/lib/session'
import { ReportPdfDocument } from './document'
import type { ReportPdfDocumentProps } from './document'

export async function POST(req: NextRequest) {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: ReportPdfDocumentProps
  try {
    body = await req.json() as ReportPdfDocumentProps
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pdf renderToBuffer does not accept the typed ReactElement union
  const buffer = await renderToBuffer(React.createElement(ReportPdfDocument, body) as any)

  const slug = body.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const date = new Date().toISOString().slice(0, 10)
  const filename = `report-${slug}-${date}.pdf`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
