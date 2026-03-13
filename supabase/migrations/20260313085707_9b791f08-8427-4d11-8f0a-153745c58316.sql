-- Replace the UPDATE policy on profiles to limit user modifications
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (limited)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND has_ai_rijbewijs = (SELECT has_ai_rijbewijs FROM public.profiles WHERE id = auth.uid())
  );

-- Create rijbewijs_records table as audit trail
CREATE TABLE public.rijbewijs_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES public.organizations(id),
  lesson_attempt_id UUID REFERENCES public.lesson_attempts(id),
  exam_version TEXT NOT NULL DEFAULT '1.0',
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'superseded', 'reexam_required')),
  UNIQUE(user_id)
);

ALTER TABLE public.rijbewijs_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rijbewijs" 
  ON public.rijbewijs_records FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rijbewijs" 
  ON public.rijbewijs_records FOR SELECT 
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Create trigger function to grant rijbewijs on exam pass
CREATE OR REPLACE FUNCTION public.grant_rijbewijs_on_exam_pass()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.passed = true THEN
    DECLARE v_lesson_type TEXT;
    BEGIN
      SELECT lesson_type INTO v_lesson_type FROM public.lessons WHERE id = NEW.lesson_id;
      IF v_lesson_type = 'ai_literacy_exam' THEN
        INSERT INTO public.rijbewijs_records (user_id, org_id, lesson_attempt_id)
          VALUES (NEW.user_id, NEW.org_id, NEW.id)
          ON CONFLICT (user_id) DO UPDATE SET
            status = 'active',
            earned_at = NOW(),
            lesson_attempt_id = NEW.id;
        UPDATE public.profiles SET
          has_ai_rijbewijs = true,
          ai_rijbewijs_obtained_at = NOW()
        WHERE id = NEW.user_id;
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_rijbewijs_on_exam_pass
  AFTER INSERT OR UPDATE ON public.lesson_attempts
  FOR EACH ROW EXECUTE FUNCTION public.grant_rijbewijs_on_exam_pass();