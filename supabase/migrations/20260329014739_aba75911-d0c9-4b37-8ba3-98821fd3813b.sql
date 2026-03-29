
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.tools_catalog) = 0 THEN
    DROP TABLE IF EXISTS public.tools_catalog;
  ELSE
    ALTER TABLE public.tools_catalog RENAME TO _legacy_tools_catalog;
    RAISE NOTICE 'tools_catalog had data — hernoemd naar _legacy_tools_catalog';
  END IF;
END $$;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.shadow_survey_reports) = 0 THEN
    DROP TABLE IF EXISTS public.shadow_survey_reports;
  END IF;
END $$;
