#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node script run by CI, not bundled code */
/**
 * Fails when a database write's result is thrown away.
 *
 * Supabase queries never throw: they resolve with `{ error }`. A statement such as
 *
 *     await supabase.from('organisations').update({ ... }).eq('id', id)
 *
 * discards that result, so a failed write is invisible and the code carries on as if it worked.
 * The 2026-09-21 audit found 33 of these (lost audit entries, stalled onboarding, silent opt-out
 * failures). Handle the result instead: see lib/db-errors.ts (throwOnDbError / reportDbError).
 *
 * Uses the TypeScript parser, so multi-line chains are handled. It checks `app/` and `lib/`
 * (tests and e2e excluded). Run with `npm run check:silent-writes`; CI runs it on every PR.
 *
 * Limits: it finds a write used as a bare statement. It does not catch a result that is
 * destructured but never checked (`const { data } = await ...insert(...)`); review those by eye.
 */
const ts = require('typescript')
const fs = require('fs')
const path = require('path')

const MUTATIONS = new Set(['insert', 'update', 'delete', 'upsert'])
const SKIP_DIRS = new Set(['node_modules', '.next', '__tests__', 'e2e'])

/** Walks down `a.b().c()` collecting method names, unwrapping await and parentheses. */
function chainInfo(node) {
  let cur = node
  const methods = []
  let hasFrom = false
  while (cur) {
    if (ts.isAwaitExpression(cur) || ts.isParenthesizedExpression(cur)) { cur = cur.expression; continue }
    if (ts.isCallExpression(cur)) {
      const callee = cur.expression
      if (ts.isPropertyAccessExpression(callee)) {
        methods.push(callee.name.text)
        if (callee.name.text === 'from') hasFrom = true
        cur = callee.expression
        continue
      }
    }
    if (ts.isPropertyAccessExpression(cur)) { cur = cur.expression; continue }
    break
  }
  return { methods, hasFrom }
}

/** Returns [{ line, op, table }] for every discarded write in one source string. */
function findSilentWrites(source, fileName = 'file.ts') {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true)
  const found = []
  function visit(node) {
    if (ts.isExpressionStatement(node) && ts.isAwaitExpression(node.expression)) {
      const { methods, hasFrom } = chainInfo(node.expression)
      const op = methods.find(m => MUTATIONS.has(m))
      if (hasFrom && op) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart())
        const m = /\.from\(\s*['"`](\w+)/.exec(node.getText())
        found.push({ line: line + 1, op, table: m ? m[1] : '?' })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p)
  }
  return out
}

function main() {
  const root = path.resolve(__dirname, '..')
  const files = [...walk(path.join(root, 'app'), []), ...walk(path.join(root, 'lib'), [])]
  let total = 0
  for (const file of files) {
    for (const f of findSilentWrites(fs.readFileSync(file, 'utf8'), file)) {
      console.error(`${path.relative(root, file)}:${f.line}  ${f.op} on ${f.table} discards its result`)
      total++
    }
  }
  if (total > 0) {
    console.error(`\n${total} database write(s) ignore their result. Handle it with throwOnDbError / reportDbError (lib/db-errors.ts).`)
    process.exit(1)
  }
  console.log('check-silent-writes: no database write discards its result.')
}

module.exports = { findSilentWrites }
if (require.main === module) main()
