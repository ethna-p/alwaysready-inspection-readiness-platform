# Deleting Unsubscribed / Churned Users

Run this in the Supabase SQL Editor to cleanly remove a user and all their associated data.

---

## Step 1 — Identify the user

```sql
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

Note the `id` (UUID) — you'll need it below.

---

## Step 2 — Run the full cleanup

Replace `'USER_ID_HERE'` with the UUID from Step 1.

```sql
DO $$
DECLARE
  target_id uuid := 'USER_ID_HERE';
BEGIN

  -- History tables (NOT NULL on changed_by — must delete)
  DELETE FROM compliance_record_history    WHERE changed_by   = target_id;
  DELETE FROM review_frequency_history     WHERE changed_by   = target_id;
  DELETE FROM priority_history             WHERE changed_by   = target_id;
  DELETE FROM i_statement_evidence_history WHERE recorded_by  = target_id;

  -- Activity / audit tables
  DELETE FROM klo_checklist_completions    WHERE completed_by = target_id;
  DELETE FROM kloe_evidence                WHERE uploaded_by  = target_id;
  DELETE FROM mock_inspections             WHERE conducted_by = target_id;
  DELETE FROM post_inspection_reviews      WHERE created_by   = target_id;
  DELETE FROM governance_meetings          WHERE created_by   = target_id
                                              OR signed_off_by = target_id;
  DELETE FROM fac_items                    WHERE created_by   = target_id;
  DELETE FROM action_items                 WHERE created_by   = target_id
                                              OR assigned_to  = target_id
                                              OR completed_by = target_id;
  DELETE FROM incidents                    WHERE reported_by  = target_id
                                              OR closed_by    = target_id;
  DELETE FROM i_statement_evidence         WHERE updated_by   = target_id;

  -- Support tables
  DELETE FROM support_ticket_replies       WHERE sent_by      = target_id;
  DELETE FROM support_tickets              WHERE submitted_by = target_id;

  -- HR tables
  DELETE FROM hr_training_certificates     WHERE uploaded_by  = target_id;
  DELETE FROM hr_absence_records           WHERE user_id      = target_id
                                              OR recorded_by  = target_id;
  DELETE FROM hr_holiday_allowances        WHERE user_id      = target_id;
  DELETE FROM hr_training_records          WHERE user_id      = target_id;
  DELETE FROM hr_staff_profiles            WHERE user_id      = target_id;

  -- Nullable columns — null out rather than delete the parent row
  UPDATE compliance_records SET last_updated_by = NULL WHERE last_updated_by = target_id;
  UPDATE compliance_records SET assigned_to     = NULL WHERE assigned_to     = target_id;

  -- Delete the auth user (Supabase cascades to auth.identities, sessions, etc.)
  DELETE FROM auth.users WHERE id = target_id;

END $$;
```

---

## Deleting multiple users at once

If you need to remove several users in one run, replace the single UUID with an array:

```sql
DO $$
DECLARE
  target_ids uuid[] := ARRAY[
    'UUID-ONE',
    'UUID-TWO',
    'UUID-THREE'
  ];
BEGIN

  DELETE FROM compliance_record_history    WHERE changed_by   = ANY(target_ids);
  DELETE FROM review_frequency_history     WHERE changed_by   = ANY(target_ids);
  DELETE FROM priority_history             WHERE changed_by   = ANY(target_ids);
  DELETE FROM i_statement_evidence_history WHERE recorded_by  = ANY(target_ids);
  DELETE FROM klo_checklist_completions    WHERE completed_by = ANY(target_ids);
  DELETE FROM kloe_evidence                WHERE uploaded_by  = ANY(target_ids);
  DELETE FROM mock_inspections             WHERE conducted_by = ANY(target_ids);
  DELETE FROM post_inspection_reviews      WHERE created_by   = ANY(target_ids);
  DELETE FROM governance_meetings          WHERE created_by   = ANY(target_ids)
                                              OR signed_off_by = ANY(target_ids);
  DELETE FROM fac_items                    WHERE created_by   = ANY(target_ids);
  DELETE FROM action_items                 WHERE created_by   = ANY(target_ids)
                                              OR assigned_to  = ANY(target_ids)
                                              OR completed_by = ANY(target_ids);
  DELETE FROM incidents                    WHERE reported_by  = ANY(target_ids)
                                              OR closed_by    = ANY(target_ids);
  DELETE FROM i_statement_evidence         WHERE updated_by   = ANY(target_ids);
  DELETE FROM support_ticket_replies       WHERE sent_by      = ANY(target_ids);
  DELETE FROM support_tickets              WHERE submitted_by = ANY(target_ids);
  DELETE FROM hr_training_certificates     WHERE uploaded_by  = ANY(target_ids);
  DELETE FROM hr_absence_records           WHERE user_id      = ANY(target_ids)
                                              OR recorded_by  = ANY(target_ids);
  DELETE FROM hr_holiday_allowances        WHERE user_id      = ANY(target_ids);
  DELETE FROM hr_training_records          WHERE user_id      = ANY(target_ids);
  DELETE FROM hr_staff_profiles            WHERE user_id      = ANY(target_ids);
  UPDATE compliance_records SET last_updated_by = NULL WHERE last_updated_by = ANY(target_ids);
  UPDATE compliance_records SET assigned_to     = NULL WHERE assigned_to     = ANY(target_ids);
  DELETE FROM auth.users WHERE id = ANY(target_ids);

END $$;
```

---

## Notes

- Always run the `SELECT` in Step 1 first to confirm you have the right user before deleting.
- If a new table is added to the platform that references `auth.users`, add a `DELETE` line for it here.
- The organisation itself (and its compliance data) is separate — use the superadmin Organisations page to delete the org, which handles its own cascade. This script handles the **user account** only.
