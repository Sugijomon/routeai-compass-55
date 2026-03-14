
-- Drop existing policies on learning_questions
DROP POLICY IF EXISTS "Users can view questions in their org lessons" ON public.learning_questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.learning_questions;

-- Content editors and super admins can view ALL questions (platform-level role, no org)
CREATE POLICY "Super admins and content editors can view all questions"
  ON public.learning_questions FOR SELECT
  USING (
    is_super_admin(auth.uid()) OR
    is_content_editor(auth.uid())
  );

-- Org users can view questions in published lessons of their org
CREATE POLICY "Users can view questions in their org lessons"
  ON public.learning_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = learning_questions.lesson_id
      AND lessons.is_published = true
      AND lessons.org_id = get_user_org_id(auth.uid())
    )
  );

-- Super admins and content editors can manage all questions
CREATE POLICY "Super admins and content editors can manage questions"
  ON public.learning_questions FOR ALL
  USING (
    is_super_admin(auth.uid()) OR
    is_content_editor(auth.uid())
  )
  WITH CHECK (
    is_super_admin(auth.uid()) OR
    is_content_editor(auth.uid())
  );

-- Org admins can manage questions linked to their org's lessons
CREATE POLICY "Org admins can manage org questions"
  ON public.learning_questions FOR ALL
  USING (
    has_role(auth.uid(), 'org_admin'::app_role) AND
    org_id = get_user_org_id(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'org_admin'::app_role) AND
    org_id = get_user_org_id(auth.uid())
  );
