
CREATE OR REPLACE FUNCTION public.notify_dpo_on_orange_assessment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.route = 'orange' THEN
    INSERT INTO public.dpo_notifications (org_id, assessment_id, type, status)
    VALUES (NEW.org_id, NEW.id, 'orange_route_new', 'pending');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_dpo_on_orange
  AFTER INSERT ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.notify_dpo_on_orange_assessment();
