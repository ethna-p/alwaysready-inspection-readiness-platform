/**
 * GET /email/view/[id]: "View in Browser" for a sent email.
 *
 * Public, no login required. There's no session to require one of, since
 * the point is someone reading their own inbox, not the platform. The id
 * itself is the access credential (an unguessable v4 uuid), the same
 * bearer-link model every major ESP's own "view in browser" link uses.
 * Serves the exact HTML that was actually sent (lib/email.ts's sendEmail(),
 * stored in email_archive at send time), byte for byte.
 */
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('email_archive')
    .select('body_html')
    .eq('id', id)
    .maybeSingle()

  if (!data) {
    return new Response('This email is no longer available to view.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  return new Response(data.body_html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
