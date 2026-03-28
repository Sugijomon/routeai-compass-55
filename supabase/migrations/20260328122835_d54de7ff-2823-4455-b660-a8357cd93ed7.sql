
-- Bestaande trigger vuurt alleen op INSERT.
-- Voeg een AFTER UPDATE trigger toe die vuurt wanneer status naar 'pending_review' wijzigt.

CREATE OR REPLACE FUNCTION public.notify_dpo_on_assessment_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'pending_review' AND OLD.status IS DISTINCT FROM 'pending_review' THEN
    INSERT INTO public.dpo_notifications (org_id, assessment_id, type, status)
    VALUES (NEW.org_id, NEW.id, 'orange_route_new', 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_notify_dpo_on_status_change
  AFTER UPDATE ON public.assessments
  FOR EACH ROW
  WHEN (NEW.status = 'pending_review' AND OLD.status IS DISTINCT FROM 'pending_review')
  EXECUTE FUNCTION public.notify_dpo_on_assessment_status_change();
