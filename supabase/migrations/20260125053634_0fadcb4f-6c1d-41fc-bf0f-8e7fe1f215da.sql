
-- =====================================================
-- MULTI-TENANT SUPPORT: Organizations Table
-- =====================================================

-- STEP 1: Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  sector text,
  country text DEFAULT 'NL',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- STEP 2: Add org_id columns to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.lesson_attempts ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_lesson_progress ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_lesson_completions ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_course_progress ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_course_completions ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- STEP 3: Create default organization (Digidactics)
INSERT INTO public.organizations (id, name, slug, sector, country)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Digidactics', 'digidactics', 'EdTech', 'NL')
ON CONFLICT (id) DO NOTHING;

-- STEP 4: Assign all existing data to default org
UPDATE public.profiles SET org_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE org_id IS NULL;
UPDATE public.lessons SET org_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE org_id IS NULL;
UPDATE public.courses SET org_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE org_id IS NULL;
UPDATE public.user_roles SET org_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE org_id IS NULL;
UPDATE public.lesson_attempts SET org_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE org_id IS NULL;
UPDATE public.user_lesson_progress SET org_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE org_id IS NULL;
UPDATE public.user_lesson_completions SET org_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE org_id IS NULL;
UPDATE public.user_course_progress SET org_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE org_id IS NULL;
UPDATE public.user_course_completions SET org_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE org_id IS NULL;

-- STEP 5: Create helper function to get user's org_id (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- STEP 6: RLS policies for organizations table
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Admins can manage organizations"
  ON public.organizations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- STEP 7: Update existing RLS policies to scope by org_id

-- Lessons policies
DROP POLICY IF EXISTS "Authenticated users can view published lessons" ON public.lessons;
CREATE POLICY "Users can view published lessons in their org"
  ON public.lessons FOR SELECT
  USING (
    is_published = true 
    AND org_id = public.get_user_org_id(auth.uid())
  );

-- Courses policies  
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Users can view published courses in their org"
  ON public.courses FOR SELECT
  USING (
    is_published = true 
    AND org_id = public.get_user_org_id(auth.uid())
  );

-- Course lessons policies
DROP POLICY IF EXISTS "Anyone can view course_lessons for published courses" ON public.course_lessons;
CREATE POLICY "Users can view course_lessons for published courses in their org"
  ON public.course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_lessons.course_id 
        AND courses.is_published = true
        AND courses.org_id = public.get_user_org_id(auth.uid())
    )
  );

-- STEP 8: Update handle_new_user trigger to assign org
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_org_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  org_user_count INTEGER;
BEGIN
  -- Insert the profile with default org
  INSERT INTO public.profiles (id, email, full_name, org_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    default_org_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    org_id = COALESCE(profiles.org_id, default_org_id);
  
  -- Check if this is the first user in the organization
  SELECT COUNT(*) INTO org_user_count 
  FROM public.profiles 
  WHERE org_id = default_org_id;
  
  -- If first user in org, grant admin role
  IF org_user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (NEW.id, 'admin', default_org_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- STEP 9: Make org_id NOT NULL after data migration
ALTER TABLE public.profiles ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;

ALTER TABLE public.lessons ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.lessons ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;

ALTER TABLE public.courses ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.courses ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;

ALTER TABLE public.user_roles ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
