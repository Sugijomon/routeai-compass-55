
DROP POLICY IF EXISTS "Users can insert their own lesson progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Users can update their own lesson progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Users can view their own lesson progress" ON public.user_lesson_progress;

CREATE POLICY "Users manage own lesson progress"
  ON public.user_lesson_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
