'use server'

/**
 * Newsletter drafting actions
 *
 * generateNewsletter — calls Anthropic Claude Haiku to produce a draft newsletter.
 * Enforces a monthly limit of 10 generations per organisation.
 *
 * getNewsletterUsage — returns how many drafts the org has used this calendar month.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'

const MONTHLY_LIMIT = 10

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type NewsletterInput = {
  audience: string
  occasion: string
  keyPoints: string
  tone: string
}

export type GenerateResult =
  | { success: true;  draft: string; remaining: number }
  | { success: false; error: string }

/** Returns the start of the current UTC calendar month as an ISO string. */
function startOfMonth(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString()
}

export async function generateNewsletter(input: NewsletterInput): Promise<GenerateResult> {
  const profile = await getCurrentUserProfile()
  if (!profile?.organisation_id) {
    return { success: false, error: 'Not authenticated.' }
  }

  const supabase = await createClient()

  // ── Check monthly limit ────────────────────────────────────────────────────
  const { count } = await supabase
    .from('newsletter_generations')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', profile.organisation_id)
    .gte('generated_at', startOfMonth())

  const used = count ?? 0
  if (used >= MONTHLY_LIMIT) {
    return {
      success: false,
      error: `You've used all ${MONTHLY_LIMIT} newsletter drafts for this month. Your allowance resets on the 1st.`,
    }
  }

  // ── Build prompt ───────────────────────────────────────────────────────────
  const toneDescriptions: Record<string, string> = {
    'Warm and friendly': 'warm, friendly, and approachable',
    'Professional':      'professional and formal',
    'Brief and factual': 'concise and factual, with minimal padding',
  }
  const toneDesc = toneDescriptions[input.tone] ?? 'warm and friendly'

  const userMessage = [
    `Audience: ${input.audience}`,
    `Topic / occasion: ${input.occasion}`,
    input.keyPoints.trim() ? `Key points to include:\n${input.keyPoints.trim()}` : '',
    `Tone: ${toneDesc}`,
  ].filter(Boolean).join('\n\n')

  // ── Call Anthropic ─────────────────────────────────────────────────────────
  let draft = ''
  try {
    const message = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: `You are a professional writing assistant for adult social care providers in the UK — care homes, nursing homes, homecare agencies, and supported living providers.

Write newsletter drafts that feel human and natural. Follow these rules:
- Length: 200–300 words (never exceed 350)
- Open with an appropriate salutation matching the audience (e.g. "Dear Team", "Dear Families and Friends", "Dear All")
- UK English spelling throughout (colour, organisation, recognise, etc.)
- Never include specific resident names, clinical information, or health details of individuals
- Avoid corporate jargon and filler phrases
- End every newsletter with a two-line sign-off: a warm closing line, then "[Your name]" on one line and "[Home name]" on the next
- Write ready-to-use copy — no placeholders except the sign-off`,
      messages: [{ role: 'user', content: userMessage }],
    })

    draft = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  } catch (err) {
    console.error('[newsletter] Anthropic API error:', err)
    return { success: false, error: 'Could not generate a draft right now. Please try again.' }
  }

  // ── Record the generation ──────────────────────────────────────────────────
  await supabase
    .from('newsletter_generations')
    .insert({ organisation_id: profile.organisation_id })

  return {
    success:   true,
    draft,
    remaining: MONTHLY_LIMIT - used - 1,
  }
}

export async function getNewsletterUsage(): Promise<{ used: number; remaining: number }> {
  const profile = await getCurrentUserProfile()
  if (!profile?.organisation_id) return { used: 0, remaining: MONTHLY_LIMIT }

  const supabase = await createClient()

  const { count } = await supabase
    .from('newsletter_generations')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', profile.organisation_id)
    .gte('generated_at', startOfMonth())

  const used = count ?? 0
  return { used, remaining: Math.max(0, MONTHLY_LIMIT - used) }
}
