-- Drop existing restrictive policies on user_lesson_progress
DROP POLICY IF EXISTS "Users can insert their own lesson progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Users can update their own lesson progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Users can view their own lesson progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Admins can manage all lesson progress" ON public.user_lesson_progress;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Admins can manage all lesson progress"
ON public.user_lesson_progress
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own lesson progress"
ON public.user_lesson_progress
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson progress"
ON public.user_lesson_progress
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress"
ON public.user_lesson_progress
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);