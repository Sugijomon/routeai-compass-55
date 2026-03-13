
-- Remove any existing moderator role assignments
DELETE FROM public.user_roles WHERE role = 'moderator';

-- Create new enum without moderator
CREATE TYPE public.app_role_new AS ENUM ('admin', 'user', 'super_admin', 'content_editor', 'org_admin', 'manager');

-- Update column to use new enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role_new 
  USING role::text::public.app_role_new;

-- Drop old enum CASCADE (drops dependent functions and policies)
DROP TYPE public.app_role CASCADE;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') THEN TRUE
      ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
    END;
$$;

-- Recreate get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_roles WHERE user_id = _user_id 
  ORDER BY CASE role 
    WHEN 'super_admin' THEN 1 WHEN 'content_editor' THEN 2 
    WHEN 'org_admin' THEN 3 WHEN 'manager' THEN 4 WHEN 'user' THEN 5 ELSE 6 END
  LIMIT 1;
$$;

-- Recreate all dropped RLS policies

-- lesson_attempts
CREATE POLICY "Org admins and super admins manage lesson attempts"
ON public.lesson_attempts FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- user_lesson_progress
CREATE POLICY "Org admins and super admins manage lesson progress"
ON public.user_lesson_progress FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- user_lesson_completions
CREATE POLICY "Org admins and super admins manage lesson completions"
ON public.user_lesson_completions FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- user_course_progress
CREATE POLICY "Org admins and super admins manage course progress"
ON public.user_course_progress FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- user_course_completions
CREATE POLICY "Org admins and super admins manage course completions"
ON public.user_course_completions FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- organizations
CREATE POLICY "Org admins and super admins manage organizations"
ON public.organizations FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (id = get_user_org_id(auth.uid()))));

-- profiles
CREATE POLICY "Org admins and super admins manage profiles"
ON public.profiles FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- user_roles
CREATE POLICY "Org admins and super admins manage roles"
ON public.user_roles FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- learning_questions
CREATE POLICY "Admins can manage questions"
ON public.learning_questions FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- learning_answers
CREATE POLICY "Admins can manage answers"
ON public.learning_answers FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- lessons
CREATE POLICY "Admins and content editors manage lessons"
ON public.lessons FOR ALL
USING (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- courses
CREATE POLICY "Admins and content editors manage courses"
ON public.courses FOR ALL
USING (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))))
WITH CHECK (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR (has_role(auth.uid(), 'org_admin'::app_role) AND (org_id = get_user_org_id(auth.uid()))));

-- rijbewijs_records
CREATE POLICY "Admins can view all rijbewijs"
ON public.rijbewijs_records FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- shadow_survey_runs
CREATE POLICY "Admins can view all survey runs"
ON public.shadow_survey_runs FOR SELECT
USING (has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- tool_discoveries
CREATE POLICY "Admins can manage all tool discoveries"
ON public.tool_discoveries FOR ALL
USING (has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- shadow_survey_reports
CREATE POLICY "Admins can manage reports"
ON public.shadow_survey_reports FOR ALL
USING (has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- course_lessons
CREATE POLICY "Admins and content editors manage course_lessons"
ON public.course_lessons FOR ALL
USING (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR has_role(auth.uid(), 'org_admin'::app_role))
WITH CHECK (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR has_role(auth.uid(), 'org_admin'::app_role));
