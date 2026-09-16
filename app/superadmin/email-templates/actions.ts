'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperadmin } from '@/lib/assert-superadmin'
import { getRegistry, getRegisteredTemplate } from '@/lib/email-templates/registry'
import { applyParams, listTemplateVersions, saveTemplateVersion, type TemplateVersion } from '@/lib/email-templates'
import { buildHtml } from '@/lib/email'

export interface TemplateListItem {
  id: string
  label: string
  group: string
  customized: boolean
  lastUpdated: string | null
}

/**
 * Lists every editable template with whether it's been customized. One
 * query for all "latest version per template" rather than N+1: fetch every
 * version ordered newest-first and keep the first row seen per template_id.
 */
export async function listTemplatesForSuperadmin(): Promise<TemplateListItem[]> {
  await assertSuperadmin()
  const registry = getRegistry()
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('email_template_versions')
    .select('template_id, created_at')
    .order('created_at', { ascending: false })

  const latestByTemplate = new Map<string, string>()
  for (const row of data ?? []) {
    if (!latestByTemplate.has(row.template_id)) {
      latestByTemplate.set(row.template_id, row.created_at)
    }
  }

  return registry.map(t => ({
    id: t.id,
    label: t.label,
    group: t.group,
    customized: latestByTemplate.has(t.id),
    lastUpdated: latestByTemplate.get(t.id) ?? null,
  }))
}

export interface TemplateEditData {
  id: string
  label: string
  group: string
  params: string[]
  sampleHtml: string
  currentHtml: string
  hasOverride: boolean
  versions: TemplateVersion[]
}

export async function getTemplateForEdit(id: string): Promise<TemplateEditData> {
  await assertSuperadmin()
  const entry = getRegisteredTemplate(id)
  if (!entry) throw new Error('Unknown template.')

  const versions = await listTemplateVersions(id)
  const current = versions[0]

  return {
    id:          entry.id,
    label:       entry.label,
    group:       entry.group,
    params:      entry.params,
    sampleHtml:  entry.sampleHtml,
    currentHtml: current?.html ?? entry.sampleHtml,
    hasOverride: !!current,
    versions,
  }
}

/**
 * Renders `html` (with the template's sample params substituted) inside the
 * real shared header/footer, exactly as sendEmail() would wrap it. This
 * doesn't include a per-collection wrapper some templates add on top (e.g.
 * onboarding's CTA button), so it's an accurate preview of the shared frame
 * and the edited body, not a pixel-exact reproduction of every template.
 */
export async function previewTemplateHtml(id: string, html: string): Promise<string> {
  await assertSuperadmin()
  const entry = getRegisteredTemplate(id)
  if (!entry) throw new Error('Unknown template.')
  const bodyHtml = applyParams(html, entry.sampleParams)
  return buildHtml(bodyHtml, 'https://portal.alwaysready.uk/email/view/preview')
}

export async function saveTemplate(id: string, html: string): Promise<TemplateVersion> {
  await assertSuperadmin()
  const entry = getRegisteredTemplate(id)
  if (!entry) throw new Error('Unknown template.')
  if (!html.trim()) throw new Error('Template HTML cannot be empty.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const version = await saveTemplateVersion(id, html, user?.id ?? null)
  revalidatePath('/superadmin/email-templates')
  revalidatePath(`/superadmin/email-templates/${id}`)
  return version
}

/** Restoring a past version is just saving its HTML again as a new version, so the trail stays append-only. */
export async function restoreTemplateVersion(id: string, versionId: string): Promise<TemplateVersion> {
  await assertSuperadmin()
  const versions = await listTemplateVersions(id)
  const target = versions.find(v => v.id === versionId)
  if (!target) throw new Error('Version not found.')
  return saveTemplate(id, target.html)
}
