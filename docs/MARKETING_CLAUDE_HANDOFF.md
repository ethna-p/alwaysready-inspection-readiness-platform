# Marketing Claude Handoff — alwaysready.uk

## Stack

The marketing site (`alwaysready-site`) is an Eleventy (11ty) site using Nunjucks templates, hosted on **Cloudflare Pages**. The live domain is `alwaysready.uk`. The `pages.dev` preview URL is `alwaysready-marketing.pages.dev`.

Pushing to the `preview` branch on GitHub triggers an automatic redeploy. Pushing to `main` deploys to production.

---

## Forms

Both forms POST JSON directly to the AlwaysReady platform API (`portal.alwaysready.uk`).

| Form | Endpoint |
|---|---|
| Waitlist (`/waitlist/`) | `https://portal.alwaysready.uk/api/inbound-waitlist` |
| Contact (`/contact/`) | `https://portal.alwaysready.uk/api/inbound-contact` |

The platform API handles saving leads, creating support tickets, and sending auto-responder emails. Do not add any third-party form attributes or hidden form fields to these forms — direct JSON POST is the correct and only approach.

---

## Chatbot function

The chatbot (`/chat`) is a **Cloudflare Pages Function** at `functions/chat.js`. It uses:

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

Cloudflare Pages serves headers from `_site/_headers` automatically.

If the Content Security Policy needs updating (e.g. to allow a new third-party script), edit the `_headers` file.

---

## Environment variables

Managed in Cloudflare Pages → Settings → Variables and secrets. Current variables:

| Name | Type |
|---|---|
| `ANTHROPIC_API_KEY` | Secret |
| `NODE_VERSION` | Plaintext (= `18`) |

Do not use Wrangler CLI to manage secrets — use the Cloudflare dashboard.
