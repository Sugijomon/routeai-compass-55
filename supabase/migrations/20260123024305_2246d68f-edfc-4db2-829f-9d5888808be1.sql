-- Create lesson_attempts table to track each user attempt at a lesson
CREATE TABLE public.lesson_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  score INTEGER,
  max_score INTEGER,
  percentage INTEGER,
  passed BOOLEAN DEFAULT false,
  time_spent INTEGER, -- seconds
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for user + lesson + attempt_number
ALTER TABLE public.lesson_attempts 
  ADD CONSTRAINT unique_user_lesson_attempt UNIQUE (user_id, lesson_id, attempt_number);

-- Add index for quick lookups
CREATE INDEX idx_lesson_attempts_user_lesson ON public.lesson_attempts(user_id, lesson_id);
CREATE INDEX idx_lesson_attempts_lesson ON public.lesson_attempts(lesson_id);

-- Enable RLS
ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own lesson attempts"
  ON public.lesson_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson attempts"
  ON public.lesson_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson attempts"
  ON public.lesson_attempts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all lesson attempts"
  ON public.lesson_attempts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));