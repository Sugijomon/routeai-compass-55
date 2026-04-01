CREATE POLICY "dpo_update_own_org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT ur.org_id FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  )
  WITH CHECK (
    id IN (
      SELECT ur.org_id FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
    )
  );