
ALTER TABLE public.assessments
  ADD COLUMN eu_act_category TEXT GENERATED ALWAYS AS (
    CASE route
      WHEN 'green'  THEN 'minimal_risk'
      WHEN 'yellow' THEN 'transparency_risk'
      WHEN 'orange' THEN 'high_risk'
      WHEN 'red'    THEN 'prohibited'
      ELSE 'unknown'
    END
  ) STORED;

COMMENT ON COLUMN public.assessments.eu_act_category IS 
  'Berekend veld — afgeleid van route conform EU AI Act risicocategorisering. Mapping gedocumenteerd in beslislogica-versie (zie decision_version kolom). Nooit handmatig schrijven.';
