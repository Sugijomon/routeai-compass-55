-- Fix RLS policy for course_lessons to allow content_editor role
DROP POLICY IF EXISTS "Org admins and super admins manage course_lessons" ON public.course_lessons;

CREATE POLICY "Admins and content editors manage course_lessons"
ON public.course_lessons
FOR ALL
USING (
  is_super_admin(auth.uid()) 
  OR is_content_editor(auth.uid()) 
  OR has_role(auth.uid(), 'org_admin'::app_role)
)
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR is_content_editor(auth.uid()) 
  OR has_role(auth.uid(), 'org_admin'::app_role)
);