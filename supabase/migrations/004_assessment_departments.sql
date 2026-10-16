-- Add department eligibility to assessments
-- Empty array = all departments eligible; non-empty = only listed departments

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS eligible_departments text[] DEFAULT '{}';

COMMENT ON COLUMN public.assessments.eligible_departments IS
  'Empty array = all departments. Non-empty = only those departments see this assessment.';

-- Backfill: existing assessments apply to all departments
UPDATE public.assessments SET eligible_departments = '{}' WHERE eligible_departments IS NULL;
