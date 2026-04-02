CREATE VIEW public.survey_participation
WITH (security_invoker=on) AS
SELECT
  id,
  org_id,
  user_id,
  amnesty_acknowledged,
  submitted_at,
  assigned_tier
FROM public.shadow_survey_runs;