-- Migration: Add description column to key_questions
-- Stores the official CQC "what this means for you" text for each of the
-- five key questions, verbatim from the CQC assessment framework.
-- These descriptions are surfaced in the UI on the KLOEs list and detail pages.

ALTER TABLE public.key_questions
  ADD COLUMN description text;

UPDATE public.key_questions
SET description = $$you are protected from abuse and avoidable harm.$$
WHERE name = $$Safe$$;

UPDATE public.key_questions
SET description = $$your care, treatment and support achieves good outcomes, helps you to maintain quality of life and is based on the best available evidence.$$
WHERE name = $$Effective$$;

UPDATE public.key_questions
SET description = $$staff involve and treat you with compassion, kindness, dignity and respect.$$
WHERE name = $$Caring$$;

UPDATE public.key_questions
SET description = $$services are organised so that they meet your needs.$$
WHERE name = $$Responsive$$;

UPDATE public.key_questions
SET description = $$the leadership, management and governance of the organisation make sure it's providing high-quality care that's based around your individual needs, that it encourages learning and innovation, and that it promotes an open and fair culture.$$
WHERE name = $$Well-led$$;
