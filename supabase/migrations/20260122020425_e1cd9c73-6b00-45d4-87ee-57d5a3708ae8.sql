-- Drop existing restrictive policies on lessons
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
DROP POLICY IF EXISTS "Anyone can view published lessons" ON public.lessons;

-- Recreate as PERMISSIVE policies (default, uses OR logic)
CREATE POLICY "Admins can manage all lessons"
ON public.lessons
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow any authenticated user to view published lessons
CREATE POLICY "Authenticated users can view published lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (is_published = true);