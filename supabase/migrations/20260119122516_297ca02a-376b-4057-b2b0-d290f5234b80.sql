-- Add unique constraints for upsert operations on progress/completion tables

-- Unique constraint on user_lesson_completions (user can only complete a lesson once)
ALTER TABLE public.user_lesson_completions
ADD CONSTRAINT unique_user_lesson_completion UNIQUE (user_id, lesson_id);

-- Unique constraint on user_course_completions (user can only complete a course once)
ALTER TABLE public.user_course_completions
ADD CONSTRAINT unique_user_course_completion UNIQUE (user_id, course_id);

-- Unique constraint on user_course_progress (one progress record per user per course)
ALTER TABLE public.user_course_progress
ADD CONSTRAINT unique_user_course_progress UNIQUE (user_id, course_id);

-- Unique constraint on course_lessons (a lesson can only be in a course once)
ALTER TABLE public.course_lessons
ADD CONSTRAINT unique_course_lesson UNIQUE (course_id, lesson_id);