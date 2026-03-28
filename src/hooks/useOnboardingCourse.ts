// RouteAI-only hook — niet gebruiken in Shadow AI
// standalone flow. Tier-toewijzing in RouteAI
// gebeurt via DPO-toewijzing (toekomstige feature).

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { useUserProfile } from '@/hooks/useUserProfile';

export function useOnboardingCourse() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const userId = user?.id;
  const orgId = profile?.org_id;

  // Haal het onboarding-course op, gefilterd op org_id
  const { data: onboardingCourse, isLoading: courseLoading } = useQuery({
    queryKey: ['onboarding-course', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('required_for_onboarding', true)
        .eq('is_published', true)
        .eq('org_id', orgId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Haal user's voortgang op
  const { data: courseProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['onboarding-course-progress', onboardingCourse?.id, userId],
    queryFn: async () => {
      if (!onboardingCourse?.id || !userId) return null;

      const { data, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('course_id', onboardingCourse.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!onboardingCourse?.id && !!userId,
  });

  // Check of course voltooid is
  const { data: courseCompletion } = useQuery({
    queryKey: ['onboarding-course-completion', onboardingCourse?.id, userId],
    queryFn: async () => {
      if (!onboardingCourse?.id || !userId) return null;

      const { data, error } = await supabase
        .from('user_course_completions')
        .select('*')
        .eq('course_id', onboardingCourse.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!onboardingCourse?.id && !!userId,
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
