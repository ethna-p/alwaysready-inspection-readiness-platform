import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendOnce, claimCronSlot, releaseCronSlot } from '../notification-log'

const key = {
  organisationId: 'org-1',
  notificationType: 'due_soon',
  entityType: 'kloe',
  entityId: 'klo-1',
  dueDate: '2026-10-01',
  recipientEmail: 'a@example.test',
}

/** A minimal stand-in for the two table operations these helpers use. */
function fakeClient(insertError: { code: string } | null = null, deleteError: { code: string } | null = null) {
  const deleted: string[] = []
  const client = {
    from: vi.fn((table: string) => ({
      insert: vi.fn(async () => ({ error: insertError })),
      delete: vi.fn(() => {
        deleted.push(table)
        const c: { eq: () => typeof c; then: (r: (v: unknown) => void) => void } = {
          eq: () => c,
          then: (resolve) => resolve({ error: deleteError }),
        }
        return c
      }),
    })),
  }
  return { client: client as unknown as SupabaseClient, deleted, from: client.from }
}

describe('sendOnce', () => {
  it('sends when the claim is won and keeps the claim', async () => {
    const { client, deleted } = fakeClient()
    const send = vi.fn(async () => ({ sent: true }))
    expect(await sendOnce(client, key, 'test', send)).toEqual({ status: 'sent' })
    expect(send).toHaveBeenCalledTimes(1)
    expect(deleted).toEqual([])
  })

  it('does not send when another run already claimed it', async () => {
    const { client } = fakeClient({ code: '23505' })
    const send = vi.fn(async () => ({ sent: true }))
    expect(await sendOnce(client, key, 'test', send)).toEqual({ status: 'already_sent' })
    expect(send).not.toHaveBeenCalled()
  })

  it('does not send when the claim itself fails for another reason', async () => {
    const { client } = fakeClient({ code: '08006' })
    const send = vi.fn(async () => ({ sent: true }))
    const r = await sendOnce(client, key, 'test', send)
    expect(r.status).toBe('failed')
    expect(send).not.toHaveBeenCalled()
  })

  it('releases the claim when the send reports failure', async () => {
    const { client, deleted } = fakeClient()
    const r = await sendOnce(client, key, 'test', async () => ({ sent: false, error: 'boom' }))
    expect(r).toEqual({ status: 'failed', error: 'boom' })
    expect(deleted).toEqual(['notification_log'])
  })

  it('releases the claim when the send throws', async () => {
    const { client, deleted } = fakeClient()
    const r = await sendOnce(client, key, 'test', async () => { throw new Error('network') })
    expect(r).toEqual({ status: 'failed', error: 'network' })
    expect(deleted).toEqual(['notification_log'])
  })

  it('releases the claim when no API key is configured, so a later run can send', async () => {
    const { client, deleted } = fakeClient()
    const r = await sendOnce(client, key, 'test', async () => ({ sent: false, skipped: 'no_api_key' }))
    expect(r.status).toBe('failed')
    expect(deleted).toEqual(['notification_log'])
  })

  it('keeps the claim for an opted-out recipient (nothing to retry)', async () => {
    const { client, deleted } = fakeClient()
    const r = await sendOnce(client, key, 'test', async () => ({ sent: false, skipped: 'opted_out' }))
    expect(r).toEqual({ status: 'opted_out' })
    expect(deleted).toEqual([])
  })
})

describe('claimCronSlot / releaseCronSlot', () => {
  it('claims a free slot', async () => {
    const { client } = fakeClient()
    expect(await claimCronSlot(client, 'job', 'k')).toBe('claimed')
  })

  it('reports an already-claimed slot', async () => {
    const { client } = fakeClient({ code: '23505' })
    expect(await claimCronSlot(client, 'job', 'k')).toBe('already_done')
  })

  it('reports a database error so the job does not send', async () => {
    const { client } = fakeClient({ code: '08006' })
    expect(await claimCronSlot(client, 'job', 'k')).toBe('error')
  })

  it('release deletes from cron_claims', async () => {
    const { client, deleted } = fakeClient()
    await releaseCronSlot(client, 'job', 'k')
    expect(deleted).toEqual(['cron_claims'])
  })
})
