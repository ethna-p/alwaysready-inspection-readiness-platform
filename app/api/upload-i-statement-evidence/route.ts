/**
 * POST /api/upload-i-statement-evidence
 *
 * Secure file upload pipeline for "I" statement evidence files:
 *   1. Authenticate the request (Supabase session cookie)
 *   2. Validate file size and MIME type via magic-byte inspection (file-type)
 *   3. Scan for malware via Cloudmersive Virus Scan API
 *   4. Upload clean file to Supabase Storage using service role key
 *   5. Return the storage path for the client to save as a metadata record
 *
 * Files are stored in the existing `evidence` bucket under:
 *   {org_id}/i-statements/{i_statement_id}/{timestamp}-{filename}
 *
 * Governance: governance/policy documents only — no clinical records.
 */

import { NextRequest, NextResponse } from 'next/server'
import { fileTypeFromBuffer } from 'file-type'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
])

const OOXML_MIME = 'application/zip'

async function scanWithCloudmersive(buffer: Buffer, fileName: string): Promise<{ clean: boolean; message: string }> {
  const apiKey = process.env.CLOUDMERSIVE_API_KEY
  if (!apiKey) {
    console.warn('[upload-i-statement-evidence] CLOUDMERSIVE_API_KEY not set — skipping virus scan')
    return { clean: true, message: 'Scan skipped (not configured)' }
  }

  try {
    const form = new FormData()
    form.append('inputFile', new Blob([new Uint8Array(buffer)]), fileName)

    const response = await fetch('https://api.cloudmersive.com/virus/scan/file', {
      method: 'POST',
      headers: { Apikey: apiKey },
      body: form,
    })

    if (!response.ok) {
      console.error('[upload-i-statement-evidence] Cloudmersive returned', response.status)
      return { clean: true, message: `Scan service error: ${response.status}` }
    }

    const result = await response.json() as { CleanResult: boolean; FoundViruses: unknown[] | null }
    if (!result.CleanResult) {
      return { clean: false, message: 'File failed virus scan and was rejected.' }
    }

    return { clean: true, message: 'Clean' }
  } catch (err) {
    console.error('[upload-i-statement-evidence] Cloudmersive scan failed:', err)
    return { clean: true, message: 'Scan network error — skipped' }
  }
}

export async function POST(request: NextRequest) {
  // ── 1. Authenticate ───────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, organisation_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'user'].includes(profile.role)) {
    return NextResponse.json({ error: 'You do not have permission to upload files.' }, { status: 403 })
  }

  // ── 2. Parse multipart form ───────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const file          = formData.get('file')          as File | null
  const iStatementId  = formData.get('iStatementId')  as string | null

  if (!file || !iStatementId) {
    return NextResponse.json({ error: 'Missing file or statement ID.' }, { status: 400 })
  }

  // Validate iStatementId is a proper UUID to prevent path traversal in storage
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_REGEX.test(iStatementId)) {
    return NextResponse.json({ error: 'Invalid statement ID.' }, { status: 400 })
  }

  // ── 3. Size check ─────────────────────────────────────────────────────────
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File is too large. Maximum size is 10 MB.' }, { status: 400 })
  }

  // ── 4. MIME validation via magic bytes ────────────────────────────────────
  const buffer   = Buffer.from(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(buffer)

  let actualMime = detected?.mime ?? ''
  if (actualMime === OOXML_MIME) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'docx') actualMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else if (ext === 'xlsx') actualMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }

  if (!ALLOWED_MIME_TYPES.has(actualMime)) {
    console.warn(`[upload-i-statement-evidence] Rejected: reported=${file.type} detected=${detected?.mime} resolved=${actualMime}`)
    return NextResponse.json(
      { error: 'File type not accepted. Please upload a PDF, Word (.docx), Excel (.xlsx), JPG, or PNG.' },
      { status: 400 }
    )
  }

  // ── 5. Virus scan ─────────────────────────────────────────────────────────
  const scan = await scanWithCloudmersive(buffer, file.name)
  if (!scan.clean) {
    console.warn(`[upload-i-statement-evidence] Virus detected in upload by user ${user.id}: ${file.name}`)
    return NextResponse.json({ error: scan.message }, { status: 400 })
  }

  // ── 6. Upload to Supabase Storage ─────────────────────────────────────────
  const adminSupabase = createAdminClient()
  const safeName      = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath   = `${profile.organisation_id}/i-statements/${iStatementId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await adminSupabase.storage
    .from('evidence')
    .upload(storagePath, new Uint8Array(buffer), {
      contentType: actualMime,
      upsert: false,
    })

  if (uploadError) {
    console.error('[upload-i-statement-evidence] Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({
    storagePath,
    fileName:   file.name,
    fileSize:   file.size,
    mimeType:   actualMime,
    scanStatus: scan.message === 'Clean' ? 'clean' : 'skipped',
  })
}
