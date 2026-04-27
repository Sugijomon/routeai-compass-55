-- ============================================================
-- Scoringsconfiguratie per org/wave
-- ============================================================
CREATE TABLE public.scan_scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  wave_id UUID NULL REFERENCES public.survey_wave(id),
  scoring_version VARCHAR(32) NOT NULL DEFAULT 'V8.1',
  priority_review_threshold NUMERIC(5,2) NOT NULL DEFAULT 40,
  toxic_shadow_threshold NUMERIC(5,2) NOT NULL DEFAULT 50,
  toxic_exposure_threshold NUMERIC(5,2) NOT NULL DEFAULT 50,
  dashboard_min_cell_size INT NOT NULL DEFAULT 5,
  public_scoreboard_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  created_by VARCHAR(128) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_until TIMESTAMPTZ NULL
);

-- ============================================================
-- Risicoresultaat op respondentniveau
-- ============================================================
CREATE TABLE public.risk_result (
  survey_run_id UUID PRIMARY KEY REFERENCES public.survey_run(id) ON DELETE CASCADE,
  person_score_raw NUMERIC(6,2) NULL,
  person_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  assigned_tier VARCHAR(16) NOT NULL DEFAULT 'green',
  dpo_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  toxic_combination BOOLEAN NOT NULL DEFAULT FALSE,
  shadow_tool_count INT NOT NULL DEFAULT 0,
  review_trigger_codes TEXT[] NULL,
  highest_risk_tool VARCHAR(128) NULL,
  highest_risk_use_case VARCHAR(128) NULL,
  highest_risk_context VARCHAR(128) NULL,
  highest_priority_score NUMERIC(5,2) NULL,
  hard_override BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Risicoresultaat per tool
-- ============================================================
CREATE TABLE public.risk_result_tool (
  survey_run_id UUID NOT NULL REFERENCES public.survey_run(id) ON DELETE CASCADE,
  survey_tool_id UUID NOT NULL REFERENCES public.survey_tool(id) ON DELETE CASCADE,
  shadow_base NUMERIC(5,2) NOT NULL DEFAULT 0,
  shadow_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  use_case_base NUMERIC(5,2) NOT NULL DEFAULT 0,
  context_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  account_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  data_boost NUMERIC(5,2) NOT NULL DEFAULT 0,
  frequency_boost NUMERIC(5,2) NOT NULL DEFAULT 0,
  automation_boost NUMERIC(5,2) NOT NULL DEFAULT 0,
  extension_boost NUMERIC(5,2) NOT NULL DEFAULT 0,
  agentic_boost NUMERIC(5,2) NOT NULL DEFAULT 0,
  raw_exposure_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  exposure_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  toxic_boost NUMERIC(5,2) NOT NULL DEFAULT 0,
  review_boost NUMERIC(5,2) NOT NULL DEFAULT 0,
  priority_score_raw NUMERIC(6,2) NOT NULL DEFAULT 0,
  priority_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  dpo_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  review_trigger_codes TEXT[] NULL,
  scoring_config_id UUID NULL REFERENCES public.scan_scoring_config(id),
  priority_review_threshold_used NUMERIC(5,2) NULL,
  toxic_shadow_threshold_used NUMERIC(5,2) NULL,
  toxic_exposure_threshold_used NUMERIC(5,2) NULL,
  hard_override BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason VARCHAR(255) NULL,
  PRIMARY KEY (survey_run_id, survey_tool_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_scan_scoring_config_org ON public.scan_scoring_config(org_id);
CREATE INDEX idx_scan_scoring_config_wave ON public.scan_scoring_config(wave_id);
CREATE INDEX idx_risk_result_tool_run ON public.risk_result_tool(survey_run_id);
CREATE INDEX idx_risk_result_tool_tool ON public.risk_result_tool(survey_tool_id);

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE public.scan_scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_result_tool ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: scan_scoring_config
-- org_admin en dpo INSERT/UPDATE/DELETE voor eigen org
-- alle authenticated users SELECT voor eigen org
-- super_admin alles
-- ============================================================
CREATE POLICY "authenticated_select_scan_scoring_config" ON public.scan_scoring_config
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR org_id = get_user_org_id(auth.uid())
  );

CREATE POLICY "admin_insert_scan_scoring_config" ON public.scan_scoring_config
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      org_id = get_user_org_id(auth.uid())
      AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

CREATE POLICY "admin_update_scan_scoring_config" ON public.scan_scoring_config
  FOR UPDATE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      org_id = get_user_org_id(auth.uid())
      AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      org_id = get_user_org_id(auth.uid())
      AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

CREATE POLICY "admin_delete_scan_scoring_config" ON public.scan_scoring_config
  FOR DELETE TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      org_id = get_user_org_id(auth.uid())
      AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS: risk_result
-- dpo en org_admin SELECT voor eigen org (via survey_run.org_id)
-- Geen directe user-insert: alleen service_role/SECURITY DEFINER
-- ============================================================
CREATE POLICY "admin_select_risk_result" ON public.risk_result
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_run sr
      WHERE sr.id = risk_result.survey_run_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS: risk_result_tool
-- dpo en org_admin SELECT voor eigen org (via survey_run.org_id)
-- Geen directe user-insert: alleen service_role/SECURITY DEFINER
-- ============================================================
CREATE POLICY "admin_select_risk_result_tool" ON public.risk_result_tool
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_run sr
      WHERE sr.id = risk_result_tool.survey_run_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );