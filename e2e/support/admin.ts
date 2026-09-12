/**
 * A Supabase admin (service-role) client scoped to the preview project, for
 * specs that need to do something a real user's browser can't — e.g. mint a
 * password-recovery link to stand in for "receiving the email" in a self-
 * service password reset test, where there's no real inbox to check in CI.
 *
 * Same safety guard as seed.ts: refuses to run against anything that isn't
 * clearly the preview project.
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './env'

export function getAdminClient() {
  const env = loadEnvLocal()
  const url = env.SUPABASE_PREVIEW_URL
  const serviceRoleKey = env.SUPABASE_PREVIEW_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_PREVIEW_URL / SUPABASE_PREVIEW_SERVICE_ROLE_KEY missing from .env.local')
  }
  if (!url.includes('ybvbkbpzciakicxlwghs')) {
    throw new Error('SAFETY ABORT: SUPABASE_PREVIEW_URL does not look like the preview project. Refusing to proceed.')
  }

  return createClient(url, serviceRoleKey)
}
