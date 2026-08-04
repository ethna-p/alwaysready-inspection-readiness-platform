-- Track which nurture emails have been sent to each waitlist lead.
-- nurture_emails_sent: count of emails sent so far (0 = none, max 8)
-- nurture_last_sent_at: timestamp of the most recent nurture email sent

ALTER TABLE waitlist_leads
  ADD COLUMN nurture_emails_sent smallint NOT NULL DEFAULT 0,
  ADD COLUMN nurture_last_sent_at timestamptz;
