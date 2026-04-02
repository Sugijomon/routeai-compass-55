-- =============================================================
-- FIX 1: Tool discoveries — scope org_admin to own org
-- =============================================================
DROP POLICY IF EXISTS "Admins can manage all tool discoveries" ON public.tool_discoveries;

CREATE POLICY "Admins manage org-scoped tool discoveries"
  ON public.tool_discoveries FOR ALL
  TO public
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

-- Also add DPO management (UPDATE) scoped to own org
CREATE POLICY "dpo_manage_own_org_tool_discoveries"
  ON public.tool_discoveries FOR ALL
  TO authenticated
  USING (
    is_dpo(auth.uid())
    AND org_id = get_user_org_id(auth.uid())
  )
  WITH CHECK (
    is_dpo(auth.uid())
    AND org_id = get_user_org_id(auth.uid())
  );

-- =============================================================
-- FIX 2: Storage — restrict INSERT/DELETE to admins & editors
-- =============================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload lesson images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete lesson images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete lesson files" ON storage.objects;

-- Restricted INSERT for lesson-images
CREATE POLICY "Admins and editors can upload lesson images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-images'
    AND (
      is_super_admin(auth.uid())
      OR is_content_editor(auth.uid())
      OR is_org_admin(auth.uid())
    )
  );

-- Restricted DELETE for lesson-images
CREATE POLICY "Admins and editors can delete lesson images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesson-images'
    AND (
      is_super_admin(auth.uid())
      OR is_content_editor(auth.uid())
      OR is_org_admin(auth.uid())
    )
  );

-- Restricted INSERT for lesson-files
CREATE POLICY "Admins and editors can upload lesson files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-files'
    AND (
      is_super_admin(auth.uid())
      OR is_content_editor(auth.uid())
      OR is_org_admin(auth.uid())
    )
  );

-- Restricted DELETE for lesson-files
CREATE POLICY "Admins and editors can delete lesson files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesson-files'
    AND (
      is_super_admin(auth.uid())
      OR is_content_editor(auth.uid())
      OR is_org_admin(auth.uid())
    )
  );