
-- Fix 1: Revoke anonymous read access on organizations
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Public organizations are viewable by everyone" ON public.organizations;

CREATE POLICY "organizations_no_anon_read"
ON public.organizations
FOR SELECT
TO anon
USING (false);

-- Fix 2: Drop overly permissive org_admin survey runs policy
DROP POLICY IF EXISTS "Org admins can read all survey runs" ON public.shadow_survey_runs;
DROP POLICY IF EXISTS "org_admin_read_survey_runs" ON public.shadow_survey_runs;
DROP POLICY IF EXISTS "Admins can view all survey runs" ON public.shadow_survey_runs;

CREATE POLICY "org_scoped_survey_runs_read"
ON public.shadow_survey_runs
FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id(auth.uid())
  AND (
    is_org_admin(auth.uid())
    OR is_dpo(auth.uid())
    OR user_id = auth.uid()
  )
);
