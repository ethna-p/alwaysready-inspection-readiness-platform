# Database and Storage Backup and Recovery Runbook

**Platform:** AlwaysReady Inspection Readiness Platform  
**Database:** Supabase (PostgreSQL) — see §1-6  
**Storage:** Supabase Storage, mirrored nightly to Cloudflare R2 — see §7  
**Last verified:** 31 August 2026  
**Last test restore:** Not yet completed  
**Current status:** FREE plan — no paying customers yet. Upgrade to Pro on launch day (see §8).

---

## 1. What backups exist

Supabase Pro tier provides two layers of backup:

**Daily backups (automatic)**
- Supabase takes a full database snapshot every 24 hours.
- Retained for 7 days.
- Available in: Supabase dashboard → Project Settings → Backups.

**Point-in-Time Recovery (PITR)**
- Continuous WAL (write-ahead log) archiving, allowing restore to any second within the retention window.
- Retention window: 7 days on Pro tier.
- Must be explicitly enabled — it is not on by default.
- Available in: Supabase dashboard → Project Settings → Backups → Point in Time Recovery.

> **⚠️ Action required — URGENT:** The production project (`alwaysready-production`) is currently on the **FREE plan**. Free plan has no automated backups and no PITR. The dashboard shows "No backups". Upgrade to **Supabase Pro (~$25/month)** immediately. Once upgraded, verify PITR is enabled under Project Settings → Backups.

---

## 2. Verification checklist

Complete this once now, then repeat annually (see §5).

- [ ] Log in to supabase.com → open the AlwaysReady project
- [ ] Go to **Project Settings → Backups**
- [ ] Confirm daily backups are listed and recent (at least one backup in the last 24 hours)
- [ ] Confirm **Point in Time Recovery** shows status **Enabled**
- [ ] Note the PITR retention window (should be 7 days on Pro)
- [ ] Record the date this check was completed above (§0 header)

---

## 3. Recovery scenarios

### Scenario A — Accidental deletion of a single row or small dataset

Use the Supabase Table Editor or SQL Editor to restore from a daily backup to a separate temporary project, query the rows you need, and INSERT them back into the live project.

Steps:
1. In Supabase dashboard → Backups, click **Restore** on the most recent backup taken before the deletion.
2. Choose **Restore to a new project** (not the live project — this avoids overwriting current data).
3. Wait for the restore to complete (typically 5–20 minutes).
4. In the restored project, open the SQL Editor and query the affected table to retrieve the deleted rows.
5. Copy the result, then run an INSERT on the live project to restore the rows.
6. Verify the live project reflects the correct state.
7. Delete the temporary restored project (to avoid unnecessary ongoing cost).

### Scenario B — Larger data loss or corrupted table

Use PITR to restore to a point in time just before the incident.

Steps:
1. Identify the time of the incident as precisely as possible (check Sentry, Vercel logs, or Supabase logs).
2. In Supabase dashboard → Backups → Point in Time Recovery, choose **Restore to a new project**.
3. Set the target timestamp to 1–2 minutes before the incident.
4. Wait for the restore to complete.
5. Verify the restored project contains the correct data.
6. If the restored project is to become the live database, update the environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` — new project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — new anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — new service role key
7. Redeploy the Vercel project to pick up the new env vars.
8. Run smoke tests: log in, check a KLOE compliance record, check a support ticket.

### Scenario C — Supabase project accidentally deleted

Contact Supabase support immediately at support.supabase.com. Supabase retains deleted project backups for a short window (typically 24–48 hours). Provide the project reference ID and the time of deletion.

Project reference ID: `yrychopwshnoplblrzyx`  
Project URL: `https://yrychopwshnoplblrzyx.supabase.co`

---

## 4. Recovery time objectives

These are targets, not guarantees. Actual time depends on database size and Supabase infrastructure load.

| Scenario | Target RTO | Notes |
|---|---|---|
| Single row restore | < 30 minutes | Manual query from a restored backup project |
| Table-level restore | < 2 hours | PITR to new project + data copy |
| Full project restore | < 4 hours | PITR to new project + Vercel env var update + smoke test |
| Supabase deletion | 24–48 hours | Dependent on Supabase support response |

---

## 5. Annual test restore procedure

Run this once per year to confirm backups are usable and the recovery procedure works.

1. Go to Supabase dashboard → Backups.
2. Select a daily backup from the previous day.
3. Click **Restore** → **Restore to a new project**.
4. Wait for the restore to complete.
5. Open the restored project → Table Editor → confirm data looks correct in `organisations`, `kloe_compliance_records`, and `users` tables.
6. Run a test query in the SQL Editor:
   ```sql
   SELECT COUNT(*) FROM organisations;
   SELECT COUNT(*) FROM kloe_compliance_records;
   SELECT COUNT(*) FROM users;
   ```
7. Confirm row counts match expectations.
8. Delete the temporary project.
9. Record the date and row counts in the log below.

---

## 6. Test restore log

| Date | Restored from | organisations | kloe_compliance_records | users | Notes |
|---|---|---|---|---|---|
| [TBC] | | | | | First test restore — to be completed |

---

## 7. Storage backup (Cloudflare R2)

Supabase's own daily backups and PITR (§1) cover the Postgres database only. Supabase's docs
are explicit that Storage objects are excluded: "Database backups do not include objects you
store via the Storage API, as the database only includes metadata about these objects." Without
a separate backup, a catastrophic Supabase failure would take every uploaded evidence file and
org logo with it, permanently, with no recovery path at all.

**What it is:** a nightly cron (`/api/cron/storage-backup`, 04:00 UTC, `lib/storage-backup.ts`)
that writes a complete snapshot of both Supabase Storage buckets (`evidence`, `org-logos`) into
a Cloudflare R2 bucket (`alwaysready-storage-backup`), under `{YYYY-MM-DD}/{bucket}/...`.

**Retention:** R2 has no native S3 bucket versioning, so this isn't a single mirrored copy kept
under version history. Each night's run is a fresh, complete, self-contained dated folder. A
lifecycle rule on the R2 bucket itself (Settings → Object Lifecycle Rules) deletes objects older
than 30 days, so each dated folder ages out on its own after 30 days — no delete logic runs in
the app. This also means a file a customer genuinely deleted (or the data-deletion cron erased)
simply stops appearing in new snapshots and ages out of the retained window naturally, rather
than being kept forever in a backup.

**Monitoring:** like every other scheduled job, this one stamps `cron_heartbeats` on success
(`withHeartbeat` in `lib/cron-health.ts`) and `/api/health` will report it stale if it goes
quiet for more than 27 hours. It skips cleanly (200, `sent: false`) if the R2 environment
variables aren't configured, the same pattern as every other optional integration.

**Credentials:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
are set in Vercel's environment variables (production). The R2 API token is scoped to
Object Read and Write on this one bucket only.

### Recovery scenario — restoring lost Storage files

1. In the Cloudflare dashboard, open **R2 Object Storage** → `alwaysready-storage-backup`.
2. Browse to the most recent dated folder before the loss (`{YYYY-MM-DD}/{bucket}/...`).
3. Download the needed object(s) (R2's dashboard supports direct download, or use an S3-
   compatible client with the same credentials as the backup job).
4. Re-upload the file(s) to the corresponding path in the live Supabase Storage bucket, either
   via the Supabase dashboard's Storage browser or a one-off script using the service role key.
5. Confirm the file is reachable through the app (e.g. an evidence record's download link).

### Recovery time objective

| Scenario | Target RTO | Notes |
|---|---|---|
| Single file restore | < 15 minutes | Manual download from R2 + re-upload to Supabase |
| Full bucket restore | < 2 hours | Bulk download from the most recent dated folder + re-upload |

---

## 8. Launch day checklist

Complete these steps before the first paying customer signs up:

- [ ] Upgrade `alwaysready-production` Supabase project to **Pro plan** (~$25/month): Supabase dashboard → Settings → Billing → Upgrade
- [ ] Confirm daily backups are active: Settings → Backups → at least one backup listed
- [ ] Enable Point in Time Recovery: Settings → Backups → Point in Time Recovery → Enable
- [ ] Complete first test restore (§5) and fill in the log (§6)
- [ ] Record date completed in the header of this document

---

## 10. Contacts

| Resource | URL |
|---|---|
| Supabase dashboard | supabase.com |
| Supabase support | support.supabase.com |
| Supabase status page | status.supabase.com |
| Vercel dashboard | vercel.com/ethna-p |
| Sentry (error logs) | sentry.io |
