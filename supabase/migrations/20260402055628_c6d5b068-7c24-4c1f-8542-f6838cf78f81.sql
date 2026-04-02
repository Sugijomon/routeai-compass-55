
CREATE OR REPLACE FUNCTION public.sanitize_lesson_attempt_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.passed := false;
  NEW.score := NULL;
  NEW.max_score := NULL;
  NEW.percentage := NULL;
  NEW.completed_at := NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_lesson_attempt_scores()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.system_write', true) = 'true' THEN
    RETURN NEW;
  END IF;
  IF is_super_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.passed := OLD.passed;
  NEW.score := OLD.score;
  NEW.max_score := OLD.max_score;
  NEW.percentage := OLD.percentage;
  NEW.completed_at := OLD.completed_at;
  RETURN NEW;
END;
$$;
