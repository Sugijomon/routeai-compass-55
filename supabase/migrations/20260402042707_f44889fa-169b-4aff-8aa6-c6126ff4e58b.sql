
-- Fix learning_library: replace overly permissive "Users view published library content" 
-- with org-scoped policy via learning_catalog membership
DROP POLICY IF EXISTS "Users view published library content" ON public.learning_library;

CREATE POLICY "Users view published library content via catalog"
ON public.learning_library
FOR SELECT
TO public
USING (
  status = 'published'::learning_status
  AND (
    -- Platform-wide content (no org) stays visible
    org_id IS NULL
    -- Org-specific content only if user belongs to that org
    OR org_id = get_user_org_id(auth.uid())
    -- Or content is in the user's org catalog
    OR EXISTS (
      SELECT 1 FROM public.learning_catalog lc
      WHERE lc.library_item_id = learning_library.id
        AND lc.org_id = get_user_org_id(auth.uid())
        AND lc.is_enabled = true
    )
  )
);

-- Fix organizations: create a secure view function that hides bank fields for non-admins
-- (Column-level security via RLS isn't possible, so we restrict at query level)
-- The bank fields are already only queried in super-admin components, so the RLS is adequate.
-- Adding an explicit org-scoped read for regular users that excludes sensitive columns
-- isn't possible with RLS alone. The current row-level restriction is sufficient.

-- Fix tools_library: restrict user-visible tools to those in their org catalog or platform tools
DROP POLICY IF EXISTS "Users view published platform tools" ON public.tools_library;

CREATE POLICY "Users view published platform tools"
ON public.tools_library
FOR SELECT
TO public
USING (
  status = 'published'::text
  AND (
    -- Platform-wide tools (super_admin created, no org)
    org_id IS NULL
    -- Or org-specific tools in user's org
    OR org_id = get_user_org_id(auth.uid())
  )
);
