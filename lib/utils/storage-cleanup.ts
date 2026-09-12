/**
 * Shared Storage cleanup helper.
 *
 * Single authoritative implementation — see lib/utils/upload.ts's own header
 * comment for why that matters here specifically: this was previously
 * defined only inside app/api/cron/data-deletion/route.ts, and
 * app/superadmin/organisations/actions.ts's manual "delete this org" tool
 * had no equivalent call at all — it deleted every DB row referencing an
 * org's uploaded files, but never the files themselves, silently orphaning
 * them in Storage forever. The automated GDPR-driven deletion path was
 * never at risk (it already called this), but the manual superadmin tool
 * was — fixed by extracting this here so both use the exact same logic.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Recursively lists and deletes all Storage objects under `prefix/` in `bucket`.
 * Returns the total number of objects removed.
 *
 * Supabase Storage's list() is non-recursive: items with a null `id` are
 * "pseudo-folders" (common prefixes) and items with a UUID `id` are real files.
 * We recurse into pseudo-folders to reach every file.
 */
export async function deleteStoragePrefix(
  supabase: SupabaseClient,
  bucket:   string,
  prefix:   string,
): Promise<number> {
  let count = 0
  const { data: items, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 })

  if (error || !items) return count

  const files   = items.filter(i => i.id !== null)
  const folders = items.filter(i => i.id === null)

  if (files.length > 0) {
    const paths = files.map(f => `${prefix}/${f.name}`)
    await supabase.storage.from(bucket).remove(paths)
    count += files.length
  }

  for (const folder of folders) {
    count += await deleteStoragePrefix(supabase, bucket, `${prefix}/${folder.name}`)
  }

  return count
}
