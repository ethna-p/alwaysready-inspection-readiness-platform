import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const { findSilentWrites } = createRequire(import.meta.url)('../../scripts/check-silent-writes.js') as {
  findSilentWrites: (source: string) => { line: number; kind: string; op: string; table: string }[]
}

describe('check-silent-writes', () => {
  it('flags a bare awaited write, including a multi-line chain', () => {
    const src = `async function f(s) {
  await s.from('a').insert({ x: 1 })
  await s
    .from('b')
    .update({ y: 2 })
    .eq('id', 1)
  await s.from('c').delete().eq('id', 1)
  await s.from('d').upsert({ z: 3 })
}`
    expect(findSilentWrites(src)).toEqual([
      { line: 2, kind: 'discarded', op: 'insert', table: 'a' },
      { line: 3, kind: 'discarded', op: 'update', table: 'b' },
      { line: 7, kind: 'discarded', op: 'delete', table: 'c' },
      { line: 8, kind: 'discarded', op: 'upsert', table: 'd' },
    ])
  })

  it('accepts writes whose result is used', () => {
    const src = `async function f(s) {
  const { error } = await s.from('a').insert({ x: 1 })
  if (error) throw error
  reportDbError((await s.from('b').delete().eq('id', 1)).error, 'ctx')
  const r = await s.from('c').update({ y: 1 }).eq('id', 1)
  if (r.error) throw r.error
  return await s.from('d').upsert({ z: 1 })
}`
    expect(findSilentWrites(src)).toEqual([])
  })

  it('flags a result taken out but never checked for an error', () => {
    const src = `async function f(s) {
  const { data } = await s.from('a').insert({ x: 1 }).select('id')
  const { error } = await s.from('b').update({ y: 1 }).eq('id', 1)
  const result = await s.from('c').delete().eq('id', 1)
  return data
}`
    expect(findSilentWrites(src)).toEqual([
      { line: 2, kind: 'error-not-bound', op: 'insert', table: 'a' },
      { line: 3, kind: 'error-never-read', op: 'update', table: 'b' },
      { line: 4, kind: 'result-never-used', op: 'delete', table: 'c' },
    ])
  })

  it('accepts an error that is used later, including in a wrapper call', () => {
    const src = `async function f(s) {
  const { data, error } = await s.from('a').insert({ x: 1 }).select('id')
  if (error) return null
  const r = await s.from('b').update({ y: 1 })
  must(r, 'ctx')
  return data
}`
    expect(findSilentWrites(src)).toEqual([])
  })

  it('flags an error that is only logged, then carried on', () => {
    const src = `async function a(s) {
  const { error } = await s.from('t').update({ a: 1 })
  if (error) console.error('failed', error)
  return 1
}
async function b(s) {
  const { error } = await s.from('t').update({ a: 1 })
  if (error) {
    console.error('failed', error)
  }
}
async function c(s) {
  const { error } = await s.from('t').update({ a: 1 })
  console.error(error)
}`
    expect(findSilentWrites(src).map(f => f.kind)).toEqual(['error-only-logged', 'error-only-logged', 'error-only-logged'])
  })

  it('accepts an error that is returned, thrown, reported, recorded or passed on', () => {
    const src = `async function a(s) { const { error } = await s.from('t').update({}); if (error) return { ok: false } }
async function b(s) { const { error } = await s.from('t').update({}); if (error) throw error }
async function c(s) { const { error } = await s.from('t').update({}); if (reportDbError(error, 'x')) { markFailed() } }
async function d(s) { const { error } = await s.from('t').update({}); if (error) { console.error(error); failed = true } }
async function e(s) { const { error } = await s.from('t').update({}); if (error) { console.error(error); errors.push('x') } }
async function f(s) { const { error } = await s.from('t').update({}); return handle(error) }
async function g(s) { for (const x of xs) { const { error } = await s.from('t').update({}); if (error) { console.error(error); continue } } }`
    expect(findSilentWrites(src)).toEqual([])
  })

  it('ignores reads and non-database calls', () => {
    const src = `async function f(s) {
  await s.from('a').select('id')
  await sendEmail({ to: 'x' })
  await list.update({ a: 1 })
}`
    expect(findSilentWrites(src)).toEqual([])
  })
})
