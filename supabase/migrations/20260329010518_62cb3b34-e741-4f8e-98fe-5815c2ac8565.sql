
-- is_dpo helper function
CREATE OR REPLACE FUNCTION public.is_dpo(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'dpo'
  );
$$;

-- DPO mag dpo_notifications lezen en beheren binnen eigen org
CREATE POLICY "dpo_manage_own_org_notifications"
  ON public.dpo_notifications FOR ALL
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

-- DPO mag assessments lezen binnen eigen org
CREATE POLICY "dpo_read_org_assessments"
  ON public.assessments FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  );
