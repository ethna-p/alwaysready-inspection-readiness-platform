'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperadmin } from '@/lib/assert-superadmin'
import { throwOnDbError } from '@/lib/db-errors'

export async function createCampaign(formData: FormData) {
  await assertSuperadmin()
  const name        = (formData.get('name') as string ?? '').trim()
  const description = (formData.get('description') as string ?? '').trim() || null
  if (!name) return

  const supabase = createAdminClient()
  const { error } = await supabase.from('marketing_campaigns').insert({ name, description })
  throwOnDbError(error, 'campaigns.createCampaign')

  revalidatePath('/superadmin/campaigns')
}

export async function updateCampaignStatus(id: string, status: 'draft' | 'active' | 'closed') {
  await assertSuperadmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('marketing_campaigns').update({ status }).eq('id', id)
  throwOnDbError(error, 'campaigns.updateCampaignStatus')

  revalidatePath('/superadmin/campaigns')
  revalidatePath(`/superadmin/campaigns/${id}`)
}

export async function deleteCampaign(id: string) {
  await assertSuperadmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id)
  throwOnDbError(error, 'campaigns.deleteCampaign')

  revalidatePath('/superadmin/campaigns')
}

export async function addContact(campaignId: string, formData: FormData) {
  await assertSuperadmin()
  const locationName   = (formData.get('location_name')   as string ?? '').trim()
  const providerName   = (formData.get('provider_name')   as string ?? '').trim() || null
  const streetAddress  = (formData.get('street_address')  as string ?? '').trim() || null
  const city           = (formData.get('city')            as string ?? '').trim() || null
  const postcode       = (formData.get('postcode')        as string ?? '').trim().toUpperCase() || null
  const region         = (formData.get('region')          as string ?? '').trim() || null
  const serviceType    = (formData.get('service_type')    as string ?? '').trim() || null
  const locationId     = (formData.get('location_id')     as string ?? '').trim() || null
  const cqcProfileUrl  = (formData.get('cqc_profile_url') as string ?? '').trim() || null
  const contactMethod  = (formData.get('contact_method')  as string ?? 'letter') as 'letter' | 'email'

  if (!locationName) return

  const supabase = createAdminClient()
  const { error } = await supabase.from('campaign_contacts').insert({
    campaign_id:     campaignId,
    location_id:     locationId,
    location_name:   locationName,
    provider_name:   providerName,
    street_address:  streetAddress,
    city,
    postcode,
    region,
    service_type:    serviceType,
    cqc_profile_url: cqcProfileUrl,
    contact_method:  contactMethod,
  })

  throwOnDbError(error, 'campaigns.addContact')

  revalidatePath(`/superadmin/campaigns/${campaignId}`)
}

export async function markContacted(contactId: string, campaignId: string) {
  await assertSuperadmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('campaign_contacts')
    .update({ contacted_at: new Date().toISOString() })
    .eq('id', contactId)
  throwOnDbError(error, 'campaigns.markContacted')

  revalidatePath(`/superadmin/campaigns/${campaignId}`)
}

export async function deleteContact(contactId: string, campaignId: string) {
  await assertSuperadmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('campaign_contacts').delete().eq('id', contactId)
  throwOnDbError(error, 'campaigns.deleteContact')

  revalidatePath(`/superadmin/campaigns/${campaignId}`)
}

/**
 * Manually suppress a contact — the counterpart to the automatic token-based
 * suppression in app/api/inbound-optout/route.ts. Used when an opt-out
 * request arrives with no token (no way to verify it automatically, since
 * postcode/business name are both public) and AJ has manually confirmed the
 * match after reviewing the notification email.
 */
export async function suppressContact(contactId: string, campaignId: string) {
  await assertSuperadmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('campaign_contacts')
    .update({ suppressed_at: new Date().toISOString() })
    .eq('id', contactId)
  throwOnDbError(error, 'campaigns.suppressContact')

  revalidatePath(`/superadmin/campaigns/${campaignId}`)
}

export async function addSuppression(formData: FormData) {
  await assertSuperadmin()
  const locationName = (formData.get('location_name') as string ?? '').trim()
  const postcode     = (formData.get('postcode')       as string ?? '').trim().toUpperCase() || null
  const email        = (formData.get('email')          as string ?? '').trim().toLowerCase() || null
  if (!locationName) return

  const supabase = createAdminClient()
  const { error } = await supabase.from('marketing_suppressions').insert({
    location_name: locationName,
    postcode,
    email,
    source: 'manual',
  })

  throwOnDbError(error, 'campaigns.addSuppression')

  revalidatePath('/superadmin/campaigns')
}

export async function deleteSuppression(id: string) {
  await assertSuperadmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('marketing_suppressions').delete().eq('id', id)
  throwOnDbError(error, 'campaigns.deleteSuppression')

  revalidatePath('/superadmin/campaigns')
}
