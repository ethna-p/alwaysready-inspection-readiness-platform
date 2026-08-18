# Marketing Claude Handoff — Legal Page Updates

## Context

The `/legal` page on `alwaysready.uk` is a single Nunjucks file. The full policy text was rewritten in July 2026. A small number of updates are now needed to bring it in line with current infrastructure and confirmed data handling facts.

**File to edit:** `src/legal.njk`
**Deploy:** Push to the `preview` branch → Cloudflare Pages redeploys automatically.

---

## The site stack

This is an Eleventy (11ty) site using Nunjucks templates. You do not need to touch any other file for legal page changes — `src/legal.njk` is self-contained.

The site is hosted on **Cloudflare Pages**.

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

### 2. Sub-processors table — marketing site host

**Where:** Same sub-processors table.

**Ensure the table contains:**
```html
<tr><td>Cloudflare</td><td>Marketing website hosting, CDN, DNS and security</td><td>US (global edge)</td></tr>
```

**Why:** Cloudflare Pages hosts the marketing site and handles DNS, CDN, and security. Check whether Cloudflare already appears in the table (it may be listed for the platform). If so, update its description to cover both the platform and the marketing site, or add a second row scoped to the marketing site — either is acceptable.

---

### 3. Cookie Policy — remove any legacy form processor session cookie row

**Where:** Section "Cookie Policy" → "Cookies we use" table.

**Remove any row referencing a third-party form processor session cookie** if present — forms now POST directly to `portal.alwaysready.uk` and no third-party session cookies are set.

---

### 4. Cookie Policy — third-party services list

**Where:** Section "Cookie Policy" → "Third-party services" list.

**Ensure the list includes:**
```html
<li><strong>Cloudflare</strong> hosts the website and provides CDN, DNS and security services. May set security-related cookies.</li>
```

Remove any entry for a hosting provider other than Cloudflare.

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

1. Edit `src/legal.njk` with the changes above
2. Push to the `preview` branch
3. Cloudflare Pages will redeploy automatically — no manual build step needed
4. Verify at `alwaysready.uk/legal` that the sub-processors table and cookie table look correct

---

## Notes for AJ to review before publishing

- **Contact email:** Confirm `support@alwaysready.uk` is the canonical address for legal/privacy contact. Currently used consistently throughout the site.

- **DPA:** The Privacy Policy and T&Cs both say a Data Processing Agreement is "available on request." Once the DPA is drafted and solicitor-reviewed, consider whether to publish it at `/dpa` on `portal.alwaysready.uk` and update these references to a link.

- **Solicitor review:** The full policies (Privacy Policy, T&Cs, Cancellation Policy) are pending solicitor review. The changes in this doc are factual/infrastructure corrections only and don't require solicitor sign-off. The broader policy text does.
