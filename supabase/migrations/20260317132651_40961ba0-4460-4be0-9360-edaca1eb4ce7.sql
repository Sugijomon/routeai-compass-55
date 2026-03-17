CREATE POLICY "Users can update own survey runs"
ON public.shadow_survey_runs
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);