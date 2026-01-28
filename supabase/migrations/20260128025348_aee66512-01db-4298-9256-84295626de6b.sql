-- Create enum type for question types
CREATE TYPE public.question_type AS ENUM (
  'multiple_choice',
  'multiple_select',
  'true_false',
  'fill_in',
  'essay'
);

-- Create learning_questions table (linked to lessons)
CREATE TABLE public.learning_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  question_type public.question_type NOT NULL,
  question_text TEXT NOT NULL,
  question_config JSONB NOT NULL DEFAULT '{}',
  correct_answer JSONB NOT NULL DEFAULT '{}',
  points INTEGER DEFAULT 1 CHECK (points > 0),
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  org_id UUID REFERENCES public.organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_learning_questions_lesson ON public.learning_questions(lesson_id);
CREATE INDEX idx_learning_questions_type ON public.learning_questions(question_type);
CREATE INDEX idx_learning_questions_order ON public.learning_questions(lesson_id, order_index);

-- Create learning_answers table
CREATE TABLE public.learning_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.learning_questions(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  user_answer JSONB NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  time_spent_seconds INTEGER,
  attempt_number INTEGER DEFAULT 1,
  org_id UUID REFERENCES public.organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique answer per user per question per attempt
  CONSTRAINT unique_user_question_attempt UNIQUE(user_id, question_id, attempt_number)
);

-- Create indexes for analytics
CREATE INDEX idx_learning_answers_user ON public.learning_answers(user_id);
CREATE INDEX idx_learning_answers_question ON public.learning_answers(question_id);
CREATE INDEX idx_learning_answers_lesson ON public.learning_answers(lesson_id);

-- Enable RLS on learning_questions
ALTER TABLE public.learning_questions ENABLE ROW LEVEL SECURITY;

-- Users can view questions in published lessons of their org
CREATE POLICY "Users can view questions in their org lessons"
  ON public.learning_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons 
      WHERE lessons.id = learning_questions.lesson_id 
      AND lessons.is_published = true 
      AND lessons.org_id = get_user_org_id(auth.uid())
    )
  );

-- Super admins and org admins can manage questions
CREATE POLICY "Admins can manage questions"
  ON public.learning_questions FOR ALL
  USING (
    is_super_admin(auth.uid()) OR 
    (has_role(auth.uid(), 'org_admin'::app_role) AND org_id = get_user_org_id(auth.uid()))
  )
  WITH CHECK (
    is_super_admin(auth.uid()) OR 
    (has_role(auth.uid(), 'org_admin'::app_role) AND org_id = get_user_org_id(auth.uid()))
  );

-- Enable RLS on learning_answers
ALTER TABLE public.learning_answers ENABLE ROW LEVEL SECURITY;

-- Users can view their own answers
CREATE POLICY "Users can view their own answers"
  ON public.learning_answers FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own answers
CREATE POLICY "Users can insert their own answers"
  ON public.learning_answers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own answers
CREATE POLICY "Users can update their own answers"
  ON public.learning_answers FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can view all answers in their org
CREATE POLICY "Admins can manage answers"
  ON public.learning_answers FOR ALL
  USING (
    is_super_admin(auth.uid()) OR 
    (has_role(auth.uid(), 'org_admin'::app_role) AND org_id = get_user_org_id(auth.uid()))
  )
  WITH CHECK (
    is_super_admin(auth.uid()) OR 
    (has_role(auth.uid(), 'org_admin'::app_role) AND org_id = get_user_org_id(auth.uid()))
  );

-- Trigger for updated_at on learning_questions
CREATE TRIGGER update_learning_questions_updated_at
  BEFORE UPDATE ON public.learning_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();