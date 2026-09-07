/**
 * Shared upload validation and malware scanning.
 *
 * Single authoritative implementation used by all file upload routes.
 * Import these helpers instead of defining local copies — differences
 * between copies can cause one route to accept files or scanner errors
 * that another correctly rejects.
 */

import { fileTypeFromBuffer } from 'file-type'

// ── Constants ─────────────────────────────────────────────────────────────────

export const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

// Allowed MIME types determined via magic-byte inspection.
// Legacy .doc and .xls are intentionally excluded — those formats support
// VBA macros and represent a meaningfully higher malware risk than the
// modern Open XML equivalents (.docx, .xlsx).
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
])

// file-type returns this for Office Open XML formats — distinguished by extension below.
const OOXML_MIME = 'application/zip'

// ── MIME validation ───────────────────────────────────────────────────────────

export type MimeValidationResult =
  | { ok: true; actualMime: string }
  | { ok: false; error: string }

/**
 * Validates a file buffer's MIME type via magic-byte inspection.
 * Returns the resolved MIME type on success, or an error string on failure.
 *
 * @param buffer   - The file contents as a Buffer.
 * @param fileName - The original filename (used to distinguish .docx vs .xlsx).
 */
export async function validateFileMime(
  buffer: Buffer,
  fileName: string
): Promise<MimeValidationResult> {
  const detected = await fileTypeFromBuffer(buffer)
  let actualMime = detected?.mime ?? ''

  // Office Open XML (.docx, .xlsx) are ZIP files — use extension to distinguish.
  if (actualMime === OOXML_MIME) {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'docx') {
      actualMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (ext === 'xlsx') {
      actualMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }

  if (!ALLOWED_MIME_TYPES.has(actualMime)) {
    return { ok: false, error: 'File type not accepted. Please upload a PDF, Word (.docx), Excel (.xlsx), JPG, or PNG.' }
  }

  return { ok: true, actualMime }
}

// ── Malware scanning ──────────────────────────────────────────────────────────

export type ScanResult =
  | { clean: true }
  | { clean: false; message: string }

/**
 * Scans a file buffer for malware using the Cloudmersive Virus Scan API.
 *
 * Fails closed on every error condition — a missing API key, a non-2xx
 * response, or a network error all return clean: false. Uploads must never
 * bypass the malware check due to a misconfiguration or transient failure.
 *
 * @param buffer   - The file contents as a Buffer.
 * @param fileName - The original filename (sent to the scan API).
 * @param context  - Short identifier used in error log messages (e.g. '[upload-evidence]').
 */
export async function scanWithCloudmersive(
  buffer: Buffer,
  fileName: string,
  context = '[upload]'
): Promise<ScanResult> {
  const apiKey = process.env.CLOUDMERSIVE_API_KEY
  if (!apiKey) {
    console.error(`${context} CLOUDMERSIVE_API_KEY not set — rejecting upload (fail closed)`)
    return { clean: false, message: 'File scanning is unavailable. Please try again later or contact support.' }
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
      console.error(`${context} Cloudmersive returned ${response.status} — rejecting upload (fail closed)`)
      return { clean: false, message: 'File scanning is temporarily unavailable. Please try again later.' }
    }

    const result = await response.json() as { CleanResult: boolean; FoundViruses: unknown[] | null }
    if (!result.CleanResult) {
      return { clean: false, message: 'File failed virus scan and was rejected.' }
    }

    return { clean: true }
  } catch (err) {
    console.error(`${context} Cloudmersive scan failed:`, err, '— rejecting upload (fail closed)')
    return { clean: false, message: 'File scanning is temporarily unavailable. Please try again later.' }
  }
}
