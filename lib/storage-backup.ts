/**
 * Nightly mirror of Supabase Storage (evidence, org-logos) into Cloudflare R2, so a
 * catastrophic failure of Supabase itself doesn't also take the only copy of every
 * uploaded evidence file with it. Supabase's own daily backups and point-in-time
 * recovery cover the Postgres database only -- Storage objects are explicitly excluded
 * (Supabase's own docs: "Database backups do not include objects you store via the
 * Storage API") -- so this is the one thing nothing else already protects.
 *
 * Design: R2 has no native S3 bucket versioning, so retention isn't handled by
 * versioning a single mirrored copy. Instead each run uploads a full dated snapshot --
 * every object currently in a Supabase bucket, written under `{YYYY-MM-DD}/{bucket}/...`
 * in R2 -- and a 30-day "delete objects older than 30 days" lifecycle rule (set up once,
 * in the R2 bucket's own settings, not in this code) ages whole dated folders out on its
 * own. No diffing against what R2 already holds and no deleting from R2 here: each
 * night's folder is self-contained, so a file a customer genuinely deleted (or that was
 * erased by the data-deletion cron) simply doesn't appear in tonight's snapshot, and
 * still ages out of the last 30 days of older snapshots naturally -- it isn't kept
 * forever, which matters for a compliance product that promises real deletion.
 *
 * Buckets are organised as {org_id}/{file} (org-logos) or {org_id}/{kloe_id}/{file}
 * (evidence) -- arbitrary depth is handled generically by walking folders recursively,
 * so this doesn't need updating if that structure ever changes.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export interface StorageObjectInfo {
  path: string
  size: number
  updatedAt: string
}

/**
 * Recursively lists every real file (not folder) under a Supabase Storage bucket.
 * Supabase's list() returns one level at a time; an entry with no `id` is a folder
 * (per Supabase's own convention) and needs a further list() call to descend into.
 */
export async function listAllSupabaseObjects(
  supabase: SupabaseClient,
  bucket: string,
  prefix = '',
): Promise<StorageObjectInfo[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 })
  if (error) throw new Error(`storage-backup: list ${bucket}/${prefix} failed: ${error.message}`)

  const results: StorageObjectInfo[] = []
  for (const entry of data ?? []) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.id === null) {
      // A folder -- descend into it.
      results.push(...await listAllSupabaseObjects(supabase, bucket, path))
    } else {
      results.push({
        path,
        size: entry.metadata?.size ?? 0,
        updatedAt: entry.updated_at ?? entry.created_at ?? new Date(0).toISOString(),
      })
    }
  }
  return results
}

/** Today's UTC date as YYYY-MM-DD, used as the snapshot folder name so every bucket in one run lands under the same date. */
export function snapshotDate(now: Date): string {
  return now.toISOString().slice(0, 10)
}

export interface SnapshotBucketResult {
  bucket: string
  uploaded: number
  failed: string[]
}

/** Uploads a complete copy of one Supabase bucket's current contents into `{snapshotDate}/{bucket}/...` in R2. */
export async function snapshotBucketToR2(
  supabase: SupabaseClient,
  s3: S3Client,
  r2Bucket: string,
  supabaseBucket: string,
  date: string,
): Promise<SnapshotBucketResult> {
  const objects = await listAllSupabaseObjects(supabase, supabaseBucket)
  const failed: string[] = []
  let uploaded = 0

  for (const obj of objects) {
    try {
      const { data, error } = await supabase.storage.from(supabaseBucket).download(obj.path)
      if (error || !data) throw new Error(error?.message ?? 'no data returned')
      const bytes = new Uint8Array(await data.arrayBuffer())
      await s3.send(new PutObjectCommand({
        Bucket: r2Bucket,
        Key: `${date}/${supabaseBucket}/${obj.path}`,
        Body: bytes,
        ContentType: data.type || 'application/octet-stream',
      }))
      uploaded++
    } catch (err) {
      console.error(`[storage-backup] upload failed for ${supabaseBucket}/${obj.path}:`, err)
      failed.push(obj.path)
    }
  }

  return { bucket: supabaseBucket, uploaded, failed }
}

/** True when all four R2 environment variables are set. Missing credentials skip cleanly, matching every other optional integration in this codebase (Resend, Cloudmersive, Turnstile). */
export function r2ConfigPresent(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  )
}

export function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}
