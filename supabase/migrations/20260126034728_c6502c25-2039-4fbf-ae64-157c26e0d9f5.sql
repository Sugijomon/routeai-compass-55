-- PHASE 3: Update Existing RLS Policies to use org_admin

-- ==================== LESSONS ====================
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;

CREATE POLICY "Org admins and super admins manage lessons"
  ON public.lessons FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  );

-- ==================== COURSES ====================
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;

CREATE POLICY "Org admins and super admins manage courses"
  ON public.courses FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  );

-- ==================== COURSE_LESSONS ====================
DROP POLICY IF EXISTS "Admins can manage all course_lessons" ON public.course_lessons;

CREATE POLICY "Org admins and super admins manage course_lessons"
  ON public.course_lessons FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'org_admin'::app_role)
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'org_admin'::app_role)
  );

-- ==================== LESSON_ATTEMPTS ====================
DROP POLICY IF EXISTS "Admins can manage all lesson attempts" ON public.lesson_attempts;

CREATE POLICY "Org admins and super admins manage lesson attempts"
  ON public.lesson_attempts FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  );

-- ==================== USER_LESSON_PROGRESS ====================
DROP POLICY IF EXISTS "Admins can manage all lesson progress" ON public.user_lesson_progress;

CREATE POLICY "Org admins and super admins manage lesson progress"
  ON public.user_lesson_progress FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  );

-- ==================== USER_LESSON_COMPLETIONS ====================
DROP POLICY IF EXISTS "Admins can manage all lesson completions" ON public.user_lesson_completions;

CREATE POLICY "Org admins and super admins manage lesson completions"
  ON public.user_lesson_completions FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  );

-- ==================== USER_COURSE_PROGRESS ====================
DROP POLICY IF EXISTS "Admins can manage all course progress" ON public.user_course_progress;

CREATE POLICY "Org admins and super admins manage course progress"
  ON public.user_course_progress FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  );

-- ==================== USER_COURSE_COMPLETIONS ====================
DROP POLICY IF EXISTS "Admins can manage all course completions" ON public.user_course_completions;

CREATE POLICY "Org admins and super admins manage course completions"
  ON public.user_course_completions FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  );

-- ==================== ORGANIZATIONS ====================
DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;

CREATE POLICY "Org admins and super admins manage organizations"
  ON public.organizations FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND id = get_user_org_id(auth.uid())
    )
  );

-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Org admins and super admins manage profiles"
  ON public.profiles FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  );

-- ==================== USER_ROLES ====================
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Org admins and super admins manage roles"
  ON public.user_roles FOR ALL
  USING (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid()) 
    OR (
      has_role(auth.uid(), 'org_admin'::app_role)
      AND org_id = get_user_org_id(auth.uid())
    )
  );