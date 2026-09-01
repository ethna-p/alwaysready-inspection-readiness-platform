/**
 * GET /api/cron/trial-emails
 *
 * Nightly cron (08:30 UTC daily) that sends the trial lifecycle email sequence
 * to every active trial organisation.
 *
 * Email schedule (keyed by days elapsed since trial start):
 *   Day  1 — Welcome to AlwaysReady
 *   Day  3 — Three things worth exploring
 *   Day  5 — How are you getting on?
 *   Day  7 — Halfway through your trial
 *   Day  9 — A few things you might not have tried yet
 *   Day 11 — Your trial ends in 3 days
 *   Day 13 — Your trial ends tomorrow
 *
 * Day 14a (converted) and 14b (lapsed) are triggered by Stripe webhooks, not here.
 *
 * Protected by CRON_SECRET (Vercel sends this automatically for registered crons).
 * Uses notification_log for idempotency — each email fires at most once per
 * organisation per day-key per trial_expires_at anchor.
 *
 * Email definitions live in lib/trial-emails.ts.
 */

import 'server-only'
import { NextResponse }      from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail }         from '@/lib/email'
import { getFirstName }      from '@/lib/utils/name'
import {
  TRIAL_EMAILS,
  USER_EMAILS,
  formatDate,
  daysElapsed,
  type WizardStatus,
} from '@/lib/trial-emails'
import { PLATFORM_URL } from '@/lib/config'

// ── Cron handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret     = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today    = new Date()
  today.setHours(0, 0, 0, 0)

  let emailsSent    = 0
  let emailsSkipped = 0
  const errors: string[] = []

  // Fetch all active trial orgs
  const { data: orgs, error: orgsError } = await supabase
    .from('organisations')
    .select('id, name, subscription_tier, trial_expires_at, is_charity')
    .eq('subscription_tier', 'trial')
    .not('trial_expires_at', 'is', null)

  if (orgsError || !orgs) {
    console.error('[trial-emails] Failed to fetch orgs:', orgsError)
    return NextResponse.json({ error: 'Failed to fetch organisations' }, { status: 500 })
  }

  for (const org of orgs) {
    if (!org.trial_expires_at) continue

    // Skip orgs whose trial has already expired (past day 14)
    const elapsed = daysElapsed(org.trial_expires_at, today)
    if (elapsed < 0 || elapsed > 13) continue

    // Find which email to send today, if any
    const emailDef = TRIAL_EMAILS.find(e => e.dayIndex === elapsed)
    if (!emailDef) continue

    // Fetch the admin user for this org
    const { data: admins } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')

    if (!admins || admins.length === 0) continue

    const expiryDate = formatDate(org.trial_expires_at)
    // Charities pay £50, everyone else pays £75
    const price      = org.is_charity ? '£50' : '£75'
    const dueDateKey = org.trial_expires_at.split('T')[0]

    for (const admin of admins) {
      if (!admin.email) continue

      const firstName = getFirstName(admin.full_name)

      // Claim the slot atomically — insert into notification_log first.
      // The unique index prevents a second concurrent cron run from also sending.
      const { error: logClaimError } = await supabase.from('notification_log').insert({
        organisation_id:   org.id,
        notification_type: 'trial_day',
        entity_type:       'trial',
        entity_id:         emailDef.dayKey,
        due_date:          dueDateKey,
        recipient_email:   admin.email,
      })
      if (logClaimError) {
        if (logClaimError.code === '23505') { emailsSkipped++; continue } // already sent
        console.error(`[trial-emails] notification_log claim error:`, logClaimError)
        errors.push(`${emailDef.dayKey} → ${admin.email}: log claim failed`); continue
      }

      // For day_07, query the org's actual wizard status to personalise the checklist
      let wizard: WizardStatus | undefined
      if (emailDef.dayKey === 'day_07') {
        const [kloeRes, evidenceRes, teamRes, hrRes] = await Promise.all([
          supabase.from('compliance_records').select('id').eq('organisation_id', org.id).not('status', 'is', null).limit(1),
          supabase.from('kloe_evidence').select('id').eq('organisation_id', org.id).limit(1),
          supabase.from('users').select('id').eq('organisation_id', org.id).limit(2),
          supabase.from('hr_staff_profiles').select('id').eq('organisation_id', org.id).limit(1),
        ])
        wizard = {
          hasKloeRating:  (kloeRes.data?.length     ?? 0) > 0,
          hasEvidence:    (evidenceRes.data?.length  ?? 0) > 0,
          hasTeamMember:  (teamRes.data?.length      ?? 0) > 1,
          hasHrRecord:    (hrRes.data?.length        ?? 0) > 0,
        }
      }

      const bodyHtml = emailDef.bodyHtml(firstName, expiryDate, price, wizard)

      const result = await sendEmail({
        to:       admin.email,
        subject:  emailDef.subject,
        bodyHtml,
        type:     emailDef.isMarketing ? 'marketing' : 'transactional',
        ...(emailDef.isMarketing ? { userId: admin.id } : {}),
      })

      if (result.sent) {
        emailsSent++
        console.log(`[trial-emails] Sent ${emailDef.dayKey} to ${admin.email} (${org.name})`)
      } else {
        // Sending failed — release the claim so the next cron run can retry
        await supabase.from('notification_log').delete()
          .eq('organisation_id', org.id).eq('notification_type', 'trial_day')
          .eq('entity_type', 'trial').eq('entity_id', emailDef.dayKey)
          .eq('due_date', dueDateKey).eq('recipient_email', admin.email)
        errors.push(`${emailDef.dayKey} → ${admin.email}: ${result.error ?? result.skipped}`)
      }
    }
  }

  // ── Day 14b — trial lapsed ────────────────────────────────────────────────
  // Find orgs whose trial expired yesterday and who never subscribed.
  // (If they subscribed, subscription_tier would have been set to 'active' by
  // the Stripe webhook; if it's still 'trial' they quietly lapsed.)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const { data: lapsedOrgs } = await supabase
    .from('organisations')
    .select('id, name, is_charity')
    .eq('subscription_tier', 'trial')
    .neq('is_tester', true)
    .gte('trial_expires_at', `${yesterdayStr}T00:00:00.000Z`)
    .lt('trial_expires_at',  `${yesterdayStr}T23:59:59.999Z`)

  for (const org of lapsedOrgs ?? []) {
    // Set data_deletion_due_at (idempotent — only if not already set)
    const trialDeletionDue = new Date()
    trialDeletionDue.setDate(trialDeletionDue.getDate() + 30)
    await supabase
      .from('organisations')
      .update({ data_deletion_due_at: trialDeletionDue.toISOString() })
      .eq('id', org.id)
      .is('data_deletion_due_at', null)   // don't overwrite if already set

    const { data: admins } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')

    for (const admin of admins ?? []) {
      if (!admin.email) continue

      // Claim atomically — insert first, send only if the claim succeeds
      const { error: logClaim14b } = await supabase.from('notification_log').insert({
        organisation_id:   org.id,
        notification_type: 'trial_day',
        entity_type:       'trial',
        entity_id:         'day_14b',
        due_date:          yesterdayStr,
        recipient_email:   admin.email,
      })
      if (logClaim14b) {
        if (logClaim14b.code === '23505') { emailsSkipped++; continue }
        console.error('[trial-emails] day_14b log claim error:', logClaim14b)
        errors.push(`day_14b → ${admin.email}: log claim failed`); continue
      }

      const firstName    = getFirstName(admin.full_name)
      const expiryDate   = formatDate(`${yesterdayStr}T00:00:00Z`)
      const deletionDate = formatDate(trialDeletionDue.toISOString())
      const upgradeUrl   = `${PLATFORM_URL}/upgrade`

      const result = await sendEmail({
        to:      admin.email,
        subject: 'Your AlwaysReady trial has ended',
        type:    'transactional',
        bodyHtml: `
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            Your AlwaysReady trial ended on ${expiryDate}. The KLOEs you rated, evidence you
            uploaded, and any HR records or team settings you created are all still there —
            exactly as you left them.
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            Your data is available to download until <strong>${deletionDate}</strong>, after
            which it will be permanently deleted. If you'd like to keep access and continue
            building your inspection readiness, subscribing takes less than two minutes —
            everything carries over immediately.
          </p>
          <p style="margin:0 0 32px">
            <a href="${upgradeUrl}"
               style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
              Subscribe and continue &rarr;
            </a>
          </p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
            If there's anything we could have done better, we'd genuinely welcome hearing from
            you — just reply to this email. Whatever you decide, thank you for taking the time
            to try AlwaysReady.
          </p>
        `,
      })

      if (result.sent) {
        emailsSent++
        console.log(`[trial-emails] Sent day_14b to ${admin.email} (${org.name})`)
      } else {
        await supabase.from('notification_log').delete()
          .eq('organisation_id', org.id).eq('notification_type', 'trial_day')
          .eq('entity_type', 'trial').eq('entity_id', 'day_14b')
          .eq('due_date', yesterdayStr).eq('recipient_email', admin.email)
        errors.push(`day_14b → ${admin.email}: ${result.error ?? result.skipped}`)
      }
    }
  }

  // ── User onboarding emails ──────────────────────────────────────────────────
  // Sent to role='user' accounts based on days since their created_at.
  // Runs for all orgs (trial and active) so newly invited users always get onboarded.

  const { data: allUsers } = await supabase
    .from('users')
    .select('id, email, full_name, organisation_id, created_at')
    .eq('role', 'user')
    .not('email', 'is', null)
    .not('created_at', 'is', null)

  for (const usr of allUsers ?? []) {
    if (!usr.email || !usr.organisation_id || !usr.created_at) continue

    const userCreated = new Date(usr.created_at)
    userCreated.setHours(0, 0, 0, 0)
    const daysSinceJoining = Math.floor((today.getTime() - userCreated.getTime()) / (24 * 60 * 60 * 1000))

    const emailDef = USER_EMAILS.find(e => e.dayIndex === daysSinceJoining)
    if (!emailDef) continue

    // Fetch org name
    const { data: org } = await supabase
      .from('organisations')
      .select('name')
      .eq('id', usr.organisation_id)
      .single()

    const firstName  = getFirstName(usr.full_name)
    const orgName    = org?.name ?? 'your organisation'
    const dueDateKey = today.toISOString().split('T')[0]

    // Claim atomically — insert first, send only if the claim succeeds
    const { error: logClaimUser } = await supabase.from('notification_log').insert({
      organisation_id:   usr.organisation_id,
      notification_type: 'user_onboarding',
      entity_type:       'user',
      entity_id:         emailDef.dayKey,
      due_date:          dueDateKey,
      recipient_email:   usr.email,
    })
    if (logClaimUser) {
      if (logClaimUser.code === '23505') { emailsSkipped++; continue }
      console.error('[trial-emails] user_onboarding log claim error:', logClaimUser)
      errors.push(`${emailDef.dayKey} → ${usr.email}: log claim failed`); continue
    }

    const result = await sendEmail({
      to:       usr.email,
      subject:  emailDef.subject,
      bodyHtml: emailDef.bodyHtml(firstName, orgName),
      type:     'transactional',
    })

    if (result.sent) {
      emailsSent++
      console.log(`[trial-emails] Sent ${emailDef.dayKey} to ${usr.email} (${orgName})`)
    } else {
      await supabase.from('notification_log').delete()
        .eq('organisation_id', usr.organisation_id).eq('notification_type', 'user_onboarding')
        .eq('entity_type', 'user').eq('entity_id', emailDef.dayKey)
        .eq('due_date', dueDateKey).eq('recipient_email', usr.email)
      errors.push(`${emailDef.dayKey} → ${usr.email}: ${result.error ?? result.skipped}`)
    }
  }

  console.log(`[trial-emails] sent=${emailsSent} skipped=${emailsSkipped} errors=${errors.length}`)
  if (errors.length > 0) console.error('[trial-emails] errors:', errors)

  return NextResponse.json({
    ok:      true,
    sent:    emailsSent,
    skipped: emailsSkipped,
    errors:  errors.length > 0 ? errors : undefined,
  })
}
