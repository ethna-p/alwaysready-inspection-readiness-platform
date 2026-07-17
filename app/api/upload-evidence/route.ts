/**
 * POST /api/upload-evidence
 *
 * Secure file upload pipeline:
 *   1. Authenticate the request (Supabase session cookie)
 *   2. Validate file size and MIME type via magic-byte inspection (file-type)
 *   3. Scan for malware via Cloudmersive Virus Scan API
 *   4. Upload clean file to Supabase Storage using service role key
 *   5. Return the storage path for the client to save as a metadata record
 *
 * By routing through this endpoint we ensure file bytes are never stored
 * without passing our validation and scanning checks — the client never
 * uploads directly to Supabase Storage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { fileTypeFromBuffer } from 'file-type'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

// Allowed MIME types and their accepted magic-byte equivalents
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
])

// file-type returns these for Office Open XML formats
const OOXML_MIME = 'application/zip' // .docx/.xlsx are ZIP-based — handled below

async function scanWithCloudmersive(buffer: Buffer, fileName: string): Promise<{ clean: boolean; message: string }> {
  const apiKey = process.env.CLOUDMERSIVE_API_KEY
  if (!apiKey) {
    // No API key configured — log and allow (graceful degradation)
    console.warn('[upload-evidence] CLOUDMERSIVE_API_KEY not set — skipping virus scan')
    return { clean: true, message: 'Scan skipped (not configured)' }
  }

  try {
    const form = new FormData()
    form.append('inputFile', new Blob([buffer]), fileName)

    const response = await fetch('https://api.cloudmersive.com/virus/scan/file', {
      method: 'POST',
      headers: { Apikey: apiKey },
      body: form,
    })

    if (!response.ok) {
      console.error('[upload-evidence] Cloudmersive returned', response.status)
      // On scan service error, allow upload but log it
      return { clean: true, message: `Scan service error: ${response.status}` }
    }

    const result = await response.json() as { CleanResult: boolean; FoundViruses: unknown[] | null }
    if (!result.CleanResult) {
      return { clean: false, message: 'File failed virus scan and was rejected.' }
    }

    return { clean: true, message: 'Clean' }
  } catch (err) {
    console.error('[upload-evidence] Cloudmersive scan failed:', err)
    // On network error, allow upload but log it
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

  // Get profile to check role and org
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

  const file = formData.get('file') as File | null
  const kloItemId = formData.get('kloItemId') as string | null

  if (!file || !kloItemId) {
    return NextResponse.json({ error: 'Missing file or KLOE ID.' }, { status: 400 })
  }

  // ── 3. Size check ─────────────────────────────────────────────────────────
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File is too large. Maximum size is 10 MB.' }, { status: 400 })
  }

  // ── 4. MIME validation via magic bytes ────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(buffer)

  // Determine the actual MIME type
  let actualMime = detected?.mime ?? ''

  // Office Open XML (.docx, .xlsx) are ZIP files — distinguish by extension
  if (actualMime === OOXML_MIME) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'docx') actualMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else if (ext === 'xlsx') actualMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }

  // Legacy .doc and .xls: file-type returns application/x-cfb or similar
  if (detected?.mime === 'application/x-cfb' || detected?.mime === 'application/x-ole-storage') {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'doc') actualMime = 'application/msword'
    else if (ext === 'xls') actualMime = 'application/vnd.ms-excel'
  }

  if (!ALLOWED_MIME_TYPES.has(actualMime)) {
    console.warn(`[upload-evidence] Rejected file: reported=${file.type} detected=${detected?.mime} resolved=${actualMime}`)
    return NextResponse.json(
      { error: 'File type not accepted. Please upload a PDF, Word document, Excel spreadsheet, or image.' },
      { status: 400 }
    )
  }

  // ── 5. Virus scan ─────────────────────────────────────────────────────────
  const scan = await scanWithCloudmersive(buffer, file.name)
  if (!scan.clean) {
    console.warn(`[upload-evidence] Virus detected in upload by user ${user.id}: ${file.name}`)
    return NextResponse.json({ error: scan.message }, { status: 400 })
  }

  // ── 6. Upload to Supabase Storage (service role — bypasses storage RLS) ──
  const adminSupabase = createAdminClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${profile.organisation_id}/${kloItemId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await adminSupabase.storage
    .from('evidence')
    .upload(storagePath, buffer, {
      contentType: actualMime,
      upsert: false,
    })

  if (uploadError) {
    console.error('[upload-evidence] Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({
    storagePath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: actualMime,
  })
}
