
-- Nieuwe kolommen (assigned_tier bestaat al)
ALTER TABLE public.shadow_survey_runs
  ADD COLUMN IF NOT EXISTS data_classification TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS primary_use_case TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS primary_concern TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dpo_review_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS survey_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Validatie-trigger voor data_classification, assigned_tier en risk_score
CREATE OR REPLACE FUNCTION public.validate_shadow_survey_runs()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.data_classification IS NOT NULL AND NEW.data_classification NOT IN ('public','internal','client','sensitive') THEN
    RAISE EXCEPTION 'data_classification must be one of: public, internal, client, sensitive';
  END IF;
  IF NEW.assigned_tier IS NOT NULL AND NEW.assigned_tier NOT IN ('standard','advanced','custom') THEN
    RAISE EXCEPTION 'assigned_tier must be one of: standard, advanced, custom';
  END IF;
  IF NEW.risk_score IS NOT NULL AND (NEW.risk_score < 0 OR NEW.risk_score > 100) THEN
    RAISE EXCEPTION 'risk_score must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_shadow_survey_runs ON public.shadow_survey_runs;
CREATE TRIGGER trigger_validate_shadow_survey_runs
  BEFORE INSERT OR UPDATE ON public.shadow_survey_runs
  FOR EACH ROW EXECUTE FUNCTION public.validate_shadow_survey_runs();

-- Index voor DPO-dashboard queries
CREATE INDEX IF NOT EXISTS idx_shadow_survey_runs_org_dpo_review
  ON public.shadow_survey_runs (org_id, dpo_review_required);
