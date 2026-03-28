-- Stap 1: Enum uitbreiden met pending_review
ALTER TYPE public.assessment_status ADD VALUE IF NOT EXISTS 'pending_review';

-- Stap 5: DPO-trigger uitbreiden voor pending_review
CREATE OR REPLACE FUNCTION public.notify_dpo_on_orange_assessment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.route = 'orange' OR NEW.status = 'pending_review' THEN
    INSERT INTO public.dpo_notifications (org_id, assessment_id, type, status)
    VALUES (NEW.org_id, NEW.id, 'orange_route_new', 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;