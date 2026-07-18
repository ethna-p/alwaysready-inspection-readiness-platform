'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export interface OrgOption {
  id: string
  name: string
  adminEmail: string | null
  adminName: string | null
}

/**
 * Returns all non-demo organisations with their primary admin user,
 * for the "open ticket on behalf of" dropdown.
 */
export async function getOrganisationsForTicket(): Promise<OrgOption[]> {
  const supabase = createAdminClient()

  const { data: orgs } = await supabase
    .from('organisations')
    .select('id, name')
    .eq('is_demo', false)
    .order('name', { ascending: true })

  if (!orgs) return []

  // Fetch one admin user per org
  const result: OrgOption[] = []

  for (const org of orgs) {
    const { data: admins } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')
      .not('email', 'like', '%@staff.alwaysready.uk')
      .limit(1)

    const admin = admins?.[0] ?? null

    result.push({
      id: org.id,
      name: org.name,
      adminEmail: admin?.email ?? null,
      adminName: admin?.full_name ?? null,
    })
  }

  return result
}

/**
 * Opens a support ticket on behalf of a customer organisation.
 * Sets staff_initiated = true, submitted_by = null.
 * Redirects to the new ticket's detail page on success.
 */
export async function openTicketForCustomer(
  orgId: string,
  subject: string,
  message: string,
): Promise<{ error: string } | never> {
  if (!orgId || !subject.trim() || !message.trim()) {
    return { error: 'Organisation, subject, and message are all required.' }
  }

  const supabase = createAdminClient()

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      organisation_id: orgId,
      submitted_by: null,
      staff_initiated: true,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !ticket) {
    return { error: error?.message ?? 'Failed to create ticket.' }
  }

  redirect(`/superadmin/tickets/${ticket.id}`)
}
