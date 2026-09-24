'use server'

/**
 * Self-service data deletion for blog-only subscribers (people in
 * blog_subscribers who are not platform users). Unsubscribing only sets
 * unsubscribed_at and keeps the row: someone who wants their data actually
 * erased, not just opted out of future emails, needs this instead. See
 * app/unsubscribe/page.tsx, which links here for exactly that reason.
 *
 * The signed token in the URL (the same one used for the unsubscribe link)
 * is re-verified server-side here rather than trusted from the client, since
 * this action is destructive and irreversible.
 */

import { verifySubscriberToken } from '@/lib/unsubscribe-token'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { renderTemplate } from '@/lib/email-templates'
import { getFirstName } from '@/lib/utils/name'
import { escapeHtml } from '@/lib/utils/escape'

export interface DeleteMyDataResult {
  status: 'success' | 'invalid'
}

export async function deleteBlogSubscriberData(email: string, token: string): Promise<DeleteMyDataResult> {
  if (!email || !token || !verifySubscriberToken(email, token)) {
    return { status: 'invalid' }
  }

  const normalisedEmail = email.toLowerCase().trim()
  const supabase = createAdminClient()

  const { data: subscriber } = await supabase
    .from('blog_subscribers')
    .select('email, full_name')
    .eq('email', normalisedEmail)
    .single()

  if (!subscriber) {
    // Either already deleted, or the row never existed: from the caller's
    // point of view both look like "your data is gone", so treat as success
    // rather than surfacing an internal distinction that isn't theirs to know.
    return { status: 'success' }
  }

  const { error } = await supabase
    .from('blog_subscribers')
    .delete()
    .eq('email', normalisedEmail)

  if (error) {
    console.error('[delete-blog-subscriber] delete failed:', error.message)
    return { status: 'invalid' }
  }

  const firstName = escapeHtml(getFirstName(subscriber.full_name))
  const defaultDeletionCompletedHtml = `
      <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">Your AlwaysReady blog subscriber data has been deleted</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your AlwaysReady blog subscriber data has been permanently deleted, ${firstName}, in accordance
        with your request.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        This includes your email address, name, and subscription record. It has been removed from our live systems, and any encrypted backup copies are automatically deleted within 30 days.
        You will not receive any further emails from us unless you subscribe again in future.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you would like to subscribe again at any point, you are very welcome to do so
        at <a href="https://alwaysready.uk/blog" style="color:#014D4E">alwaysready.uk/blog</a>.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you have any questions about this deletion, contact us at
        <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
      </p>
    `

  try {
    await sendEmail({
      to: normalisedEmail,
      subject: 'Your AlwaysReady blog subscriber data has been deleted',
      type: 'transactional',
      bodyHtml: await renderTemplate(
        'blog_subscriber_deletion_completed',
        { firstName },
        defaultDeletionCompletedHtml,
      ),
    })
  } catch (err) {
    // The deletion itself already succeeded; a failed confirmation email
    // shouldn't be reported back as a failed deletion.
    console.error('[delete-blog-subscriber] confirmation email failed:', err)
  }

  return { status: 'success' }
}
