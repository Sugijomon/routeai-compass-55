-- Drop existing restrictive policies for lessons
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
DROP POLICY IF EXISTS "Anyone can view published lessons" ON public.lessons;

-- Create permissive policies instead
CREATE POLICY "Admins can manage all lessons" 
ON public.lessons 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published lessons" 
ON public.lessons 
FOR SELECT 
TO authenticated
USING (is_published = true);

-- Also fix courses policies
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;

CREATE POLICY "Admins can manage all courses" 
ON public.courses 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published courses" 
ON public.courses 
FOR SELECT 
TO authenticated
USING (is_published = true);

-- Fix course_lessons policies
DROP POLICY IF EXISTS "Admins can manage all course_lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Anyone can view course_lessons for published courses" ON public.course_lessons;

CREATE POLICY "Admins can manage all course_lessons" 
ON public.course_lessons 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view course_lessons for published courses" 
ON public.course_lessons 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = course_lessons.course_id 
  AND courses.is_published = true
));