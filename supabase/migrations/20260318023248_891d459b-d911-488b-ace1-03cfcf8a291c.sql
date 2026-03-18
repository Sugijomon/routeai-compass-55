
-- Nieuwe kolommen op tool_discoveries
ALTER TABLE public.tool_discoveries
  ADD COLUMN application_risk_class TEXT DEFAULT NULL,
  ADD COLUMN eu_ai_act_context TEXT DEFAULT NULL;

-- Validatie-trigger (geen CHECK constraint, conform richtlijnen)
CREATE OR REPLACE FUNCTION public.validate_tool_discovery_risk_class()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.application_risk_class IS NOT NULL
     AND NEW.application_risk_class NOT IN ('minimal', 'limited', 'high', 'unacceptable') THEN
    RAISE EXCEPTION 'application_risk_class must be one of: minimal, limited, high, unacceptable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_tool_discovery_risk_class
  BEFORE INSERT OR UPDATE ON public.tool_discoveries
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tool_discovery_risk_class();

-- Index voor DPO-dashboard queries
CREATE INDEX idx_tool_discoveries_org_risk_class
  ON public.tool_discoveries (org_id, application_risk_class);
