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
 * Some cron routes (data-deletion, review-reminders, onboarding-emails,
 * governance-digest) use a different, non-atomic check-then-send-then-record
 * idiom instead (SELECT to check, send, INSERT only after success) — that's
 * a deliberate, different tradeoff for those single-invocation cron jobs,
 * not the same duplication, and is left as-is here.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

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
  await supabase.from('notification_log').delete()
    .eq('organisation_id',   key.organisationId)
    .eq('notification_type', key.notificationType)
    .eq('entity_type',       key.entityType)
    .eq('entity_id',         key.entityId)
    .eq('due_date',          key.dueDate)
    .eq('recipient_email',   key.recipientEmail)
}
