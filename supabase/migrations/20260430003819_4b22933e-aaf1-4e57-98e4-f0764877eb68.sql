-- Debug-only write access for super admins on risk_result + risk_result_tool.
-- Required so the manual "Bereken scores" button on /admin/scan-v8-debug
-- can persist scores. Regular org_admin/dpo users still cannot write here.

CREATE POLICY "super_admin_insert_risk_result"
ON public.risk_result
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_update_risk_result"
ON public.risk_result
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_delete_risk_result"
ON public.risk_result
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_insert_risk_result_tool"
ON public.risk_result_tool
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_update_risk_result_tool"
ON public.risk_result_tool
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_delete_risk_result_tool"
ON public.risk_result_tool
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));