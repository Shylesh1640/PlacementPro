-- Add department eligibility to assessments (safe to re-run)
-- No-op if column already exists (001_initial_schema.sql v3 includes it)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'eligible_departments'
  ) THEN
    ALTER TABLE public.assessments
    ADD COLUMN eligible_departments text[] DEFAULT '{}';
  END IF;
END $$;
