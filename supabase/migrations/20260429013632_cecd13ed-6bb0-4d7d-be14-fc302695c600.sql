-- ============================================================================
-- Shadow Survey V8 — Vervang brede anon DELETE + documenteer tijdelijkheid
-- ============================================================================

-- 1. Vervang brede anon DELETE op survey_tool_preference_reason
--    door een scoped versie (alleen op niet-voltooide runs).
--    De engine doet delete-then-insert per stap, dus de DELETE moet blijven
--    werken, maar mag niet historie van afgeronde scans wissen.
DROP POLICY IF EXISTS anon_delete_survey_tool_preference_reason
  ON public.survey_tool_preference_reason;

CREATE POLICY anon_delete_active_pref_reason
  ON public.survey_tool_preference_reason
  FOR DELETE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.survey_run sr
      WHERE sr.id = survey_tool_preference_reason.survey_run_id
        AND sr.completed_at IS NULL
    )
  );

COMMENT ON POLICY anon_delete_active_pref_reason
  ON public.survey_tool_preference_reason
  IS 'TIJDELIJK (V8 minimale fix, april 2026): anon mag preference_reasons verwijderen op niet-voltooide runs. Vervangen door RPC save_survey_step_v8 met run_access_token_hash zodra V8.2 hardening live gaat.';

-- 2. Documenteer dat alle resterende anon INSERT/UPDATE policies tijdelijk zijn
--    en vervangen worden door RPC-pattern in V8.2.

COMMENT ON POLICY anon_insert_survey_run ON public.survey_run
  IS 'TIJDELIJK (V8 minimale fix): anon mag een survey_run starten. Vervangen door start_survey_run_v8(invite_token) RPC in V8.2.';

COMMENT ON POLICY anon_complete_survey_run ON public.survey_run
  IS 'TIJDELIJK (V8 minimale fix): anon mag een survey_run afronden zonder run_access_token. Vervangen door complete_survey_run_v8(...) RPC in V8.2.';

COMMENT ON POLICY anon_insert_survey_profile ON public.survey_profile
  IS 'TIJDELIJK (V8 minimale fix): anon insert. Vervangen door save_survey_step_v8 RPC in V8.2.';

COMMENT ON POLICY anon_update_survey_profile ON public.survey_profile
  IS 'TIJDELIJK (V8 minimale fix): anon update. Vervangen door save_survey_step_v8 RPC in V8.2.';

COMMENT ON POLICY anon_insert_survey_tool ON public.survey_tool
  IS 'TIJDELIJK (V8 minimale fix): anon insert. Vervangen door save_survey_step_v8 RPC in V8.2.';

COMMENT ON POLICY anon_insert_survey_motivation ON public.survey_motivation
  IS 'TIJDELIJK (V8 minimale fix): anon insert. Vervangen door save_survey_step_v8 RPC in V8.2.';

COMMENT ON POLICY anon_insert_survey_data_type ON public.survey_data_type
  IS 'TIJDELIJK (V8 minimale fix): anon insert. Vervangen door save_survey_step_v8 RPC in V8.2.';

COMMENT ON POLICY anon_insert_survey_tool_use_case ON public.survey_tool_use_case
  IS 'TIJDELIJK (V8 minimale fix): anon insert. Vervangen door save_survey_step_v8 RPC in V8.2.';

COMMENT ON POLICY anon_insert_survey_tool_use_case_context ON public.survey_tool_use_case_context
  IS 'TIJDELIJK (V8 minimale fix): anon insert. Vervangen door save_survey_step_v8 RPC in V8.2.';

COMMENT ON POLICY anon_insert_survey_tool_account ON public.survey_tool_account
  IS 'TIJDELIJK (V8 minimale fix): anon insert. Vervangen door save_survey_step_v8 RPC in V8.2.';

COMMENT ON POLICY anon_insert_survey_tool_preference_reason ON public.survey_tool_preference_reason
  IS 'TIJDELIJK (V8 minimale fix): anon insert. Vervangen door save_survey_step_v8 RPC in V8.2.';

COMMENT ON POLICY anon_insert_survey_top_concern ON public.survey_top_concern
  IS 'TIJDELIJK (V8 minimale fix): anon insert. Vervangen door save_survey_step_v8 RPC in V8.2.';

COMMENT ON POLICY anon_insert_survey_support_need ON public.survey_support_need
  IS 'TIJDELIJK (V8 minimale fix): anon insert. Vervangen door save_survey_step_v8 RPC in V8.2.';