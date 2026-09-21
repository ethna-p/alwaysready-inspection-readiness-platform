/**
 * GET /api/support-content
 *
 * Single source of truth for AlwaysReady's customer-facing support
 * content, so the marketing site's chatbot (alwaysready-site/functions/chat.js) and
 * its Help Centre search (alwaysready-site/src/js/helpcentre-search.js)
 * stop maintaining independently hand-copied versions of the same
 * FAQ content -- confirmed drifting out of sync at least once already
 * (stale references to a removed feature survived in two of the three
 * copies after the feature itself was deleted).
 *
 * `systemPrompt` is lib/ai-draft-faq.ts's SYSTEM_PROMPT verbatim -- the
 * marketing chatbot should use this directly as its own system prompt
 * rather than maintaining a separate copy.
 *
 * `faqs` is parsed out of that same string's "## Frequently asked
 * questions" section at request time (not hand-transcribed into a second
 * copy here, which would just reintroduce the drift risk this route
 * exists to remove) -- the Help Centre's client-side search should build
 * its {cat, q, a} entries from this array. See parseFaqs()'s own comment
 * for the exact format it depends on.
 *
 * No authentication required -- this is the same content already shown
 * to any support-desk visitor or Help Centre reader.
 */
import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/ai-draft-faq'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://alwaysready.uk',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Static content, fetched on every chat message and every Help Centre page
// load -- generous, but still bounded against abuse.
const limiter = createRateLimiter({ name: 'support-content', windowMs: 10 * 60_000, max: 300 })

export interface SupportFaqEntry {
  id:       string
  category: string
  question: string
  answer:   string
}

/**
 * Parses "Q<id>: <question>" / "A: <answer>" pairs out of SYSTEM_PROMPT's
 * FAQ section, grouped by the ALL-CAPS category header line that precedes
 * them (e.g. "INCIDENT LOG", "GOVERNANCE MEETINGS"). Depends on that
 * section's format staying consistent -- every question is immediately
 * followed by its answer on the very next non-blank line, and every
 * category header is its own line in full capitals. Both hold for the
 * entire section as of this writing (verified by reading the whole file).
 */
export function parseFaqs(systemPrompt: string): SupportFaqEntry[] {
  const startMarker = '## Frequently asked questions'
  const endMarker    = '## The 24 KLOEs in the platform'
  const start = systemPrompt.indexOf(startMarker)
  const end   = systemPrompt.indexOf(endMarker)
  if (start === -1 || end === -1) return []

  const lines = systemPrompt.slice(start, end).split('\n')
  const entries: SupportFaqEntry[] = []
  let category = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const qMatch = line.match(/^Q(\d+\w?):\s*(.+)$/)
    if (qMatch) {
      const nextLine = (lines[i + 1] ?? '').trim()
      const aMatch = nextLine.match(/^A:\s*(.+)$/)
      if (aMatch) {
        entries.push({ id: qMatch[1], category, question: qMatch[2], answer: aMatch[1] })
      }
      continue
    }

    // A category header: a standalone, non-empty, all-caps line (contains
    // at least one letter, and no lowercase letters) that isn't itself a
    // markdown heading or a Q/A line.
    const isAllCaps = /[A-Z]/.test(line) && line === line.toUpperCase()
    if (isAllCaps && !line.startsWith('#') && !line.startsWith('A:')) {
      category = line
    }
  }

  return entries
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
  if (!await limiter.check(getClientIp(req))) {
    return new NextResponse('Too many requests. Please try again later.', {
      status: 429,
      headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain', 'Retry-After': '600' },
    })
  }

  return NextResponse.json({
    systemPrompt: SYSTEM_PROMPT,
    faqs:         parseFaqs(SYSTEM_PROMPT),
  }, { headers: CORS_HEADERS })
}
