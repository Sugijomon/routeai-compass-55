import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface OnboardingStatus {
  step: 'scan_pending' | 'learning' | 'exam_ready' | 'rijbewijs_done' | 'first_check_done';
  percentage: number;
  hasScan: boolean;
  hasStartedCourse: boolean;
  hasCompletedCourse: boolean;
  hasRijbewijs: boolean;
  hasFirstAssessment: boolean;
  lessonProgressPct: number;
}

export function useOnboardingStatus(): OnboardingStatus {
  const { user } = useAuth();
  const { hasAiRijbewijs, profile } = useUserProfile();

  const { data: scanDone } = useQuery({
    queryKey: ['onboarding-scan', user?.id],
    queryFn: async () => {
      if (!user || !profile?.org_id) return false;
      const { count } = await supabase
        .from('shadow_survey_runs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('survey_completed_at', 'is', null);
      return (count ?? 0) > 0;
    },
    enabled: !!user && !!profile?.org_id,
  });

  const { data: courseProgress } = useQuery({
    queryKey: ['onboarding-course-progress', user?.id],
    queryFn: async () => {
      if (!user) return { started: false, completed: false, pct: 0 };
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('required_for_onboarding', true)
        .eq('is_published', true)
        .limit(1);
      if (!courses?.[0]) return { started: false, completed: false, pct: 0 };

      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('lesson_id')
        .eq('course_id', courses[0].id);
      const lessonIds = (lessons ?? []).map(l => l.lesson_id).filter(Boolean) as string[];
      if (lessonIds.length === 0) return { started: false, completed: false, pct: 0 };

      const { data: progress } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, progress_percentage')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      const started = (progress ?? []).some(p => (p.progress_percentage ?? 0) > 0);
      const totalPct = lessonIds.length > 0
        ? Math.round(
            (progress ?? []).reduce((sum, p) => sum + (p.progress_percentage ?? 0), 0) / lessonIds.length
          )
        : 0;

      const { data: completions } = await supabase
        .from('user_lesson_completions')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);
      const completedIds = new Set((completions ?? []).map(c => c.lesson_id));
      const nonExamLessons = lessonIds.slice(0, -1);
      const allCompleted = nonExamLessons.length > 0 && nonExamLessons.every(id => completedIds.has(id));

      return { started, completed: allCompleted, pct: totalPct };
    },
    enabled: !!user,
  });

  const { data: assessmentCount } = useQuery({
    queryKey: ['onboarding-assessments', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const hasScan = scanDone ?? false;
  const hasStartedCourse = courseProgress?.started ?? false;
  const hasCompletedCourse = courseProgress?.completed ?? false;
  const hasRijbewijs = hasAiRijbewijs ?? false;
  const hasFirstAssessment = (assessmentCount ?? 0) > 0;

  let step: OnboardingStatus['step'] = 'scan_pending';
  let percentage = 0;

  if (hasFirstAssessment) {
    step = 'first_check_done';
    percentage = 100;
  } else if (hasRijbewijs) {
    step = 'rijbewijs_done';
    percentage = 80;
  } else if (hasCompletedCourse) {
    step = 'exam_ready';
    percentage = 60;
  } else if (hasStartedCourse) {
    step = 'learning';
    percentage = 20 + Math.round((courseProgress?.pct ?? 0) * 0.4);
  } else if (hasScan) {
    step = 'learning';
    percentage = 20;
  } else {
    step = 'scan_pending';
    percentage = 0;
  }

  return {
    step, percentage,
    hasScan, hasStartedCourse, hasCompletedCourse,
    hasRijbewijs, hasFirstAssessment,
    lessonProgressPct: courseProgress?.pct ?? 0,
  };
}
