# Marketing Claude Handoff — Cloudflare Migration

## What changed

The marketing site (`alwaysready-site`) has been migrated from **Netlify to Cloudflare Pages**. The live domain is still `alwaysready.uk`. The `pages.dev` preview URL is `alwaysready-marketing.pages.dev`.

---

## Hosting

| | Before | After |
|---|---|---|
| Host | Netlify | Cloudflare Pages |
| Branch | `main` | `preview` |
| Build command | `npx @11ty/eleventy` | `npx @11ty/eleventy` |
| Output directory | `_site` | `_site` |
| Deploy trigger | Push to `main` | Push to `preview` |

Pushing to the `preview` branch on GitHub triggers an automatic redeploy.

---

## Forms

Netlify Forms have been removed. Both forms now POST JSON directly to the AlwaysReady platform API (`portal.alwaysready.uk`).

| Form | Endpoint |
|---|---|
| Waitlist (`/waitlist/`) | `https://portal.alwaysready.uk/api/inbound-waitlist` |
| Contact (`/contact/`) | `https://portal.alwaysready.uk/api/inbound-contact` |

The platform API handles saving leads, creating support tickets, and sending auto-responder emails. Do not add Netlify form attributes (`data-netlify`, `netlify-honeypot`, hidden `form-name` inputs) to any forms.

---

## Chatbot function

The chatbot (`/chat`) is now a **Cloudflare Pages Function** at `functions/chat.js`. It uses:

- Export pattern: `export async function onRequestPost(context)` and `onRequestOptions()`
- `context.env.ANTHROPIC_API_KEY` (not `process.env`)
- Web API (`Request`, `Response`) — not Node.js `exports.handler`
- Model: `claude-haiku-4-5-20251001`

The `ANTHROPIC_API_KEY` secret is stored in Cloudflare Pages → Settings → Variables and secrets. Do not commit it to the repo.

The chatbot JS (`src/js/chatbot.js`) calls `ENDPOINT = '/chat'`.

---

## Security headers

Security headers are defined in a `_headers` file at the repo root. Eleventy copies it to `_site/_headers` at build time via:

```js
eleventyConfig.addPassthroughCopy({ "_headers": "_headers" });
```

Cloudflare Pages serves headers from `_site/_headers` automatically. Do not use Netlify's `netlify.toml` for headers.

If the Content Security Policy needs updating (e.g. to allow a new third-party script), edit the `_headers` file.

---

## Environment variables

Managed in Cloudflare Pages → Settings → Variables and secrets. Current variables:

| Name | Type |
|---|---|
| `ANTHROPIC_API_KEY` | Secret |
| `NODE_VERSION` | Plaintext (= `18`) |

Do not use Wrangler CLI to manage secrets — use the Cloudflare dashboard.

---

## What no longer exists

- Netlify Functions (`netlify/functions/`) — replaced by `functions/chat.js`
- `netlify.toml` — no longer relevant
- Netlify form attributes on any HTML/Nunjucks templates
- Netlify deploy context or redirects via `netlify.toml`
