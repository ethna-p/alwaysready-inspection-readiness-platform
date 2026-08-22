'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// New tables not yet in generated DB types — use any cast until migration is applied
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = () => createAdminClient() as any

export async function createCampaign(formData: FormData) {
  const name        = (formData.get('name') as string ?? '').trim()
  const description = (formData.get('description') as string ?? '').trim() || null
  if (!name) return

  await supabase().from('marketing_campaigns').insert({ name, description })
  revalidatePath('/superadmin/campaigns')
}

export async function updateCampaignStatus(id: string, status: 'draft' | 'active' | 'closed') {
  await supabase().from('marketing_campaigns').update({ status }).eq('id', id)
  revalidatePath('/superadmin/campaigns')
  revalidatePath(`/superadmin/campaigns/${id}`)
}

export async function deleteCampaign(id: string) {
  await supabase().from('marketing_campaigns').delete().eq('id', id)
  revalidatePath('/superadmin/campaigns')
}

export async function addContact(campaignId: string, formData: FormData) {
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

  await supabase().from('campaign_contacts').insert({
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

  revalidatePath(`/superadmin/campaigns/${campaignId}`)
}

export async function markContacted(contactId: string, campaignId: string) {
  await supabase()
    .from('campaign_contacts')
    .update({ contacted_at: new Date().toISOString() })
    .eq('id', contactId)
  revalidatePath(`/superadmin/campaigns/${campaignId}`)
}

export async function deleteContact(contactId: string, campaignId: string) {
  await supabase().from('campaign_contacts').delete().eq('id', contactId)
  revalidatePath(`/superadmin/campaigns/${campaignId}`)
}

export async function addSuppression(formData: FormData) {
  const locationName = (formData.get('location_name') as string ?? '').trim()
  const postcode     = (formData.get('postcode')       as string ?? '').trim().toUpperCase() || null
  const email        = (formData.get('email')          as string ?? '').trim().toLowerCase() || null
  if (!locationName) return

  await supabase().from('marketing_suppressions').insert({
    location_name: locationName,
    postcode,
    email,
    source: 'manual',
  })

  revalidatePath('/superadmin/campaigns')
}

export async function deleteSuppression(id: string) {
  await supabase().from('marketing_suppressions').delete().eq('id', id)
  revalidatePath('/superadmin/campaigns')
}
