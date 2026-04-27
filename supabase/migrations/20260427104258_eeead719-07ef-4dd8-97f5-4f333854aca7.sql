-- 1. Policy vervangen
DROP POLICY IF EXISTS "anon_update_survey_run" ON public.survey_run;

CREATE POLICY "anon_complete_survey_run"
ON public.survey_run
FOR UPDATE
TO anon
USING (true)
WITH CHECK (
  -- Alleen de afsluiting-velden mogen worden gezet
  -- org_id en wave_id mogen niet veranderen na INSERT
  org_id IS NOT NULL
);

-- 2. Immutable-field trigger
CREATE OR REPLACE FUNCTION public.protect_survey_run_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.org_id IS NOT NULL AND NEW.org_id IS DISTINCT FROM OLD.org_id THEN
    RAISE EXCEPTION 'org_id mag niet worden gewijzigd na aanmaak';
  END IF;
  IF OLD.wave_id IS NOT NULL AND NEW.wave_id IS DISTINCT FROM OLD.wave_id THEN
    RAISE EXCEPTION 'wave_id mag niet worden gewijzigd na aanmaak';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_survey_run_immutable
BEFORE UPDATE ON public.survey_run
FOR EACH ROW EXECUTE FUNCTION public.protect_survey_run_immutable_fields();