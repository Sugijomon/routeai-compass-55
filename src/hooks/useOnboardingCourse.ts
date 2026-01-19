import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';

export function useOnboardingCourse() {
  const getCurrentUser = useAppStore((state) => state.getCurrentUser);
  const currentUser = getCurrentUser();

  // Find the onboarding course (required_for_onboarding = true)
  const { data: onboardingCourse, isLoading: courseLoading } = useQuery({
    queryKey: ['onboarding-course'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('required_for_onboarding', true)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Get user's progress on the onboarding course
  const { data: courseProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['onboarding-course-progress', onboardingCourse?.id, currentUser?.id],
    queryFn: async () => {
      if (!onboardingCourse?.id || !currentUser?.id) return null;

      const { data, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('course_id', onboardingCourse.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!onboardingCourse?.id && !!currentUser?.id,
  });

  // Check if course is completed
  const { data: courseCompletion } = useQuery({
    queryKey: ['onboarding-course-completion', onboardingCourse?.id, currentUser?.id],
    queryFn: async () => {
      if (!onboardingCourse?.id || !currentUser?.id) return null;

      const { data, error } = await supabase
        .from('user_course_completions')
        .select('*')
        .eq('course_id', onboardingCourse.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!onboardingCourse?.id && !!currentUser?.id,
  });

  return {
    onboardingCourse,
    courseProgress,
    courseCompletion,
    isLoading: courseLoading || progressLoading,
    hasOnboardingCourse: !!onboardingCourse,
    progressPercentage: courseProgress?.progress_percentage ?? 0,
    isCompleted: !!courseCompletion,
  };
}
