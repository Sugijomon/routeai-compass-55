
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS routeai_invited_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.shadow_survey_runs ADD COLUMN IF NOT EXISTS assigned_tier TEXT DEFAULT NULL;
