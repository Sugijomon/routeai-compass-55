
-- Update primary_archetype van B-xx naar O-xx
UPDATE public.assessments
SET primary_archetype = 'O' || substring(primary_archetype FROM 2)
WHERE primary_archetype LIKE 'B-%';

-- Update secondary_archetypes array: vervang B-xx door O-xx
UPDATE public.assessments
SET secondary_archetypes = (
  SELECT array_agg(
    CASE WHEN elem LIKE 'B-%' THEN 'O' || substring(elem FROM 2) ELSE elem END
  )
  FROM unnest(secondary_archetypes) AS elem
)
WHERE secondary_archetypes IS NOT NULL
  AND EXISTS (SELECT 1 FROM unnest(secondary_archetypes) AS e WHERE e LIKE 'B-%');

-- Update archetype_refs array: vervang referenties naar B-xx
UPDATE public.assessments
SET archetype_refs = (
  SELECT array_agg(replace(elem, 'B-0', 'O-0'))
  FROM unnest(archetype_refs) AS elem
)
WHERE EXISTS (SELECT 1 FROM unnest(archetype_refs) AS e WHERE e LIKE '%B-0%');
