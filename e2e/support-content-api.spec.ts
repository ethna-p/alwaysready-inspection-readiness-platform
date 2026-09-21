/**
 * /api/support-content -- the single source of truth for AlwaysReady's
 * customer-facing support content, added so the marketing site's chatbot and its Help Centre search stop
 * maintaining independently hand-copied versions of the same FAQ
 * content (confirmed drifting out of sync at least once already -- stale
 * references to a removed feature survived in two of the three copies
 * after the feature itself was deleted, found while auditing all three at
 * AJ's request).
 *
 * No login needed -- this is a public, unauthenticated route (the same
 * content already shown to any support-desk visitor or Help Centre
 * reader), and no seeded fixture dependency either: it only reads the
 * static SYSTEM_PROMPT constant, not anything from the database.
 */
import { test, expect } from '@playwright/test'
import { SYSTEM_PROMPT } from '../lib/ai-draft-faq'

test('GET /api/support-content: CORS, exact systemPrompt, and every FAQ entry parses with no gaps', async ({ request }) => {
  const res = await request.get('/api/support-content', {
    headers: { Origin: 'https://alwaysready.uk' },
  })
  expect(res.status()).toBe(200)
  expect(res.headers()['access-control-allow-origin']).toBe('https://alwaysready.uk')

  const body = await res.json() as { systemPrompt: string; faqs: { id: string; category: string; question: string; answer: string }[] }

  // The marketing chatbot is meant to use this verbatim as its own system
  // prompt -- must be byte-identical to the platform's own copy, not a
  // paraphrase.
  expect(body.systemPrompt).toBe(SYSTEM_PROMPT)

  // Every "Q<id>:" marker in the source has a matching parsed entry -- the
  // parser's own failure mode (a category header or a Q/A pair it doesn't
  // recognise) is silent (entries just don't appear), so this is the
  // signal that actually catches it.
  const sourceIds = [...SYSTEM_PROMPT.matchAll(/^Q(\d+\w?):/gm)].map(m => m[1])
  expect(sourceIds.length).toBeGreaterThan(100) // sanity: the FAQ section is genuinely large
  expect(body.faqs.length).toBe(sourceIds.length)
  const parsedIds = new Set(body.faqs.map(f => f.id))
  for (const id of sourceIds) {
    expect(parsedIds.has(id)).toBe(true)
  }

  // Every entry has a non-empty category, question, and answer -- an
  // empty category most often means a question appeared before this
  // parser recognised any header line above it.
  for (const faq of body.faqs) {
    expect(faq.category.length).toBeGreaterThan(0)
    expect(faq.question.length).toBeGreaterThan(0)
    expect(faq.answer.length).toBeGreaterThan(0)
  }
})

test('OPTIONS /api/support-content: CORS preflight succeeds with no body', async ({ request }) => {
  const res = await request.fetch('/api/support-content', { method: 'OPTIONS' })
  expect(res.status()).toBe(204)
  expect(res.headers()['access-control-allow-origin']).toBe('https://alwaysready.uk')
  expect(res.headers()['access-control-allow-methods']).toContain('GET')
})
