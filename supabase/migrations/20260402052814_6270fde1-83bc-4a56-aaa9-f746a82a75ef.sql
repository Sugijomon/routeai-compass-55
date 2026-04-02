
-- Fix 1: Prevent org_admins from modifying has_ai_rijbewijs or ai_rijbewijs_obtained_at
-- Only the system trigger (grant_rijbewijs_on_exam_pass) should set these fields
CREATE OR REPLACE FUNCTION public.protect_rijbewijs_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if called from the system trigger (no auth context = service role)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Allow super_admin (platform maintenance only)
  IF is_super_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  
  -- Block any change to rijbewijs fields by non-system actors
  IF OLD.has_ai_rijbewijs IS DISTINCT FROM NEW.has_ai_rijbewijs
     OR OLD.ai_rijbewijs_obtained_at IS DISTINCT FROM NEW.ai_rijbewijs_obtained_at THEN
    RAISE EXCEPTION 'AI Rijbewijs kan alleen worden toegekend via het examensysteem.';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_rijbewijs_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_rijbewijs_fields();

-- Fix 2: Add SET search_path to grant_rijbewijs_on_exam_pass
CREATE OR REPLACE FUNCTION public.grant_rijbewijs_on_exam_pass()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.passed = true THEN
    DECLARE v_lesson_type TEXT;
    BEGIN
      SELECT lesson_type INTO v_lesson_type FROM public.lessons WHERE id = NEW.lesson_id;
      IF v_lesson_type = 'ai_literacy_exam' THEN
        INSERT INTO public.rijbewijs_records (user_id, org_id, lesson_attempt_id)
          VALUES (NEW.user_id, NEW.org_id, NEW.id)
          ON CONFLICT (user_id) DO UPDATE SET
            status = 'active',
            earned_at = NOW(),
            lesson_attempt_id = NEW.id;
        UPDATE public.profiles SET
          has_ai_rijbewijs = true,
          ai_rijbewijs_obtained_at = NOW()
        WHERE id = NEW.user_id;
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$;
