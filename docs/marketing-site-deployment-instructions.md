# AlwaysReady Marketing Site — Deployment Instructions for Claude

These instructions must be followed every time changes are made to the marketing site files.

---

## The workflow

The marketing site uses a three-step deployment chain:

**Local files → GitHub → Netlify (live site)**

1. Changes are made to the local files in the `alwaysready-site` folder
2. Those changes are pushed to GitHub (`ethna-p/alwaysready-marketing`)
3. Netlify detects the push and automatically deploys to alwaysready.uk

Claude makes changes to the local files directly. AJ then pushes to GitHub via Terminal. Netlify handles the rest automatically.

---

## After making any changes

Once file edits are complete, give AJ the following Terminal commands to run in order:

```bash
cd ~/alwaysready-site
git add .
git commit -m "Brief description of what changed"
git push
```

AJ should replace "Brief description of what changed" with a short plain-English summary of what was updated — for example:
- `"Update pricing page with founding member rate"`
- `"Add security and data protection page"`
- `"Fix typo on home page hero section"`

---

## Checking the live site

After pushing, Netlify usually deploys within 1–2 minutes. AJ can check the live site at:

- **alwaysready.uk** — home page
- **Netlify dashboard** — for deploy status and logs

If a change isn't showing, ask AJ to hard-refresh the browser (Cmd+Shift+R on Mac).

---

## Important rules

- **Never touch the platform app** — the `alwaysready-inspection-readiness-platform` folder is a completely separate project. Never edit, reference, or push changes to it from this project.
- **Never commit secrets** — no API keys, passwords, or credentials should ever appear in these files.
- **All copy changes should be reviewed by AJ** before pushing to GitHub.
- **Never write clinical content** — AlwaysReady is a governance tool. No resident-specific care or clinical content, ever.
- **Check the brief** — before writing any new copy, read `marketing-site-brief.md` to ensure tone, pricing, and facts are consistent.
- **Check the security statement** — before writing any security or data protection copy, read `security-statement-draft.md`. Do not make claims that go beyond what is documented there.

---

## File structure overview

```
alwaysready-site/
├── index.html              — Home page
├── about.html              — About AlwaysReady
├── how-it-works.html       — How the platform works
├── pricing.html            — Pricing and trial information
├── blog.html               — Blog index
├── blog-*.html             — Individual blog posts (~19 published)
├── contact.html            — Contact page
├── legal.html              — Privacy policy and terms
├── resources.html          — Resources for care managers
├── waitlist.html           — Waitlist / early access signup
├── start-free-trial.html   — Free trial / demo CTA page
├── css/                    — Stylesheets
├── js/                     — JavaScript files
├── images/                 — Image assets
├── fonts/                  — Font files
├── blog/                   — Blog assets folder
├── data/                   — Data files
├── tools/                  — Tools folder
├── netlify/                — Netlify configuration
└── netlify.toml            — Netlify build settings
```

---

## GitHub details

- **Repository:** `ethna-p/alwaysready-marketing`
- **Branch:** `main`
- **Remote:** configured as `origin`

If git push fails with an authentication error, AJ will need to use their GitHub Personal Access Token. The token has a 3-month expiry — if it has expired, a new one needs to be generated at github.com → Settings → Developer settings → Personal access tokens.

---

*These instructions were written in July 2026. Update if the deployment setup changes.*
