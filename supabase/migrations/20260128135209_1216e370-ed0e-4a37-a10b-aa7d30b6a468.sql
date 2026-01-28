-- Update lessons RLS policy to include content_editor role
DROP POLICY IF EXISTS "Org admins and super admins manage lessons" ON public.lessons;

CREATE POLICY "Admins and content editors manage lessons"
ON public.lessons
FOR ALL
USING (
  is_super_admin(auth.uid()) 
  OR is_content_editor(auth.uid())
  OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid())))
)
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR is_content_editor(auth.uid())
  OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid())))
);

-- Update courses RLS policy to include content_editor role
DROP POLICY IF EXISTS "Org admins and super admins manage courses" ON public.courses;

CREATE POLICY "Admins and content editors manage courses"
ON public.courses
FOR ALL
USING (
  is_super_admin(auth.uid()) 
  OR is_content_editor(auth.uid())
  OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid())))
)
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR is_content_editor(auth.uid())
  OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid())))
);