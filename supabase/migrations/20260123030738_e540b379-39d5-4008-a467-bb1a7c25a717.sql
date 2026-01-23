-- Add UPDATE policy for user_lesson_completions (users can update their own records)
CREATE POLICY "Users can update their own lesson completions" 
ON public.user_lesson_completions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure unique constraint exists for upsert to work properly
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_user_lesson_completion'
  ) THEN
    ALTER TABLE public.user_lesson_completions 
    ADD CONSTRAINT unique_user_lesson_completion UNIQUE (user_id, lesson_id);
  END IF;
END $$;