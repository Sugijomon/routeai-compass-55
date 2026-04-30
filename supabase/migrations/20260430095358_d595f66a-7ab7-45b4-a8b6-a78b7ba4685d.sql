-- DPO Risicoprofiel: anonieme cluster-aggregatie
-- Groepeert voltooide V8 runs per (assigned_tier, dominante trigger) en past
-- k-anonimiteit (k=5) toe door kleine clusters samen te voegen onder 'klein'.

CREATE OR REPLACE FUNCTION public.dpo_risk_clusters(p_org_id uuid)
RETURNS TABLE (
  cluster_id text,
  assigned_tier text,
  dominant_trigger text,
  respondent_count integer,
  avg_shadow numeric,
  avg_exposure numeric,
  avg_priority numeric,
  trigger_codes text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min_cell integer := 5;
BEGIN
  -- RBAC: caller moet super_admin, org_admin of dpo zijn voor deze org
  IF NOT (
    is_super_admin(auth.uid())
    OR (
      (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
      AND p_org_id = get_user_org_id(auth.uid())
    )
  ) THEN
    RAISE EXCEPTION 'unauthorized: dpo_risk_clusters';
  END IF;

  -- Lees minimum cellgrootte uit scoring config (default 5)
  SELECT COALESCE(MAX(dashboard_min_cell_size), 5)
    INTO v_min_cell
    FROM scan_scoring_config
   WHERE org_id = p_org_id;

  RETURN QUERY
  WITH base AS (
    SELECT
      sr.id AS survey_run_id,
      rr.assigned_tier::text AS assigned_tier,
      rr.person_score,
      rr.review_trigger_codes,
      rr.highest_priority_score,
      COALESCE(
        (SELECT MAX(rrt.shadow_score) FROM risk_result_tool rrt WHERE rrt.survey_run_id = sr.id),
        0
      ) AS max_shadow,
      COALESCE(
        (SELECT MAX(rrt.exposure_score) FROM risk_result_tool rrt WHERE rrt.survey_run_id = sr.id),
        0
      ) AS max_exposure
    FROM survey_run sr
    JOIN risk_result rr ON rr.survey_run_id = sr.id
    WHERE sr.org_id = p_org_id
      AND sr.completed_at IS NOT NULL
  ),
  with_dominant AS (
    SELECT
      b.*,
      COALESCE(
        (SELECT t FROM unnest(b.review_trigger_codes) AS t
          WHERE t IN ('prohibited_tool','special_category_data','hr_evaluation_context','agentic_usage')
          LIMIT 1),
        COALESCE(b.review_trigger_codes[1], 'none')
      ) AS dom_trigger
    FROM base b
  ),
  grouped AS (
    SELECT
      assigned_tier,
      dom_trigger,
      COUNT(*)::int AS n,
      AVG(max_shadow)::numeric(5,2) AS avg_shadow,
      AVG(max_exposure)::numeric(5,2) AS avg_exposure,
      AVG(highest_priority_score)::numeric(5,2) AS avg_priority,
      array_agg(DISTINCT trig) FILTER (WHERE trig IS NOT NULL) AS triggers
    FROM with_dominant
    LEFT JOIN LATERAL unnest(review_trigger_codes) AS trig ON true
    GROUP BY assigned_tier, dom_trigger
  ),
  classified AS (
    SELECT
      g.*,
      (g.n >= v_min_cell) AS is_visible
    FROM grouped g
  ),
  small_merged AS (
    -- Kleine clusters samenvoegen tot één 'klein'-cluster per tier
    SELECT
      'klein-' || assigned_tier AS cluster_id,
      assigned_tier,
      'samengevoegd'::text AS dominant_trigger,
      SUM(n)::int AS respondent_count,
      AVG(avg_shadow)::numeric(5,2) AS avg_shadow,
      AVG(avg_exposure)::numeric(5,2) AS avg_exposure,
      AVG(avg_priority)::numeric(5,2) AS avg_priority,
      ARRAY(SELECT DISTINCT unnest(array_agg(triggers))) AS trigger_codes
    FROM classified
    WHERE NOT is_visible
    GROUP BY assigned_tier
    HAVING SUM(n) > 0
  ),
  visible AS (
    SELECT
      'c-' || md5(assigned_tier || '|' || dom_trigger) AS cluster_id,
      assigned_tier,
      dom_trigger AS dominant_trigger,
      n AS respondent_count,
      avg_shadow,
      avg_exposure,
      avg_priority,
      COALESCE(triggers, ARRAY[]::text[]) AS trigger_codes
    FROM classified
    WHERE is_visible
  )
  SELECT * FROM visible
  UNION ALL
  SELECT * FROM small_merged
  ORDER BY avg_priority DESC NULLS LAST, respondent_count DESC;
END;
$$;

COMMENT ON FUNCTION public.dpo_risk_clusters(uuid) IS
'Anonieme cluster-aggregatie voor DPO Risicoprofiel. K-anonimiteit (default k=5) via dashboard_min_cell_size.';

GRANT EXECUTE ON FUNCTION public.dpo_risk_clusters(uuid) TO authenticated;