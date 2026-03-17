import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AssignedTier } from '@/lib/riskEngine';

export function useOnboardingCourse() {
  const { user } = useAuth();
  const userId = user?.id;

  // Haal de meest recente afgeronde survey run op voor tier-bepaling
  const { data: surveyRun, isLoading: surveyLoading } = useQuery({
    queryKey: ['user-survey-tier', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shadow_survey_runs')
        .select('assigned_tier, survey_completed_at, dpo_review_required')
        .eq('user_id', userId!)
        .not('survey_completed_at', 'is', null)
        .order('survey_completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const assignedTier = (surveyRun?.assigned_tier as AssignedTier) ?? null;
  const surveyCompleted = !!surveyRun?.survey_completed_at;
  const dpoReviewRequired = surveyRun?.dpo_review_required ?? false;

  // Haal het onboarding-course op
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

  // Haal learning_catalog items gefilterd op tier
  const { data: filteredCatalogItems, isLoading: catalogLoading } = useQuery({
    queryKey: ['tier-filtered-catalog', userId, assignedTier],
    queryFn: async () => {
      if (!userId || !assignedTier || assignedTier === 'custom') return [];

      // Haal org_id op
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', userId)
        .single();

      if (!profile) return [];

      // Haal verplichte catalog items op
      let query = supabase
        .from('learning_catalog')
        .select(`
          *,
          learning_library!inner(*)
        `)
        .eq('org_id', profile.org_id)
        .eq('is_mandatory', true)
        .eq('is_enabled', true);

      // Standard: alleen basis-niveau
      if (assignedTier === 'standard') {
        query = query.eq('learning_library.difficulty_level', 'basic');
      }
      // Advanced: alle verplichte modules, ongeacht difficulty

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId && !!assignedTier && assignedTier !== 'custom',
  });

  // Bereken verwachte duur op basis van tier
  const expectedModules = assignedTier === 'standard' ? 3 : assignedTier === 'advanced' ? 5 : 0;
  const expectedMinutes = assignedTier === 'standard' ? 20 : assignedTier === 'advanced' ? 35 : 0;

  // Custom tier: wacht op DPO
  const isCustomTierBlocked = assignedTier === 'custom';

  return {
    onboardingCourse,
    courseProgress,
    courseCompletion,
    isLoading: courseLoading || progressLoading || surveyLoading,
    hasOnboardingCourse: !!onboardingCourse,
    progressPercentage: courseProgress?.progress_percentage ?? 0,
    isCompleted: !!courseCompletion,

    // Tier-gerelateerde data
    assignedTier,
    surveyCompleted,
    dpoReviewRequired,
    isCustomTierBlocked,
    filteredCatalogItems: filteredCatalogItems ?? [],
    catalogLoading,
    expectedModules,
    expectedMinutes,
  };
}
