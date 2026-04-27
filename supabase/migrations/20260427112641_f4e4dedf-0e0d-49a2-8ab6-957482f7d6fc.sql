-- Fix 1: UPDATE policy voor authenticated users
CREATE POLICY "auth_complete_survey_run"
ON public.survey_run
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (org_id IS NOT NULL);

-- Fix 2: org_id verplicht maken
ALTER TABLE public.survey_run
ALTER COLUMN org_id SET NOT NULL;