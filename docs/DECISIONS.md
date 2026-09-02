# Standing Decisions — AlwaysReady Platform

Decisions recorded here are final unless AJ explicitly says otherwise.
Do not revisit or re-raise them unprompted.

---

## No separate demo environment

**Decided early in the project. Final.**

There is no separate demo Supabase project, no shadow organisations, no per-session isolation mechanism, and no demo reset flow.

The 14-day free trial IS the demo. Anyone who wants to evaluate the platform signs up for a trial. On subscription, it becomes their live account.

Any references in PROJECT_BRIEF.md to a separate demo environment, shadow organisations, or per-session isolation are superseded by this decision.

---

## No VAT on pricing

**Decided July 2026.**

AlwaysReady is not VAT-registered (threshold not reached). All pricing is shown as flat amounts with no VAT. Current subscription price: £75/month.

Do not add "+ VAT" to any pricing copy, UI text, or emails.

---

## Git push command format

**Decided September 2026. Final.**

Always use `git push origin main` — never a URL-based push. The remote `origin` is already configured on both repos.

Platform:
```
cd ~/Sites/alwaysready-inspection-readiness-platform && git push origin main
```

Marketing site:
```
cd ~/Sites/alwaysready-site && git push origin main
```

AJ has one terminal window — always specify which repo the command is for.

---

## Charity discount

**Decided July 2026.**

- 20% off every monthly payment, permanently, for eligible registered charities.
- Applied automatically via `STRIPE_CHARITY_COUPON_ID` at Stripe checkout when `is_charity = true` on the organisation.
- The discount code is never shared — only AJ can flip the `is_charity` toggle via the superadmin organisations page.
- Charities sign up for the standard 14-day trial, then email hello@alwaysready.uk with their charity registration number. AJ enables the toggle before they hit checkout.
