/**
 * Starts the Stripe CLI's webhook forwarder for a spec, and stops it afterwards.
 *
 * e2e/subscribe.spec.ts checks that a REAL Stripe checkout activates the organisation, and the only way
 * Stripe's real event reaches a local server is `stripe listen` forwarding it. That used to be a manual
 * step someone had to remember, which failed the spec every session it was forgotten. The spec now starts
 * it itself.
 *
 * The test-mode secret key is passed to the CLI through its environment (STRIPE_API_KEY), so it appears
 * in no command line, log or output, and it is refused unless it starts with sk_test_. The signing secret
 * the CLI prints must match STRIPE_WEBHOOK_SECRET, which the dev server was started with; if it does not,
 * this fails with that explanation instead of a confusing timeout later.
 *
 * If a forwarder is already running (started by hand), it is left alone and reused.
 */
import { spawn, execFileSync, type ChildProcess } from 'node:child_process'

export interface StripeListener { stop: () => void }

function alreadyRunning(): boolean {
  try {
    execFileSync('pgrep', ['-f', 'stripe listen'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export async function startStripeListener(env: Record<string, string>, port = 3100): Promise<StripeListener> {
  if (alreadyRunning()) return { stop: () => {} }

  const key = env.STRIPE_SECRET_KEY
  if (!key?.startsWith('sk_test_')) {
    throw new Error('STRIPE_SECRET_KEY in .env.local is not a test-mode key (sk_test_...). Refusing to start the Stripe listener.')
  }

  let child: ChildProcess
  try {
    child = spawn('stripe', ['listen', '--forward-to', `localhost:${port}/api/stripe-webhook`], {
      env: { ...process.env, STRIPE_API_KEY: key },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch {
    throw new Error('Could not start the Stripe CLI. Install it (brew install stripe/stripe-cli/stripe) or start `stripe listen` yourself.')
  }

  const stop = () => { if (!child.killed) child.kill() }

  await new Promise<void>((resolve, reject) => {
    let output = ''
    const timer = setTimeout(() => { stop(); reject(new Error(`Stripe listener did not become ready within 30s. Output so far:\n${output.replace(/sk_[A-Za-z0-9_]+/g, '[redacted]')}`)) }, 30_000)
    const onData = (d: Buffer) => {
      output += d.toString()
      if (!output.includes('Ready!')) return
      clearTimeout(timer)
      const secret = /whsec_[A-Za-z0-9]+/.exec(output)?.[0]
      if (secret && secret !== env.STRIPE_WEBHOOK_SECRET) {
        stop()
        reject(new Error('The Stripe listener signing secret does not match STRIPE_WEBHOOK_SECRET in .env.local, so the dev server would reject its events. Update .env.local to the secret `stripe listen` prints.'))
        return
      }
      resolve()
    }
    child.stdout?.on('data', onData)
    child.stderr?.on('data', onData)
    child.on('error', () => { clearTimeout(timer); reject(new Error('Could not start the Stripe CLI. Install it (brew install stripe/stripe-cli/stripe) or start `stripe listen` yourself.')) })
    child.on('exit', code => { clearTimeout(timer); if (code) reject(new Error(`stripe listen exited with code ${code}. Output:\n${output.replace(/sk_[A-Za-z0-9_]+/g, '[redacted]')}`)) })
  })

  return { stop }
}
