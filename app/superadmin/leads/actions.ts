'use server'

import { createAdminClient }       from '@/lib/supabase/admin'
import { revalidatePath }          from 'next/cache'
import { assertSuperadmin }        from '@/lib/assert-superadmin'
import { sendEmail }               from '@/lib/email'
import { getWaitlistNurtureEmail } from '@/lib/waitlist-nurture'
import { renderTemplate } from '@/lib/email-templates'

export type LeadsActionResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteLead(id: string): Promise<LeadsActionResult> {
  await assertSuperadmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('waitlist_leads').delete().eq('id', id)
  if (error) {
    console.error('[leads] deleteLead failed:', error)
    return { success: false, error: 'Could not delete the lead. Please try again.' }
  }
  revalidatePath('/superadmin/leads')
  return { success: true }
}

export async function deleteSubscriber(id: string): Promise<LeadsActionResult> {
  await assertSuperadmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('blog_subscribers').delete().eq('id', id)
  if (error) {
    console.error('[leads] deleteSubscriber failed:', error)
    return { success: false, error: 'Could not delete the subscriber. Please try again.' }
  }
  revalidatePath('/superadmin/leads')
  return { success: true }
}

export async function addZeegBooking(formData: FormData): Promise<LeadsActionResult> {
  await assertSuperadmin()
  const supabase = createAdminClient()

  const name     = (formData.get('invitee_name')  as string | null)?.trim() || null
  const email    = ((formData.get('invitee_email') as string | null) ?? '').trim()
  const demoType    = ((formData.get('demo_type')     as string | null) ?? '').trim()
  const scheduledAt = ((formData.get('scheduled_at')   as string | null) ?? '').trim() || null

  if (!email || !demoType) return { success: false, error: 'Email and demo type are required.' }

  const { error } = await supabase.from('zeeg_bookings').insert({
    event_uuid:    crypto.randomUUID(),
    invitee_uuid:  crypto.randomUUID(),
    invitee_email: email,
    invitee_name:  name,
    demo_type:     demoType,
    booked_at:     new Date().toISOString(),
    scheduled_at:  scheduledAt,
  })

  if (error) {
    console.error('[leads] addZeegBooking insert failed:', error)
    return { success: false, error: 'Could not add the booking. Please try again.' }
  }

  revalidatePath('/superadmin/leads')
  return { success: true }
}

/**
 * Bulk-send Email 9 (CQC framework date) or Email 10 (launch) to all
 * nurture_opt_in waitlist subscribers. Triggered manually by AJ once CQC
 * publishes the framework date or when AlwaysReady opens.
 *
 * These sit outside the weekly sequence: they go to every nurture subscriber
 * regardless of where they are in the sequence.
 */
export async function sendBulkLaunchEmail(
  emailNum: 9 | 10,
): Promise<{ sent: number; failed: number; errors: string[] }> {
  await assertSuperadmin()

  const supabase = createAdminClient()

  const { data: leads, error } = await supabase
    .from('waitlist_leads')
    .select('email, first_name')
    .eq('nurture_opt_in', true)

  if (error || !leads) {
    throw new Error('Failed to fetch leads: ' + (error?.message ?? 'unknown'))
  }

  let sent    = 0
  let failed  = 0
  const errors: string[] = []

  for (const lead of leads) {
    // getWaitlistNurtureEmail() escapes firstName internally, don't escape here too.
    const emailContent = getWaitlistNurtureEmail(emailNum, lead.first_name || 'there')
    if (!emailContent) continue

    try {
      // sendEmail() never throws for a send that didn't go out (missing API
      // key, opt-out, a Resend API error) -- it returns { sent: false, ... }
      // normally in every one of those cases. This loop used to only check
      // for a thrown exception, so it counted every one of those as a
      // success -- confirmed live: with no RESEND_API_KEY configured, this
      // reported "Sent to 1 subscriber" for a send that never happened.
      const bodyHtml = await renderTemplate(
        `waitlist_nurture_${emailNum}`,
        { firstName: lead.first_name || 'there' },
        emailContent.bodyHtml,
      )

      const result = await sendEmail({
        to:              lead.email,
        subject:         emailContent.subject,
        type:            'marketing',
        subscriberEmail: lead.email,
        footerNote:      'You are receiving this because you joined the AlwaysReady waitlist.',
        bodyHtml,
      })
      if (result.sent) {
        sent++
      } else {
        console.error(`[sendBulkLaunchEmail] Not sent for ${lead.email}:`, result.skipped ?? result.error)
        failed++
        errors.push(lead.email)
      }
    } catch (err) {
      console.error(`[sendBulkLaunchEmail] Failed for ${lead.email}:`, err)
      failed++
      errors.push(lead.email)
    }

    // Small delay to avoid overwhelming the mail server
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { sent, failed, errors }
}

export async function deletePipelineRow(
  demoLeadId: string | null,
  zeegBookingId: string | null,
): Promise<LeadsActionResult> {
  await assertSuperadmin()
  const supabase = createAdminClient()

  // Attempt both deletes even if the first fails, so one bad row does not strand the other.
  let failed = false
  if (demoLeadId) {
    const { error } = await supabase.from('demo_leads').delete().eq('id', demoLeadId)
    if (error) { console.error('[leads] deletePipelineRow demo_leads failed:', error); failed = true }
  }
  if (zeegBookingId) {
    const { error } = await supabase.from('zeeg_bookings').delete().eq('id', zeegBookingId)
    if (error) { console.error('[leads] deletePipelineRow zeeg_bookings failed:', error); failed = true }
  }

  // Revalidate even on failure so the table shows whichever half did get deleted.
  revalidatePath('/superadmin/leads')
  return failed
    ? { success: false, error: 'Could not delete this entry. Please refresh and try again.' }
    : { success: true }
}

export async function updateScheduledAt(zeegBookingId: string, scheduledAt: string): Promise<LeadsActionResult> {
  await assertSuperadmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('zeeg_bookings')
    .update({ scheduled_at: scheduledAt })
    .eq('id', zeegBookingId)
    .select('id')

  if (error) {
    console.error('[leads] updateScheduledAt failed:', error)
    return { success: false, error: 'Could not save the new time. Please try again.' }
  }
  if (!data || data.length === 0) {
    return { success: false, error: 'That booking no longer exists. Please refresh the page.' }
  }

  revalidatePath('/superadmin/leads')
  return { success: true }
}
