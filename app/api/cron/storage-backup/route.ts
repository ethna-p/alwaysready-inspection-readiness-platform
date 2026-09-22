/**
 * GET /api/cron/storage-backup
 *
 * Nightly cron (04:00 UTC) that writes a complete dated snapshot of both Supabase
 * Storage buckets (evidence, org-logos) into a Cloudflare R2 bucket, under
 * `{YYYY-MM-DD}/{bucket}/...`. See lib/storage-backup.ts for the full reasoning:
 * Supabase's own backups and point-in-time recovery cover the database only, never
 * Storage objects, so this is the one thing nothing else protects. Retention is a
 * 30-day "delete objects older than 30 days" lifecycle rule configured on the R2
 * bucket itself, not in this code -- each night's folder just ages out on its own.
 *
 * Skips cleanly (200, sent: false) when the four R2_* environment variables aren't
 * configured, the same pattern every other optional integration in this codebase
 * follows (Resend, Cloudmersive, Turnstile) -- a missing key is never a hard failure.
 *
 * Protected by CRON_SECRET (Vercel sends this automatically for registered crons).
 */
import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/utils/cron'
import { withHeartbeat } from '@/lib/cron-health'
import { r2ConfigPresent, createR2Client, snapshotBucketToR2, snapshotDate } from '@/lib/storage-backup'

const BUCKETS = ['evidence', 'org-logos']

async function handler(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (!r2ConfigPresent()) {
    console.warn('[storage-backup] R2 environment variables not configured, skipping.')
    return NextResponse.json({ ok: true, sent: false, reason: 'R2 not configured' })
  }

  const supabase = createAdminClient()
  const s3 = createR2Client()
  const r2Bucket = process.env.R2_BUCKET_NAME!
  const date = snapshotDate(new Date())

  const results = []
  for (const bucket of BUCKETS) {
    try {
      results.push(await snapshotBucketToR2(supabase, s3, r2Bucket, bucket, date))
    } catch (err) {
      console.error(`[storage-backup] bucket ${bucket} failed entirely:`, err)
      results.push({ bucket, uploaded: 0, failed: ['(whole bucket failed)'] })
    }
  }

  const anyFailed = results.some(r => r.failed.length > 0)
  console.log('[storage-backup] run complete:', JSON.stringify(results))

  // A non-2xx status here is what actually matters: withHeartbeat only stamps
  // success on a 2xx response, it never looks inside the JSON body. A partial
  // failure must show up as unhealthy, not silently record a clean heartbeat.
  return NextResponse.json({ ok: !anyFailed, sent: true, results }, { status: anyFailed ? 500 : 200 })
}

export const GET = withHeartbeat('storage-backup', handler, createAdminClient)
