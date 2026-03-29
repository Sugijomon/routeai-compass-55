
-- Trigger: koppel micro-learning aan oranje assessment bij aanmaak
CREATE OR REPLACE FUNCTION public.assign_microlearning_on_orange_assessment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_library_item_id  UUID;
  v_context_card     TEXT;
BEGIN
  -- Alleen voor oranje route
  IF NEW.route != 'orange' THEN
    RETURN NEW;
  END IF;

  -- Zoek de bijbehorende micro-learning op basis van primair archetype
  SELECT library_item_id, context_card_text
    INTO v_library_item_id, v_context_card
    FROM public.archetype_ml_map
    WHERE archetype_code = NEW.primary_archetype
      AND is_active = true
    LIMIT 1;

  -- Alleen doorgaan als er een module gekoppeld is
  IF v_library_item_id IS NOT NULL THEN
    INSERT INTO public.assessment_ml_assignments (
      assessment_id,
      user_id,
      library_item_id,
      is_required,
      context_card_text
    ) VALUES (
      NEW.id,
      NEW.created_by,
      v_library_item_id,
      true,
      v_context_card
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_microlearning_on_orange
  AFTER INSERT ON public.assessments
  FOR EACH ROW
  WHEN (NEW.route = 'orange')
  EXECUTE FUNCTION public.assign_microlearning_on_orange_assessment();
