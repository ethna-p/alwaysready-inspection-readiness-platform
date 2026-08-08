# Marketing Claude Handoff — Legal Page Updates

## Context

The `/legal` page on `alwaysready.uk` is a single Nunjucks file. The full policy text was rewritten in July 2026. A small number of updates are now needed to bring it in line with current infrastructure and confirmed data handling facts.

**File to edit:** `src/legal.njk`
**Deploy:** Push to the `preview` branch → Cloudflare Pages redeploys automatically.

---

## The site stack

This is an Eleventy (11ty) site using Nunjucks templates. You do not need to touch any other file for legal page changes — `src/legal.njk` is self-contained.

The site was migrated from Netlify to **Cloudflare Pages** in 2026. This is directly relevant to some of the changes below.

---

## Changes required

### 1. Sub-processors table — Supabase location

**Where:** Section "4. Sub-processors" — the `<table>` in the Privacy Policy section.

**Current:**
```html
<tr><td>Supabase</td><td>Platform database and user authentication</td><td>EU / US</td></tr>
```

**Change to:**
```html
<tr><td>Supabase</td><td>Platform database and user authentication</td><td>EU</td></tr>
```

**Why:** The Supabase project is configured to the EU region. "EU / US" was a placeholder. This is now confirmed.

---

### 2. Sub-processors table — Netlify → Cloudflare

**Where:** Same sub-processors table.

**Current:**
```html
<tr><td>Netlify</td><td>Marketing website hosting and form processing</td><td>US</td></tr>
```

**Change to:**
```html
<tr><td>Cloudflare</td><td>Marketing website hosting, CDN, DNS and security</td><td>US (global edge)</td></tr>
```

**Why:** The marketing site hosting and DNS has moved from Netlify to Cloudflare Pages. Netlify no longer hosts the site or processes forms — all forms now POST directly to the AlwaysReady platform API. Cloudflare is already listed in the platform's sub-processor table; it should also appear here as it's now the marketing site host.

Note: Cloudflare already appears as `<tr><td>Cloudflare</td><td>DNS, security, and inbound email routing</td><td>US (global edge)</td></tr>` — that entry refers to the platform (`portal.alwaysready.uk`). This Netlify → Cloudflare swap is in the same table and refers to the marketing site. You can either update the existing Cloudflare row to cover both, or replace the Netlify row with a new Cloudflare row scoped to the marketing site. The simplest approach: replace the Netlify row with a combined Cloudflare row that covers both, and remove the existing separate Cloudflare row (or keep them as two rows if you want to be more granular). Either is fine — just ensure Netlify is removed and Cloudflare appears once with accurate scope.

---

### 3. Cookie Policy — remove Netlify Forms session cookie

**Where:** Section "Cookie Policy" → "Cookies we use" table.

**Current row to remove:**
```html
<tr><td>Netlify Forms session</td><td>Enables secure form submission and spam prevention</td><td>Session only</td></tr>
```

**Why:** Forms no longer use Netlify. They POST directly to `portal.alwaysready.uk`. Netlify Forms session cookies are no longer set.

---

### 4. Cookie Policy — update Netlify third-party entry

**Where:** Section "Cookie Policy" → "Third-party services" list.

**Current:**
```html
<li><strong>Netlify</strong> hosts the website and processes form submissions. May set session cookies for security.</li>
```

**Change to:**
```html
<li><strong>Cloudflare</strong> hosts the website and provides CDN, DNS and security services. May set security-related cookies.</li>
```

**Why:** Netlify no longer hosts the site. Cloudflare Pages is now the host.

---

## What does NOT need changing

- The Privacy Policy text, GDPR sections, data retention table, data export section, DSAR contact details — all correct.
- The Terms and Conditions — correct.
- The Cancellation Policy — correct.
- The Acceptable Use Policy — correct.
- The Accessibility and Disclaimer sections — correct.
- All contact email addresses use `support@alwaysready.uk` — correct.
- The EEA data transfer language in the sub-processors section ("All data transfers outside the UK are protected by appropriate safeguards…") — correct.

---

## Deploy checklist

1. Edit `src/legal.njk` with the four changes above
2. Push to the `preview` branch
3. Cloudflare Pages will redeploy automatically — no manual build step needed
4. Verify at `alwaysready.uk/legal` that the sub-processors table and cookie table look correct

---

## Notes for AJ to review before Publishing

- **Contact email:** The legal draft (`docs/legal-policies-draft.md` in the platform repo) uses `hello@alwaysready.uk` in some places. The marketing site uses `support@alwaysready.uk` throughout. Confirm which address should be canonical for legal/privacy contact before solicitor review. Currently the site consistently uses `support@alwaysready.uk` — this is likely correct.

- **DPA:** The Privacy Policy and T&Cs both say a Data Processing Agreement is "available on request." Once the DPA is drafted and solicitor-reviewed, consider whether to publish it at `/dpa` on `portal.alwaysready.uk` and update these references to a link.

- **Solicitor review:** The full policies (Privacy Policy, T&Cs, Cancellation Policy) are pending solicitor review. The changes in this doc are factual/infrastructure corrections only and don't require solicitor sign-off. The broader policy text does.
