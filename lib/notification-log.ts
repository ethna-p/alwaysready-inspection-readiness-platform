/**
 * Shared idempotency helpers for notification_log.
 *
 * notification_log has a unique index on
 * (organisation_id, notification_type, entity_type, entity_id, due_date,
 * recipient_email) — inserting a row is how a caller "claims" the right to
 * send one specific notification. Relying on the unique constraint (rather
 * than a separate check-then-act SELECT) means the claim is atomic even
 * under genuine concurrency: two overlapping invocations (a redelivered
 * Stripe webhook, two cron runs racing) can both attempt the insert, but
 * only one can ever succeed — the loser's insert fails with Postgres error
 * 23505 (unique violation), which this helper treats as "already sent,
 * nothing to do" rather than an error.
 *
 * This was previously hand-rolled identically at five call sites
 * (app/api/stripe-webhook/route.ts ×2, app/api/cron/trial-emails/route.ts
 * ×3) — extracted here so a future fix to the claim logic only needs making
 * once.
 *
 * Every scheduled email job now claims before it sends (claim, send, release the
 * claim if the send fails), because Vercel can deliver a cron invocation twice and
 * a Hobby-plan job fires anywhere within its hour. Jobs that have no organisation
 * to key on (demo-reminder, waitlist-nurture) use claimCronSlot() instead, which
 * does the same thing against the cron_claims table.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { reportDbError } from '@/lib/db-errors'

export interface NotificationClaimKey {
  organisationId: string
  notificationType: string
  entityType: string
  entityId: string
  dueDate: string
  recipientEmail: string
}

export type ClaimResult =
  | { claimed: true }
  | { claimed: false; reason: 'already_sent' }
  | { claimed: false; reason: 'error'; error: unknown }

/**
 * Atomically claims a notification_log row. Callers should only send the
 * email when `claimed` is true, and should call releaseNotificationClaim()
 * if sending then fails, so a later run can retry.
 *
 * @param context - a short label (e.g. the route/function name) used in the
 *                  error log line if the claim fails for a reason other than
 *                  "already sent".
 */
export async function claimNotification(
  supabase: SupabaseClient,
  key: NotificationClaimKey,
  context: string
): Promise<ClaimResult> {
  const { error } = await supabase.from('notification_log').insert({
    organisation_id:    key.organisationId,
    notification_type:  key.notificationType,
    entity_type:         key.entityType,
    entity_id:           key.entityId,
    due_date:            key.dueDate,
    recipient_email:     key.recipientEmail,
  })

  if (!error) return { claimed: true }
  if (error.code === '23505') return { claimed: false, reason: 'already_sent' }

  console.error(`[${context}] notification_log claim error:`, error)
  return { claimed: false, reason: 'error', error }
}

/**
 * Releases a previously-successful claim — e.g. because sending the email
 * failed — so a later run can retry it instead of the claim silently
 * blocking every future attempt.
 */
export async function releaseNotificationClaim(
  supabase: SupabaseClient,
  key: NotificationClaimKey
): Promise<void> {
  const { error } = await supabase.from('notification_log').delete()
    .eq('organisation_id',   key.organisationId)
    .eq('notification_type', key.notificationType)
    .eq('entity_type',       key.entityType)
    .eq('entity_id',         key.entityId)
    .eq('due_date',          key.dueDate)
    .eq('recipient_email',   key.recipientEmail)
  // If this fails the notification stays claimed and will not be retried. That is the safe
  // direction (never a duplicate), but it must not be silent.
  reportDbError(error, 'notification-log: release claim')
}

export type SendOnceResult =
  | { status: 'sent' }
  | { status: 'opted_out' }
  | { status: 'already_sent' }
  | { status: 'failed'; error: string }

/**
 * Sends one email at most once per claim key.
 *
 * Claims first, sends only if the claim was won, and releases the claim if the send
 * did not go out so a later run can retry. `opted_out` counts as handled (the
 * recipient asked not to receive it, so retrying is pointless); a missing API key or
 * a send error releases the claim.
 */
export async function sendOnce(
  supabase: SupabaseClient,
  key: NotificationClaimKey,
  context: string,
  send: () => Promise<{ sent: boolean; skipped?: 'opted_out' | 'no_api_key'; error?: string }>
): Promise<SendOnceResult> {
  const claim = await claimNotification(supabase, key, context)
  if (!claim.claimed) {
    if (claim.reason === 'already_sent') return { status: 'already_sent' }
    return { status: 'failed', error: 'could not claim notification' }
  }

  let result: Awaited<ReturnType<typeof send>>
  try {
    result = await send()
  } catch (err) {
    await releaseNotificationClaim(supabase, key)
    return { status: 'failed', error: err instanceof Error ? err.message : String(err) }
  }

  if (result.sent) return { status: 'sent' }
  if (result.skipped === 'opted_out') return { status: 'opted_out' }

  await releaseNotificationClaim(supabase, key)
  return { status: 'failed', error: result.error ?? result.skipped ?? 'send failed' }
}

/**
 * Claims a send-once slot in cron_claims for jobs with no organisation.
 * Returns 'claimed' (go ahead), 'already_done' (skip), or 'error' (do not send).
 */
export async function claimCronSlot(
  supabase: SupabaseClient,
  job: string,
  claimKey: string
): Promise<'claimed' | 'already_done' | 'error'> {
  const { error } = await supabase.from('cron_claims').insert({ job, claim_key: claimKey })
  if (!error) return 'claimed'
  if (error.code === '23505') return 'already_done'
  console.error(`[${job}] cron_claims claim error:`, error)
  return 'error'
}

/** Releases a cron_claims slot after a failed send so a later run can retry. */
export async function releaseCronSlot(
  supabase: SupabaseClient,
  job: string,
  claimKey: string
): Promise<void> {
  const { error } = await supabase.from('cron_claims').delete().eq('job', job).eq('claim_key', claimKey)
  reportDbError(error, `${job}: release cron_claims slot`)
}
