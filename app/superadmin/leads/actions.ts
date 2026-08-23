'use server'

import { createAdminClient }       from '@/lib/supabase/admin'
import { revalidatePath }          from 'next/cache'
import { assertSuperadmin }        from '@/lib/assert-superadmin'
import { sendEmail }               from '@/lib/email'
import { getWaitlistNurtureEmail } from '@/lib/waitlist-nurture'

export async function deleteLead(id: string) {
  await assertSuperadmin()
  const supabase = createAdminClient()
  await supabase.from('waitlist_leads').delete().eq('id', id)
  revalidatePath('/superadmin/leads')
}

export async function addZeegBooking(formData: FormData) {
  await assertSuperadmin()
  const supabase = createAdminClient()

  const name     = (formData.get('invitee_name')  as string | null)?.trim() || null
  const email    = ((formData.get('invitee_email') as string | null) ?? '').trim()
  const demoType = ((formData.get('demo_type')     as string | null) ?? '').trim()

  if (!email || !demoType) throw new Error('Email and demo type are required')

  await supabase.from('zeeg_bookings').insert({
    event_uuid:    crypto.randomUUID(),
    invitee_uuid:  crypto.randomUUID(),
    invitee_email: email,
    invitee_name:  name,
    demo_type:     demoType,
    booked_at:     new Date().toISOString(),
  })

  revalidatePath('/superadmin/leads')
}

/**
 * Bulk-send Email 9 (CQC framework date) or Email 10 (launch) to all
 * nurture_opt_in waitlist subscribers. Triggered manually by AJ once CQC
 * publishes the framework date or when AlwaysReady opens.
 *
 * These sit outside the weekly sequence — they go to every nurture subscriber
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
    const emailContent = getWaitlistNurtureEmail(emailNum, lead.first_name || 'there')
    if (!emailContent) continue

    try {
      await sendEmail({
        to:              lead.email,
        subject:         emailContent.subject,
        type:            'marketing',
        subscriberEmail: lead.email,
        bodyHtml:        emailContent.bodyHtml,
      })
      sent++
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
