
CREATE OR REPLACE FUNCTION public.validate_plan_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan_type NOT IN ('shadow_only', 'routeai', 'both') THEN
    RAISE EXCEPTION 'plan_type must be one of: shadow_only, routeai, both';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_validate_plan_type
  BEFORE INSERT OR UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_plan_type();
