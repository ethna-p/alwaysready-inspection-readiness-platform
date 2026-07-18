'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export interface BroadcastResult {
  sent: number
  skipped: number
  error?: string
}

/**
 * Returns the total number of eligible broadcast recipients:
 * - Platform admin users (non-demo orgs, not opted out, real email address)
 * - Blog subscribers (not unsubscribed)
 */
export async function getRecipientCount(): Promise<number> {
  const supabase = createAdminClient()

  const [usersResult, subscribersResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, organisations!inner(is_demo)')
      .eq('role', 'admin')
      .eq('marketing_opt_out', false)
      .eq('organisations.is_demo', false),
    supabase
      .from('blog_subscribers')
      .select('id')
      .is('unsubscribed_at', null),
  ])

  const userCount = (usersResult.data ?? [])
    .filter(u => !u.email.endsWith('@staff.alwaysready.uk')).length

  const subscriberCount = (subscribersResult.data ?? []).length

  return userCount + subscriberCount
}

/**
 * Sends a broadcast email to all eligible recipients.
 * Each email includes a personalised unsubscribe link.
 *
 * Targets: admin users, real email addresses, non-demo orgs, not opted out.
 */
export async function sendBroadcast(
  subject: string,
  intro: string,
  postUrl: string,
  buttonText: string
): Promise<BroadcastResult> {
  if (!subject.trim() || !intro.trim() || !postUrl.trim()) {
    return { sent: 0, skipped: 0, error: 'Subject, intro, and post URL are all required.' }
  }

  const supabase = createAdminClient()

  const [usersResult, subscribersResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, full_name, organisations!inner(is_demo)')
      .eq('role', 'admin')
      .eq('marketing_opt_out', false)
      .eq('organisations.is_demo', false),
    supabase
      .from('blog_subscribers')
      .select('id, email, full_name')
      .is('unsubscribed_at', null),
  ])

  if (usersResult.error) {
    return { sent: 0, skipped: 0, error: 'Failed to fetch recipients.' }
  }

  const userRecipients = (usersResult.data ?? [])
    .filter(u => !u.email.endsWith('@staff.alwaysready.uk'))

  const subscriberRecipients = subscribersResult.data ?? []

  // Convert newlines in intro to <p> tags
  const introHtml = intro
    .split(/\n\n+/)
    .map(p => `<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('')

  const bodyHtml = `
    ${introHtml}
    <p style="margin:24px 0 0">
      <a href="${postUrl}"
         style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none">
        ${buttonText || 'Read the full post'}
      </a>
    </p>
  `

  let sent = 0
  let skipped = 0

  // ── Platform users ──
  for (const recipient of userRecipients) {
    const firstName = recipient.full_name?.split(' ')[0] ?? null
    const greeting  = firstName ? `Dear ${firstName},` : 'Dear AlwaysReady customer,'

    const result = await sendEmail({
      to: recipient.email,
      subject,
      bodyHtml: `<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">${greeting}</p>${bodyHtml}`,
      type: 'marketing',
      userId: recipient.id,
    })

    if (result.sent) sent++; else skipped++
  }

  // ── Blog subscribers ──
  for (const subscriber of subscriberRecipients) {
    const firstName = subscriber.full_name?.split(' ')[0] ?? null
    const greeting  = firstName ? `Dear ${firstName},` : 'Dear reader,'

    const result = await sendEmail({
      to: subscriber.email,
      subject,
      bodyHtml: `<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">${greeting}</p>${bodyHtml}`,
      type: 'marketing',
      subscriberEmail: subscriber.email,
    })

    if (result.sent) sent++; else skipped++
  }

  return { sent, skipped }
}
