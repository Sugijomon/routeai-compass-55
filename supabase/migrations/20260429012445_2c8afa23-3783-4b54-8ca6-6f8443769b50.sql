-- SELECT for anon/authenticated on all V8.1 survey tables
CREATE POLICY "anon_select_survey_run"
  ON public.survey_run FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_survey_profile"
  ON public.survey_profile FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_survey_tool"
  ON public.survey_tool FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_survey_motivation"
  ON public.survey_motivation FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_survey_data_type"
  ON public.survey_data_type FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_survey_tool_use_case"
  ON public.survey_tool_use_case FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_survey_tool_use_case_context"
  ON public.survey_tool_use_case_context FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_survey_tool_account"
  ON public.survey_tool_account FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_survey_tool_preference_reason"
  ON public.survey_tool_preference_reason FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_survey_top_concern"
  ON public.survey_top_concern FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_survey_support_need"
  ON public.survey_support_need FOR SELECT TO anon, authenticated USING (true);

-- UPDATE on survey_profile (used by upsert in Step07)
CREATE POLICY "anon_update_survey_profile"
  ON public.survey_profile FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

-- DELETE on survey_tool_preference_reason (Step07 doet delete + insert)
CREATE POLICY "anon_delete_survey_tool_preference_reason"
  ON public.survey_tool_preference_reason FOR DELETE TO anon, authenticated
  USING (true);