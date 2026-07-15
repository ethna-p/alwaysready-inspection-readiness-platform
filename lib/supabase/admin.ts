/**
 * Supabase Admin client — server-side only.
 *
 * Uses the SERVICE ROLE key, which bypasses Row Level Security.
 * NEVER import this in client components or expose it to the browser.
 *
 * Used exclusively for:
 *   - Creating auth users during demo session setup
 *   - Any other privileged operations that cannot be done by the
 *     authenticated user (e.g. invite flows in future)
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Find it in: Supabase Dashboard → Project Settings → API → service_role key
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY to .env.local — ' +
      'find it in Supabase Dashboard → Settings → API → service_role.'
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
