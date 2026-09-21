#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node script run by CI, not bundled code */
/**
 * Fails when a database write's result is ignored.
 *
 * Supabase queries never throw: they resolve with `{ error }`. A write whose result is not
 * looked at fails invisibly and the code carries on as if it worked. The 2026-09-21 audit found
 * 33 of these (lost audit entries, stalled onboarding, silent opt-out failures). Handle the
 * result instead: lib/db-errors.ts (throwOnDbError / reportDbError) in app code,
 * e2e/support/db.ts (must / tidy) in tests.
 *
 * Uses the TypeScript parser, so multi-line chains are handled. It scans the whole repository
 * except build output and dependencies. It flags four shapes:
 *
 *   discarded          await s.from('t').update(...)                   (bare statement)
 *   error-not-bound    const { data } = await s.from('t').insert(...)  (no `error` taken out)
 *   error-never-read   const { error } = await ...insert(...)          (bound, never used after)
 *   result-never-used  const r = await ...insert(...)                  (whole result never used)
 *   error-only-logged  if (error) console.error(...)  and carry on     (noticed, then ignored)
 *
 * Run with `npm run check:silent-writes`; CI runs it on every PR.
 *
 * "error-only-logged" means the error is only ever read by console.* calls, or by an `if` whose
 * body does none of: return / throw / continue / break, call throwOnDbError / reportDbError / must /
 * tidy / captureException, push to an `errors`/`results` list, or assign or increment a variable
 * (recording the failure for later). A log line alone reaches nobody: use reportDbError, which also
 * sends it to Sentry, or handle it.
 *
 * Limits: it cannot judge whether the handling is the RIGHT one (an `if (error) return null` that
 * should have returned an error response passes), and it only recognises supabase-js chains
 * (`.from(...).insert/update/delete/upsert`).
 */
const ts = require('typescript')
const fs = require('fs')
const path = require('path')

const MUTATIONS = new Set(['insert', 'update', 'delete', 'upsert'])
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.vercel', 'coverage', 'test-results', 'playwright-report', 'supabase'])

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

/** The block (or file) whose remaining text decides whether a variable is ever used. */
function enclosingScope(node) {
  let cur = node.parent
  while (cur && !ts.isBlock(cur) && !ts.isSourceFile(cur) && !ts.isCaseClause(cur) && !ts.isDefaultClause(cur)) cur = cur.parent
  return cur
}

function tableOf(node) {
  const m = /\.from\(\s*['"`](\w+)/.exec(node.getText())
  return m ? m[1] : '?'
}

const HANDLER_CALL = /(^|\.)(throwOnDbError|reportDbError|must|tidy|captureException)$|\.push$/

/** True if this statement records, reports, or exits on failure (ignoring nested functions). */
function bodyHandles(stmt) {
  let handled = false
  function visit(n) {
    if (handled || ts.isFunctionLike(n)) return
    if (ts.isReturnStatement(n) || ts.isThrowStatement(n) || ts.isContinueStatement(n) || ts.isBreakStatement(n)) handled = true
    else if (ts.isCallExpression(n) && HANDLER_CALL.test(n.expression.getText())) handled = true
    else if (ts.isBinaryExpression(n) && n.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && n.operatorToken.kind <= ts.SyntaxKind.LastAssignment) handled = true
    else if ((ts.isPostfixUnaryExpression(n) || ts.isPrefixUnaryExpression(n)) && (n.operator === ts.SyntaxKind.PlusPlusToken || n.operator === ts.SyntaxKind.MinusMinusToken)) handled = true
    if (!handled) ts.forEachChild(n, visit)
  }
  visit(stmt)
  return handled
}

function insideConsoleCall(id) {
  for (let c = id.parent; c; c = c.parent) {
    if (ts.isCallExpression(c) && /^console\./.test(c.expression.getText())) return true
    if (ts.isBlock(c) || ts.isSourceFile(c)) return false
  }
  return false
}

/** True when `name` (a write's error) is read, but only in ways that leave the failure unhandled. */
function errorOnlyLogged(decl, name, scope) {
  let handled = false
  ;(function visit(n) {
    if (n.end <= decl.getEnd()) return
    if (ts.isIdentifier(n) && n.text === name && n.getStart() >= decl.getEnd() && !insideConsoleCall(n)) {
      let ifs = null
      for (let c = n.parent; c; c = c.parent) {
        if (ts.isIfStatement(c) && n.getStart() >= c.expression.getStart() && n.getEnd() <= c.expression.getEnd()) { ifs = c; break }
        if (ts.isBlock(c)) break
      }
      if (!ifs) handled = true // passed on: returned, assigned, given to another function...
      else if (HANDLER_CALL.test(ifs.expression.getText().replace(/\([\s\S]*$/, '')) || /\b(throwOnDbError|reportDbError|must|tidy|captureException)\s*\(/.test(ifs.expression.getText()) || bodyHandles(ifs.thenStatement)) handled = true
    }
    ts.forEachChild(n, visit)
  })(scope)
  return !handled
}

/** Returns [{ line, kind, op, table }] for every ignored database write in one source string. */
function findSilentWrites(source, fileName = 'file.ts') {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true)
  const found = []
  const add = (node, kind, op) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart())
    found.push({ line: line + 1, kind, op, table: tableOf(node) })
  }
  const usedLater = (decl, name) => {
    const scope = enclosingScope(decl)
    return !!scope && new RegExp('\\b' + name + '\\b').test(source.slice(decl.getEnd(), scope.getEnd()))
  }
  function visit(node) {
    if (ts.isExpressionStatement(node) && ts.isAwaitExpression(node.expression)) {
      const { methods, hasFrom } = chainInfo(node.expression)
      const op = methods.find(m => MUTATIONS.has(m))
      if (hasFrom && op) add(node, 'discarded', op)
    }
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isAwaitExpression(node.initializer)) {
      const { methods, hasFrom } = chainInfo(node.initializer)
      const op = methods.find(m => MUTATIONS.has(m))
      if (hasFrom && op) {
        if (ts.isObjectBindingPattern(node.name)) {
          const err = node.name.elements.find(e => (e.propertyName ? e.propertyName.getText() : e.name.getText()) === 'error')
          if (!err) add(node, 'error-not-bound', op)
          else if (!usedLater(node, err.name.getText())) add(node, 'error-never-read', op)
          else if (errorOnlyLogged(node, err.name.getText(), enclosingScope(node))) add(node, 'error-only-logged', op)
        } else if (ts.isIdentifier(node.name) && !usedLater(node, node.name.getText())) {
          add(node, 'result-never-used', op)
        }
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
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(e.name)) out.push(p)
  }
  return out
}

const MESSAGES = {
  'discarded':         'discards its result',
  'error-not-bound':   'takes the data but never looks at the error',
  'error-never-read':  'binds the error but never uses it',
  'result-never-used': 'never uses its result',
  'error-only-logged': 'only logs its error and carries on',
}

function main() {
  const root = path.resolve(__dirname, '..')
  const files = walk(root, [])
  let total = 0
  for (const file of files) {
    for (const f of findSilentWrites(fs.readFileSync(file, 'utf8'), file)) {
      console.error(`${path.relative(root, file)}:${f.line}  ${f.op} on ${f.table} ${MESSAGES[f.kind]}`)
      total++
    }
  }
  if (total > 0) {
    console.error(`\n${total} database write(s) ignore a failure. Handle it: throwOnDbError / reportDbError (lib/db-errors.ts), or must / tidy in tests (e2e/support/db.ts).`)
    process.exit(1)
  }
  console.log('check-silent-writes: no database write ignores its result.')
}

module.exports = { findSilentWrites }
if (require.main === module) main()
