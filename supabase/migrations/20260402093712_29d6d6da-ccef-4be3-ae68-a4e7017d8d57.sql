-- Fix 1: Add SELECT policy for DPO role on passport_identity
CREATE POLICY "dpo_read_own_org_passport_identity"
ON public.passport_identity
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT ur.org_id FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'
  )
);

-- Fix 2: Tighten user_roles policies from {public} to {authenticated}
DROP POLICY IF EXISTS "Org admins and super admins manage roles" ON public.user_roles;
CREATE POLICY "Org admins and super admins manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid())))
)
WITH CHECK (
  is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid())))
);

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);