import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const { findSilentWrites } = createRequire(import.meta.url)('../../scripts/check-silent-writes.js') as {
  findSilentWrites: (source: string) => { line: number; op: string; table: string }[]
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
      { line: 2, op: 'insert', table: 'a' },
      { line: 3, op: 'update', table: 'b' },
      { line: 7, op: 'delete', table: 'c' },
      { line: 8, op: 'upsert', table: 'd' },
    ])
  })

  it('accepts writes whose result is used', () => {
    const src = `async function f(s) {
  const { error } = await s.from('a').insert({ x: 1 })
  reportDbError((await s.from('b').delete().eq('id', 1)).error, 'ctx')
  const r = await s.from('c').update({ y: 1 }).eq('id', 1)
  return await s.from('d').upsert({ z: 1 })
}`
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
