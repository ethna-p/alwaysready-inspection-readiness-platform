/**
 * Editable email templates: lets a superadmin override any customer-facing
 * email's HTML from app/superadmin/email-templates, without a code change
 * or deploy. See supabase/migrations/20260916155014_email_template_versions.sql
 * for the storage model (append-only versions; "current" = most recent row).
 *
 * Every email-sending call site keeps its own hardcoded default HTML (used
 * both as the fallback when nothing's been customized, and to reset a
 * template back to default). renderTemplate() checks for a saved override
 * and, if found, substitutes {{token}} placeholders into it instead of
 * using the default.
 */
import { createAdminClient } from '@/lib/supabase/admin'

export interface TemplateVersion {
  id: string
  templateId: string
  html: string
  createdAt: string
  createdBy: string | null
}

function mapRow(row: { id: string; template_id: string; html: string; created_at: string; created_by: string | null }): TemplateVersion {
  return { id: row.id, templateId: row.template_id, html: row.html, createdAt: row.created_at, createdBy: row.created_by }
}

/** The most recent saved version for a template, or null if never customized. */
export async function getTemplateOverride(templateId: string): Promise<TemplateVersion | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('email_template_versions')
    .select('id, template_id, html, created_at, created_by')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? mapRow(data) : null
}

/**
 * Replaces {{token}} placeholders with values from params. A token with no
 * matching param is left as-is (visible in the output, easy to spot rather
 * than silently disappearing).
 */
export function applyParams(html: string, params: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key: string) => (key in params ? params[key] : match))
}

/**
 * Renders a template for sending: the saved override (with placeholders
 * filled in) if one exists, otherwise the code default already rendered
 * by the caller.
 */
export async function renderTemplate(templateId: string, params: Record<string, string>, defaultHtml: string): Promise<string> {
  const override = await getTemplateOverride(templateId)
  if (!override) return defaultHtml
  return applyParams(override.html, params)
}

/** Saves a new version (never overwrites) and returns it. */
export async function saveTemplateVersion(templateId: string, html: string, createdBy: string | null): Promise<TemplateVersion> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_template_versions')
    .insert({ template_id: templateId, html, created_by: createdBy })
    .select('id, template_id, html, created_at, created_by')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to save template version.')
  return mapRow(data)
}

/** Version history for a template, most recent first. */
export async function listTemplateVersions(templateId: string, limit = 25): Promise<TemplateVersion[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('email_template_versions')
    .select('id, template_id, html, created_at, created_by')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(mapRow)
}
