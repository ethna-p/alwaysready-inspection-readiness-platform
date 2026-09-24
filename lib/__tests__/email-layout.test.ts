import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { buildHtml } from '../email'

const H1 = '<h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">Your trial is ready</h1>'
const BODY = '<p>First paragraph of the body.</p><p>Second paragraph.</p>'
const build = (body: string, broadcast = false) => buildHtml(body, 'https://example.test/view', undefined, undefined, broadcast)
const at = (html: string, needle: string) => html.indexOf(needle)

describe('email layout: logo, headline, headshot and name, then the body', () => {
  it('puts the headline between the logo header and the headshot', () => {
    const html = build(H1 + BODY)
    const logo = at(html, 'AlwaysReady</span>')
    const headline = at(html, 'Your trial is ready')
    const headshot = at(html, 'headshot-ethna-parker')
    const body = at(html, 'First paragraph of the body.')
    expect(logo).toBeGreaterThan(-1)
    expect(logo).toBeLessThan(headline)
    expect(headline).toBeLessThan(headshot)
    expect(headshot).toBeLessThan(body)
  })

  it('renders the headline exactly once, not again in the body', () => {
    expect(build(H1 + BODY).match(/Your trial is ready/g)).toHaveLength(1)
  })

  it('tightens the headline margin now that the byline follows it directly', () => {
    const html = build(H1 + BODY)
    expect(html).toContain('<h1 style="margin:0;font-size:24px')
    expect(html).not.toContain('margin:0 0 20px;font-size:24px')
  })

  it('accepts leading whitespace before the headline (as template literals produce)', () => {
    const html = build('\n      ' + H1 + '\n' + BODY)
    expect(at(html, 'Your trial is ready')).toBeLessThan(at(html, 'headshot-ethna-parker'))
  })

  it('keeps the byline before the body when there is no headline', () => {
    const html = build(BODY)
    expect(html).not.toContain('<h1')
    expect(at(html, 'headshot-ethna-parker')).toBeLessThan(at(html, 'First paragraph of the body.'))
  })

  it('leaves a headline that is not at the start of the body where it is', () => {
    const html = build('<p>Intro first.</p>' + H1 + BODY)
    expect(at(html, 'headshot-ethna-parker')).toBeLessThan(at(html, 'Your trial is ready'))
    expect(html.match(/Your trial is ready/g)).toHaveLength(1)
  })

  it('applies the same order in broadcast mode', () => {
    const html = build(H1 + BODY, true)
    expect(at(html, 'Your trial is ready')).toBeLessThan(at(html, 'headshot-ethna-parker'))
    expect(at(html, 'headshot-ethna-parker')).toBeLessThan(at(html, 'First paragraph of the body.'))
  })
})
