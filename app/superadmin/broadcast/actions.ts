'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { assertSuperadmin } from '@/lib/assert-superadmin'

export interface BroadcastResult {
  sent: number
  skipped: number
  error?: string
}

/**
 * Returns the total number of eligible broadcast recipients.
 * Broadcasts are blog post notifications — audience is blog subscribers only.
 * Platform users are excluded: their marketing consent covers platform
 * communications, not a separate blog newsletter (UK GDPR purpose limitation).
 */
export async function getRecipientCount(): Promise<number> {
  await assertSuperadmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('blog_subscribers')
    .select('id')
    .is('unsubscribed_at', null)

  if (error) return 0
  return (data ?? []).length
}

/**
 * Sends a blog post broadcast to all active blog subscribers.
 * Each email includes a personalised unsubscribe link.
 */
export async function sendBroadcast(
  subject: string,
  intro: string,
  postUrl: string,
  buttonText: string
): Promise<BroadcastResult> {
  await assertSuperadmin()

  if (!subject.trim() || !intro.trim() || !postUrl.trim()) {
    return { sent: 0, skipped: 0, error: 'Subject, intro, and post URL are all required.' }
  }

  const supabase = createAdminClient()

  const { data: subscribers, error } = await supabase
    .from('blog_subscribers')
    .select('id, email, full_name')
    .is('unsubscribed_at', null)

  if (error) {
    return { sent: 0, skipped: 0, error: 'Failed to fetch subscribers.' }
  }

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

  for (const subscriber of subscribers ?? []) {
    const firstName = subscriber.full_name?.split(' ')[0] ?? null
    const greeting  = firstName ? `Hi ${firstName},` : 'Hi,'

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
