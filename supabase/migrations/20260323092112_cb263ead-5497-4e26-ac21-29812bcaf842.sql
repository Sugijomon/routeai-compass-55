
-- DPO RLS policies voor shadow-scan tabellen

-- shadow_survey_runs: SELECT + UPDATE
CREATE POLICY "dpo_read_own_org_survey_runs"
  ON public.shadow_survey_runs FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  );

CREATE POLICY "dpo_update_own_org_survey_runs"
  ON public.shadow_survey_runs FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  );

-- tool_discoveries: SELECT
CREATE POLICY "dpo_read_own_org_tool_discoveries"
  ON public.tool_discoveries FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  );

-- user_badges: SELECT
CREATE POLICY "dpo_read_own_org_badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  );

-- profiles: SELECT (eigen org)
CREATE POLICY "dpo_read_own_org_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  );

-- organizations: SELECT (eigen org)
CREATE POLICY "dpo_read_own_org"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  );

-- org_tools_catalog: SELECT + INSERT + UPDATE
CREATE POLICY "dpo_manage_org_tools_catalog"
  ON public.org_tools_catalog FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  );
