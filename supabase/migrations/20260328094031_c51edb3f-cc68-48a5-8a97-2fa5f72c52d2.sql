-- ============================================================
-- Verwijder 'admin' uit app_role enum
-- Stap: drop 24 afhankelijke policies + has_role functie → 
--       rename enum → rebuild → recreate alles
-- ============================================================

-- 1. DROP alle 24 afhankelijke policies
DROP POLICY IF EXISTS "Admins and content editors manage course_lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Admins and content editors manage courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage answers" ON public.learning_answers;
DROP POLICY IF EXISTS "Org admins can manage org questions" ON public.learning_questions;
DROP POLICY IF EXISTS "Org admins and super admins manage lesson attempts" ON public.lesson_attempts;
DROP POLICY IF EXISTS "Admins and content editors manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "dpo_manage_org_tools_catalog" ON public.org_tools_catalog;
DROP POLICY IF EXISTS "Org admins and super admins manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "dpo_read_own_org" ON public.organizations;
DROP POLICY IF EXISTS "Org admins and super admins manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "dpo_read_own_org_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all rijbewijs" ON public.rijbewijs_records;
DROP POLICY IF EXISTS "Admins can manage reports" ON public.shadow_survey_reports;
DROP POLICY IF EXISTS "Admins can view all survey runs" ON public.shadow_survey_runs;
DROP POLICY IF EXISTS "dpo_read_own_org_survey_runs" ON public.shadow_survey_runs;
DROP POLICY IF EXISTS "dpo_update_own_org_survey_runs" ON public.shadow_survey_runs;
DROP POLICY IF EXISTS "Admins can manage all tool discoveries" ON public.tool_discoveries;
DROP POLICY IF EXISTS "dpo_read_own_org_tool_discoveries" ON public.tool_discoveries;
DROP POLICY IF EXISTS "dpo_read_own_org_badges" ON public.user_badges;
DROP POLICY IF EXISTS "Org admins and super admins manage course completions" ON public.user_course_completions;
DROP POLICY IF EXISTS "Org admins and super admins manage course progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Org admins and super admins manage lesson completions" ON public.user_lesson_completions;
DROP POLICY IF EXISTS "Org admins and super admins manage lesson progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Org admins and super admins manage roles" ON public.user_roles;

-- 2. Drop oude has_role functie (afhankelijk van oude enum)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 3. Rename enum + herbouw
ALTER TYPE public.app_role RENAME TO app_role_old;

CREATE TYPE public.app_role AS ENUM (
  'user', 'super_admin', 'content_editor', 'org_admin', 'manager', 'dpo'
);

ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role
  USING role::text::public.app_role;

DROP TYPE public.app_role_old;

-- 4. Functies opnieuw aanmaken
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') THEN TRUE
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
  END;
$$;

CREATE OR REPLACE FUNCTION public.check_org_admin_limit()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE admin_count INTEGER;
BEGIN
  IF NEW.role = 'org_admin' THEN
    SELECT COUNT(*) INTO admin_count FROM public.user_roles
    WHERE org_id = NEW.org_id AND role = 'org_admin'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    IF admin_count >= 2 THEN
      RAISE EXCEPTION 'Een organisatie mag maximaal 2 AI Verantwoordelijken hebben.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Alle 24 policies opnieuw aanmaken

CREATE POLICY "Admins and content editors manage course_lessons" ON public.course_lessons
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR has_role(auth.uid(), 'org_admin'))
  WITH CHECK (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR has_role(auth.uid(), 'org_admin'));

CREATE POLICY "Admins and content editors manage courses" ON public.courses
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())));

CREATE POLICY "Admins can manage answers" ON public.learning_answers
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())));

CREATE POLICY "Org admins can manage org questions" ON public.learning_questions
  FOR ALL TO public
  USING (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org admins and super admins manage lesson attempts" ON public.lesson_attempts
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())));

CREATE POLICY "Admins and content editors manage lessons" ON public.lessons
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR is_content_editor(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())));

CREATE POLICY "dpo_manage_org_tools_catalog" ON public.org_tools_catalog
  FOR ALL TO authenticated
  USING (org_id IN (SELECT ur.org_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'))
  WITH CHECK (org_id IN (SELECT ur.org_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'));

CREATE POLICY "Org admins and super admins manage organizations" ON public.organizations
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND id = get_user_org_id(auth.uid())));

CREATE POLICY "dpo_read_own_org" ON public.organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT ur.org_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'));

CREATE POLICY "Org admins and super admins manage profiles" ON public.profiles
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())));

CREATE POLICY "dpo_read_own_org_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT ur.org_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'));

CREATE POLICY "Admins can view all rijbewijs" ON public.rijbewijs_records
  FOR SELECT TO public
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage reports" ON public.shadow_survey_reports
  FOR ALL TO public
  USING (has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view all survey runs" ON public.shadow_survey_runs
  FOR SELECT TO public
  USING (has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "dpo_read_own_org_survey_runs" ON public.shadow_survey_runs
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT ur.org_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'));

CREATE POLICY "dpo_update_own_org_survey_runs" ON public.shadow_survey_runs
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT ur.org_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'));

CREATE POLICY "Admins can manage all tool discoveries" ON public.tool_discoveries
  FOR ALL TO public
  USING (has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "dpo_read_own_org_tool_discoveries" ON public.tool_discoveries
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT ur.org_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'));

CREATE POLICY "dpo_read_own_org_badges" ON public.user_badges
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT ur.org_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'dpo'));

CREATE POLICY "Org admins and super admins manage course completions" ON public.user_course_completions
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())));

CREATE POLICY "Org admins and super admins manage course progress" ON public.user_course_progress
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())));

CREATE POLICY "Org admins and super admins manage lesson completions" ON public.user_lesson_completions
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())));

CREATE POLICY "Org admins and super admins manage lesson progress" ON public.user_lesson_progress
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())));

CREATE POLICY "Org admins and super admins manage roles" ON public.user_roles
  FOR ALL TO public
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'org_admin') AND org_id = get_user_org_id(auth.uid())));