# AlwaysReady Marketing Site — Deployment Instructions for Claude

These instructions must be followed every time changes are made to the marketing site files.

---

## The workflow

The marketing site uses a three-step deployment chain:

**Local files → GitHub (`main` branch) → Cloudflare Pages (live site)**

1. Claude makes changes to the local files in the `alwaysready-site` folder
2. AJ pushes those changes to GitHub via Terminal
3. Cloudflare Pages detects the push to `main` and automatically deploys to alwaysready.uk

Cloudflare deploys within 1–2 minutes of a push to `main`. There is no manual deploy step.

---

## The branch rule — non-negotiable

**Always commit and push to `main`.** `main` is the production branch. Cloudflare Pages is configured to deploy from `main`.

The `preview` branch exists but is NOT connected to any deploy. Do not use it for routine work.

If you are ever unsure which branch is checked out, run:

```bash
git branch
```

The branch with `*` next to it is the active one. If it is not `main`, switch before committing:

```bash
git checkout main
```

---

## After making any changes

Once file edits are complete, give AJ the following Terminal commands to run in order:

```bash
cd ~/Sites/alwaysready-site
git add .
git commit -m "Brief description of what changed"
git push origin main
```

AJ should replace "Brief description of what changed" with a short plain-English summary — for example:
- `"Update pricing page"`
- `"Add founder photo to About page"`
- `"Fix typo on home page hero section"`

---

## CSS versioning

When editing `style.css` or `chatbot.css`, bump the `?v=N` query string on the relevant `<link>` tag in `src/_includes/layouts/base.njk`:

```html
<link rel="stylesheet" href="/css/style.css?v=5">
<link rel="stylesheet" href="/css/chatbot.css?v=5">
```

Increment the number by 1 each time. This ensures browsers pick up the updated file.

---

## Checking the live site

After pushing, Cloudflare usually deploys within 1–2 minutes. AJ can check:

- **alwaysready.uk** — live site
- **Cloudflare Pages dashboard** — for deploy status and logs (Pages → alwaysready-marketing → Deployments)

If a change isn't showing, ask AJ to hard-refresh the browser (Cmd+Shift+R on Mac).

---

## If a git push fails

**Non-fast-forward rejection** (`Updates were rejected because the remote contains work`):

```bash
git pull --rebase origin main
git push origin main
```

**Authentication error** (`could not read Username`): AJ needs to use their GitHub Personal Access Token. Tokens expire every 3 months — if expired, generate a new one at github.com → Settings → Developer settings → Personal access tokens.

**`.git/index.lock` exists error**: Another git process was interrupted. Remove the lock file and retry:

```bash
rm .git/index.lock
git push origin main
```

---

## Important rules

- **Never touch the platform app** — the `alwaysready-inspection-readiness-platform` folder is a completely separate project. Never edit, reference, or push changes to it from this project.
- **Never commit secrets** — no API keys, passwords, or credentials should ever appear in these files.
- **All copy changes should be reviewed by AJ** before pushing to GitHub.
- **Never write clinical content** — AlwaysReady is a governance tool only.
- **Check the CLAUDE.md** — the marketing site repo's own `CLAUDE.md` has the canonical rules for blog posts, OG images, and site structure.

---

## File structure overview

```
alwaysready-site/
├── src/
│   ├── _includes/layouts/  — Nunjucks layouts (base.njk, blog-post.njk)
│   ├── _data/              — Global data files
│   ├── css/style.css       — Single stylesheet
│   ├── js/                 — JavaScript (main.js, chatbot.js)
│   ├── images/             — Image assets
│   ├── fonts/              — Font files
│   ├── downloads/          — Downloadable resources
│   ├── .well-known/        — security.txt
│   └── *.njk               — Page files
├── functions/
│   └── chat.js             — Cloudflare Pages Function (Ara chatbot proxy)
├── _headers                — Cloudflare security headers
├── .eleventy.js            — Eleventy configuration
└── scripts/make_og.py      — OG image generator
```

---

## GitHub details

- **Repository:** `ethna-p/alwaysready-marketing`
- **Production branch:** `main`
- **Remote:** configured as `origin`
- **Hosting:** Cloudflare Pages — auto-deploys on push to `main`

---

*Last updated: August 2026*
