-- ============================================================
-- Survey-antwoordtabellen
-- ============================================================

-- Profiel (schermen 02/03/07/08)
CREATE TABLE public.survey_profile (
  survey_run_id UUID PRIMARY KEY REFERENCES public.survey_run(id) ON DELETE CASCADE,
  department_code VARCHAR(64) NULL,
  department_other_text VARCHAR(255) NULL,
  ai_frequency_code VARCHAR(32) NULL,
  no_ai_reason_code VARCHAR(32) NULL,
  processing_output_code VARCHAR(64) NULL,
  ai_policy_awareness_code VARCHAR(64) NULL,
  ai_skill_level_code VARCHAR(32) NULL,
  top_concern_other_text VARCHAR(255) NULL,
  future_usecases_text TEXT NULL,
  browser_extension_usage_code VARCHAR(64) NULL,
  extension_awareness_code VARCHAR(64) NULL,
  automation_usage_code VARCHAR(64) NULL,
  automation_awareness_code VARCHAR(64) NULL,
  data_awareness_code VARCHAR(64) NULL,
  anonymization_behavior_code VARCHAR(64) NULL
);

-- Motivatie multi-select (scherm 03)
CREATE TABLE public.survey_motivation (
  survey_run_id UUID NOT NULL REFERENCES public.survey_run(id) ON DELETE CASCADE,
  motivation_code VARCHAR(64) NOT NULL,
  motivation_other_text VARCHAR(255) NULL,
  PRIMARY KEY (survey_run_id, motivation_code)
);

-- Datatype multi-select (scherm 05)
CREATE TABLE public.survey_data_type (
  survey_run_id UUID NOT NULL REFERENCES public.survey_run(id) ON DELETE CASCADE,
  data_type_code VARCHAR(64) NOT NULL,
  PRIMARY KEY (survey_run_id, data_type_code)
);

-- Tools (scherm 04)
CREATE TABLE public.survey_tool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_run_id UUID NOT NULL REFERENCES public.survey_run(id) ON DELETE CASCADE,
  tool_code VARCHAR(64) NULL,
  tool_name VARCHAR(128) NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  catalog_beheerstatus_code VARCHAR(32) NULL,
  org_policy_status_code_snapshot VARCHAR(32) NULL,
  eu_ai_act_flag_code_snapshot VARCHAR(64) NULL
);

-- Toepassingen per tool (scherm 04)
CREATE TABLE public.survey_tool_use_case (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_tool_id UUID NOT NULL REFERENCES public.survey_tool(id) ON DELETE CASCADE,
  use_case_code VARCHAR(64) NOT NULL REFERENCES public.ref_use_case(code)
);

-- Context per tool-toepassing
CREATE TABLE public.survey_tool_use_case_context (
  survey_tool_use_case_id UUID NOT NULL REFERENCES public.survey_tool_use_case(id) ON DELETE CASCADE,
  context_code VARCHAR(64) NOT NULL REFERENCES public.ref_context(code),
  PRIMARY KEY (survey_tool_use_case_id, context_code)
);

-- Governance flags
CREATE TABLE public.survey_tool_use_case_flag (
  survey_tool_use_case_id UUID NOT NULL REFERENCES public.survey_tool_use_case(id) ON DELETE CASCADE,
  governance_flag_code VARCHAR(64) NOT NULL REFERENCES public.ref_governance_flag(code),
  PRIMARY KEY (survey_tool_use_case_id, governance_flag_code)
);

-- Accounttype per tool (scherm 06)
CREATE TABLE public.survey_tool_account (
  survey_tool_id UUID PRIMARY KEY REFERENCES public.survey_tool(id) ON DELETE CASCADE,
  account_type_code VARCHAR(32) NOT NULL
);

-- Voorkeuren multi-select (scherm 07)
CREATE TABLE public.survey_tool_preference_reason (
  survey_run_id UUID NOT NULL REFERENCES public.survey_run(id) ON DELETE CASCADE,
  preference_reason_code VARCHAR(64) NOT NULL,
  PRIMARY KEY (survey_run_id, preference_reason_code)
);

-- Zorgen multi-select (scherm 08)
CREATE TABLE public.survey_top_concern (
  survey_run_id UUID NOT NULL REFERENCES public.survey_run(id) ON DELETE CASCADE,
  top_concern_code VARCHAR(64) NOT NULL,
  PRIMARY KEY (survey_run_id, top_concern_code)
);

-- Ondersteuningsbehoeften multi-select (scherm 08)
CREATE TABLE public.survey_support_need (
  survey_run_id UUID NOT NULL REFERENCES public.survey_run(id) ON DELETE CASCADE,
  support_need_code VARCHAR(64) NOT NULL,
  PRIMARY KEY (survey_run_id, support_need_code)
);

-- Discovery queue voor nieuwe tools
CREATE TABLE public.tool_catalog_discovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  survey_run_id UUID NULL REFERENCES public.survey_run(id),
  survey_tool_id UUID NULL REFERENCES public.survey_tool(id),
  raw_tool_name VARCHAR(128) NOT NULL,
  normalized_tool_name VARCHAR(128) NULL,
  discovery_source VARCHAR(32) NOT NULL DEFAULT 'survey',
  review_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  promoted_tool_code VARCHAR(64) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ NULL,
  reviewed_by VARCHAR(128) NULL,
  notes TEXT NULL
);

-- ============================================================
-- Indexes voor performance
-- ============================================================
CREATE INDEX idx_survey_motivation_run ON public.survey_motivation(survey_run_id);
CREATE INDEX idx_survey_data_type_run ON public.survey_data_type(survey_run_id);
CREATE INDEX idx_survey_tool_run ON public.survey_tool(survey_run_id);
CREATE INDEX idx_survey_tool_use_case_tool ON public.survey_tool_use_case(survey_tool_id);
CREATE INDEX idx_survey_tool_preference_run ON public.survey_tool_preference_reason(survey_run_id);
CREATE INDEX idx_survey_top_concern_run ON public.survey_top_concern(survey_run_id);
CREATE INDEX idx_survey_support_need_run ON public.survey_support_need(survey_run_id);
CREATE INDEX idx_tool_catalog_discovery_org ON public.tool_catalog_discovery(org_id);
CREATE INDEX idx_tool_catalog_discovery_status ON public.tool_catalog_discovery(review_status);

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE public.survey_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_motivation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_data_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_tool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_tool_use_case ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_tool_use_case_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_tool_use_case_flag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_tool_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_tool_preference_reason ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_top_concern ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_support_need ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_catalog_discovery ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: org_id ophalen via survey_run
-- Gebruikt in admin-policies (lookup naar survey_run.org_id)
-- ============================================================

-- ============================================================
-- RLS-policies: survey_profile
-- ============================================================
CREATE POLICY "anon_insert_survey_profile" ON public.survey_profile
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_profile" ON public.survey_profile
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_run sr
      WHERE sr.id = survey_profile.survey_run_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: survey_motivation
-- ============================================================
CREATE POLICY "anon_insert_survey_motivation" ON public.survey_motivation
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_motivation" ON public.survey_motivation
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_run sr
      WHERE sr.id = survey_motivation.survey_run_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: survey_data_type
-- ============================================================
CREATE POLICY "anon_insert_survey_data_type" ON public.survey_data_type
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_data_type" ON public.survey_data_type
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_run sr
      WHERE sr.id = survey_data_type.survey_run_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: survey_tool
-- ============================================================
CREATE POLICY "anon_insert_survey_tool" ON public.survey_tool
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_tool" ON public.survey_tool
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_run sr
      WHERE sr.id = survey_tool.survey_run_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: survey_tool_use_case
-- ============================================================
CREATE POLICY "anon_insert_survey_tool_use_case" ON public.survey_tool_use_case
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_tool_use_case" ON public.survey_tool_use_case
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_tool st
      JOIN public.survey_run sr ON sr.id = st.survey_run_id
      WHERE st.id = survey_tool_use_case.survey_tool_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: survey_tool_use_case_context
-- ============================================================
CREATE POLICY "anon_insert_survey_tool_use_case_context" ON public.survey_tool_use_case_context
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_tool_use_case_context" ON public.survey_tool_use_case_context
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_tool_use_case stuc
      JOIN public.survey_tool st ON st.id = stuc.survey_tool_id
      JOIN public.survey_run sr ON sr.id = st.survey_run_id
      WHERE stuc.id = survey_tool_use_case_context.survey_tool_use_case_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: survey_tool_use_case_flag
-- ============================================================
CREATE POLICY "anon_insert_survey_tool_use_case_flag" ON public.survey_tool_use_case_flag
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_tool_use_case_flag" ON public.survey_tool_use_case_flag
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_tool_use_case stuc
      JOIN public.survey_tool st ON st.id = stuc.survey_tool_id
      JOIN public.survey_run sr ON sr.id = st.survey_run_id
      WHERE stuc.id = survey_tool_use_case_flag.survey_tool_use_case_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: survey_tool_account
-- ============================================================
CREATE POLICY "anon_insert_survey_tool_account" ON public.survey_tool_account
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_tool_account" ON public.survey_tool_account
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_tool st
      JOIN public.survey_run sr ON sr.id = st.survey_run_id
      WHERE st.id = survey_tool_account.survey_tool_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: survey_tool_preference_reason
-- ============================================================
CREATE POLICY "anon_insert_survey_tool_preference_reason" ON public.survey_tool_preference_reason
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_tool_preference_reason" ON public.survey_tool_preference_reason
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_run sr
      WHERE sr.id = survey_tool_preference_reason.survey_run_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: survey_top_concern
-- ============================================================
CREATE POLICY "anon_insert_survey_top_concern" ON public.survey_top_concern
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_top_concern" ON public.survey_top_concern
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_run sr
      WHERE sr.id = survey_top_concern.survey_run_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: survey_support_need
-- ============================================================
CREATE POLICY "anon_insert_survey_support_need" ON public.survey_support_need
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_survey_support_need" ON public.survey_support_need
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.survey_run sr
      WHERE sr.id = survey_support_need.survey_run_id
        AND sr.org_id = get_user_org_id(auth.uid())
        AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

-- ============================================================
-- RLS-policies: tool_catalog_discovery
-- INSERT: anoniem (vanuit survey)
-- SELECT/UPDATE: dpo + org_admin voor eigen org; super_admin alles
-- ============================================================
CREATE POLICY "anon_insert_tool_catalog_discovery" ON public.tool_catalog_discovery
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_tool_catalog_discovery" ON public.tool_catalog_discovery
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      org_id = get_user_org_id(auth.uid())
      AND (is_org_admin(auth.uid()) OR is_dpo(auth.uid()))
    )
  );

CREATE POLICY "admin_update_tool_catalog_discovery" ON public.tool_catalog_discovery
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

CREATE POLICY "super_admin_delete_tool_catalog_discovery" ON public.tool_catalog_discovery
  FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()));