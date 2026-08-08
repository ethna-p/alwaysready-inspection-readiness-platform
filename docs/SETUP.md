# AlwaysReady Platform — Step 1 Setup

Everything needed to run the app locally and apply the first migrations.
Run these commands from the project root unless stated otherwise.

---

## 1 — Install dependencies

```bash
npm install
```

---

## 2 — Environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase project URL and anon key.
Find both in the Supabase dashboard under **Project Settings → API**.

---

## 3 — Link to your Supabase project

If you haven't already installed the Supabase CLI:

```bash
npm install -g supabase
```

Then link this repo to your project (use the project ref from the Supabase dashboard URL):

```bash
supabase link --project-ref <your-project-ref>
```

---

## 4 — Apply migrations

This pushes all four migration files to your remote Supabase database:

```bash
supabase db push
```

This creates:
- `key_questions` — 5 CQC key questions, seeded
- `service_types` — 11 adult social care types, seeded
- `organisations` — multi-tenant org table
- `users` — extends Supabase Auth with role + org
- RLS policies and GRANTs on all tables
- `get_user_org_id()` helper function

---

## 5 — Create a test user and organisation

The `public.users` row is **not** created automatically on sign-up (by design —
`organisation_id` isn't known at sign-up time). Use the Supabase dashboard or
the SQL editor to set up a test record:

**Step A — Create an auth user** in the Supabase dashboard:
Authentication → Users → Add user. Note the UUID Supabase assigns.

**Step B — Create an organisation** (SQL editor):

```sql
-- Get the service_type id for Residential Care Home
-- (the demo service type, confirmed in the brief)
SELECT id FROM service_types WHERE name = 'Residential Care Home';

-- Insert the org (replace the service_type_id with the UUID from above)
INSERT INTO organisations (name, service_type_id, subscription_tier)
VALUES ('Test Care Home', '<service_type_id>', 'trial')
RETURNING id;
```

**Step C — Link the auth user to the org** (SQL editor):

```sql
-- Replace both UUIDs with real values
INSERT INTO public.users (id, organisation_id, email, role)
VALUES (
  '<auth-user-uuid>',
  '<organisation-id>',
  'your@email.com',
  'rcm'
);
```

---

## 6 — Run locally

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.
Sign in with the credentials from Step 5A to reach the dashboard.

The dashboard confirmation panel will show your email, organisation name,
service type, and role — confirming auth and RLS are working end-to-end.

---

## What's next

Step 2 builds the `klo_items` table seeded from the KLOE reference CSV,
then Step 3 adds `compliance_records` and the audit trail tables.
