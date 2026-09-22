import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { S3Client } from '@aws-sdk/client-s3'
import {
  listAllSupabaseObjects,
  snapshotDate,
  snapshotBucketToR2,
  r2ConfigPresent,
} from '../storage-backup'

/** A minimal stand-in for the list()/download() calls this module uses. */
function fakeSupabase(tree: Record<string, { id: string | null; name: string; updated_at?: string; metadata?: { size: number } }[]>) {
  const client = {
    storage: {
      from: () => ({
        list: vi.fn(async (prefix: string) => ({ data: tree[prefix] ?? [], error: null })),
        download: vi.fn(async (path: string) => ({
          data: { type: 'application/octet-stream', arrayBuffer: async () => new TextEncoder().encode(`content:${path}`).buffer },
          error: null,
        })),
      }),
    },
  }
  return client as unknown as SupabaseClient
}

/** A minimal stand-in for S3Client.send, recording every command it receives. */
function fakeS3() {
  const sent: { constructor: { name: string }; input: Record<string, unknown> }[] = []
  const client = { send: vi.fn(async (command) => { sent.push(command); return {} }) }
  return { client: client as unknown as S3Client, sent }
}

describe('listAllSupabaseObjects', () => {
  it('lists flat files at the top level', async () => {
    const supabase = fakeSupabase({
      '': [{ id: 'a1', name: 'file1.png', metadata: { size: 100 }, updated_at: '2026-09-01T00:00:00Z' }],
    })
    const result = await listAllSupabaseObjects(supabase, 'org-logos')
    expect(result).toEqual([{ path: 'file1.png', size: 100, updatedAt: '2026-09-01T00:00:00Z' }])
  })

  it('descends recursively into folders (entries with a null id)', async () => {
    const supabase = fakeSupabase({
      '': [{ id: null, name: 'org-1' }],
      'org-1': [{ id: null, name: 'kloe-1' }],
      'org-1/kloe-1': [{ id: 'f1', name: 'evidence.pdf', metadata: { size: 500 }, updated_at: '2026-09-02T00:00:00Z' }],
    })
    const result = await listAllSupabaseObjects(supabase, 'evidence')
    expect(result).toEqual([{ path: 'org-1/kloe-1/evidence.pdf', size: 500, updatedAt: '2026-09-02T00:00:00Z' }])
  })

  it('defaults missing size/timestamp fields rather than throwing', async () => {
    const supabase = fakeSupabase({ '': [{ id: 'f1', name: 'no-metadata.png' }] })
    const result = await listAllSupabaseObjects(supabase, 'org-logos')
    expect(result[0].size).toBe(0)
    expect(result[0].path).toBe('no-metadata.png')
  })

  it('throws with a descriptive message when the list call errors', async () => {
    const supabase = {
      storage: { from: () => ({ list: vi.fn(async () => ({ data: null, error: { message: 'bucket not found' } })) }) },
    } as unknown as SupabaseClient
    await expect(listAllSupabaseObjects(supabase, 'evidence')).rejects.toThrow('bucket not found')
  })
})

describe('snapshotDate', () => {
  it('formats as YYYY-MM-DD in UTC', () => {
    expect(snapshotDate(new Date('2026-09-22T23:59:00Z'))).toBe('2026-09-22')
  })
})

describe('snapshotBucketToR2', () => {
  it('uploads every object under {date}/{bucket}/{path} and reports the count', async () => {
    const supabase = fakeSupabase({
      '': [{ id: 'a1', name: 'logo.png', metadata: { size: 10 }, updated_at: '2026-09-01T00:00:00Z' }],
    })
    const { client: s3, sent } = fakeS3()
    const result = await snapshotBucketToR2(supabase, s3, 'my-r2-bucket', 'org-logos', '2026-09-22')

    expect(result).toEqual({ bucket: 'org-logos', uploaded: 1, failed: [] })
    expect(sent).toHaveLength(1)
    expect(sent[0].input).toMatchObject({
      Bucket: 'my-r2-bucket',
      Key: '2026-09-22/org-logos/logo.png',
    })
  })

  it('records a failed path without throwing when a download fails', async () => {
    const supabase = {
      storage: {
        from: () => ({
          list: vi.fn(async () => ({ data: [{ id: 'a1', name: 'broken.png', metadata: { size: 10 } }], error: null })),
          download: vi.fn(async () => ({ data: null, error: { message: 'not found' } })),
        }),
      },
    } as unknown as SupabaseClient
    const { client: s3, sent } = fakeS3()
    const result = await snapshotBucketToR2(supabase, s3, 'my-r2-bucket', 'org-logos', '2026-09-22')

    expect(result).toEqual({ bucket: 'org-logos', uploaded: 0, failed: ['broken.png'] })
    expect(sent).toHaveLength(0)
  })

  it('uploads nothing and reports zero when the bucket is empty', async () => {
    const supabase = fakeSupabase({ '': [] })
    const { client: s3, sent } = fakeS3()
    const result = await snapshotBucketToR2(supabase, s3, 'my-r2-bucket', 'evidence', '2026-09-22')
    expect(result).toEqual({ bucket: 'evidence', uploaded: 0, failed: [] })
    expect(sent).toHaveLength(0)
  })
})

describe('r2ConfigPresent', () => {
  const keys = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'] as const
  const originals: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of keys) { originals[k] = process.env[k]; delete process.env[k] }
  })
  afterEach(() => {
    for (const k of keys) {
      if (originals[k] === undefined) delete process.env[k]
      else process.env[k] = originals[k]
    }
  })

  it('is false when none are set', () => {
    expect(r2ConfigPresent()).toBe(false)
  })

  it('is false when only some are set', () => {
    process.env.R2_ACCOUNT_ID = 'acc'
    process.env.R2_ACCESS_KEY_ID = 'key'
    expect(r2ConfigPresent()).toBe(false)
  })

  it('is true when all four are set', () => {
    for (const k of keys) process.env[k] = 'value'
    expect(r2ConfigPresent()).toBe(true)
  })
})
