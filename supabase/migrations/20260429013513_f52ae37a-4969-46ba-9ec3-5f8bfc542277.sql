-- ============================================================================
-- Shadow Survey V8 — Minimale RLS fix
-- Verwijdert brede anon SELECT policies (USING true) die anonieme respondenten
-- toegang gaven tot alle surveydata van andere respondenten.
-- Behoud: anon INSERT/UPDATE policies voor engine-werking + admin SELECT policies.
-- ============================================================================

-- survey_run
DROP POLICY IF EXISTS anon_select_survey_run ON public.survey_run;

-- survey_profile
DROP POLICY IF EXISTS anon_select_survey_profile ON public.survey_profile;

-- survey_tool
DROP POLICY IF EXISTS anon_select_survey_tool ON public.survey_tool;

-- survey_motivation
DROP POLICY IF EXISTS anon_select_survey_motivation ON public.survey_motivation;

-- survey_data_type
DROP POLICY IF EXISTS anon_select_survey_data_type ON public.survey_data_type;

-- survey_tool_use_case
DROP POLICY IF EXISTS anon_select_survey_tool_use_case ON public.survey_tool_use_case;

-- survey_tool_use_case_context
DROP POLICY IF EXISTS anon_select_survey_tool_use_case_context ON public.survey_tool_use_case_context;

-- survey_tool_account
DROP POLICY IF EXISTS anon_select_survey_tool_account ON public.survey_tool_account;

-- survey_tool_preference_reason
DROP POLICY IF EXISTS anon_select_survey_tool_preference_reason ON public.survey_tool_preference_reason;

-- survey_top_concern
DROP POLICY IF EXISTS anon_select_survey_top_concern ON public.survey_top_concern;

-- survey_support_need
DROP POLICY IF EXISTS anon_select_survey_support_need ON public.survey_support_need;