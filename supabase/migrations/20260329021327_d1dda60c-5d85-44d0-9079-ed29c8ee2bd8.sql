
-- Trigger: controleer na ML-voltooiing of DPO ook al heeft goedgekeurd
CREATE OR REPLACE FUNCTION public.check_activation_after_ml_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_dpo_actioned BOOLEAN;
  v_assignment_required BOOLEAN;
BEGIN
  SELECT is_required INTO v_assignment_required
    FROM public.assessment_ml_assignments
    WHERE assessment_id = NEW.assessment_id
      AND user_id = NEW.user_id
    LIMIT 1;

  IF NOT v_assignment_required THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.dpo_notifications
    WHERE assessment_id = NEW.assessment_id
      AND status = 'actioned'
  ) INTO v_dpo_actioned;

  IF v_dpo_actioned THEN
    UPDATE public.assessments
      SET status = 'active',
          updated_at = now()
      WHERE id = NEW.assessment_id
        AND status = 'pending_dpo';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_activation_after_ml
  AFTER INSERT ON public.assessment_ml_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_activation_after_ml_completion();

-- Spiegel: controleer ook na DPO-goedkeuring of ML al af is
CREATE OR REPLACE FUNCTION public.check_activation_after_dpo_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ml_completed BOOLEAN;
  v_assignment_exists BOOLEAN;
BEGIN
  IF NEW.status != 'actioned' OR OLD.status = 'actioned' THEN
    RETURN NEW;
  END IF;

  IF NEW.assessment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.assessment_ml_assignments
    WHERE assessment_id = NEW.assessment_id
      AND is_required = true
  ) INTO v_assignment_exists;

  IF NOT v_assignment_exists THEN
    UPDATE public.assessments
      SET status = 'active', updated_at = now()
      WHERE id = NEW.assessment_id
        AND status = 'pending_dpo';
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.assessment_ml_completions amc
    JOIN public.assessment_ml_assignments ama
      ON ama.assessment_id = amc.assessment_id
      AND ama.library_item_id = amc.library_item_id
    WHERE amc.assessment_id = NEW.assessment_id
      AND ama.is_required = true
  ) INTO v_ml_completed;

  IF v_ml_completed THEN
    UPDATE public.assessments
      SET status = 'active', updated_at = now()
      WHERE id = NEW.assessment_id
        AND status = 'pending_dpo';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_activation_after_dpo
  AFTER UPDATE ON public.dpo_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.check_activation_after_dpo_action();
