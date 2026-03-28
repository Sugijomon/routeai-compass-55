-- Fix: org_admin read-policies scopen op eigen organisatie via assessments.org_id

-- assessment_ml_assignments
DROP POLICY IF EXISTS "org_admin_read_org_ml_assignments" ON public.assessment_ml_assignments;
CREATE POLICY "org_admin_read_org_ml_assignments"
  ON public.assessment_ml_assignments
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_org_admin(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_ml_assignments.assessment_id
          AND a.org_id = get_user_org_id(auth.uid())
      )
    )
  );

-- assessment_ml_completions
DROP POLICY IF EXISTS "org_admin_read_org_ml_completions" ON public.assessment_ml_completions;
CREATE POLICY "org_admin_read_org_ml_completions"
  ON public.assessment_ml_completions
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      is_org_admin(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_ml_completions.assessment_id
          AND a.org_id = get_user_org_id(auth.uid())
      )
    )
  );