import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  GraduationCap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  Lock,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;

interface CourseWithProgress extends Course {
  lessonsCount: number;
  completedLessons: number;
  progressPercentage: number;
  isCompleted: boolean;
}

export default function TrainingOverview() {
  const navigate = useNavigate();
  const getCurrentUser = useAppStore((state) => state.getCurrentUser);
  const currentUser = getCurrentUser();

  // Fetch published courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ['published-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('required_for_onboarding', { ascending: false })
        .order('title');

      if (error) throw error;
      return data as Course[];
    },
  });

  // Fetch lesson counts for each course
  const { data: courseLessonCounts } = useQuery({
    queryKey: ['course-lesson-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('course_id');

      if (error) throw error;

      // Count lessons per course
      const counts: Record<string, number> = {};
      data?.forEach((cl) => {
        if (cl.course_id) {
          counts[cl.course_id] = (counts[cl.course_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Fetch user's course progress
  const { data: userProgress } = useQuery({
    queryKey: ['user-all-course-progress', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return {};

      const { data, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', currentUser.id);

      if (error) throw error;

      const progressMap: Record<string, { completed: number; percentage: number }> = {};
      data?.forEach((p) => {
        progressMap[p.course_id] = {
          completed: p.lessons_completed ?? 0,
          percentage: p.progress_percentage ?? 0,
        };
      });
      return progressMap;
    },
    enabled: !!currentUser?.id,
  });

  // Fetch user's completed courses
  const { data: completedCourses } = useQuery({
    queryKey: ['user-completed-courses', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return new Set<string>();

      const { data, error } = await supabase
        .from('user_course_completions')
        .select('course_id')
        .eq('user_id', currentUser.id);

      if (error) throw error;
      return new Set(data?.map((c) => c.course_id) ?? []);
    },
    enabled: !!currentUser?.id,
  });

  // Combine course data with progress
  const coursesWithProgress: CourseWithProgress[] = (courses ?? []).map((course) => ({
    ...course,
    lessonsCount: courseLessonCounts?.[course.id] ?? 0,
    completedLessons: userProgress?.[course.id]?.completed ?? 0,
    progressPercentage: userProgress?.[course.id]?.percentage ?? 0,
    isCompleted: completedCourses?.has(course.id) ?? false,
  }));

  // Separate required and optional courses
  const requiredCourses = coursesWithProgress.filter((c) => c.required_for_onboarding);
  const optionalCourses = coursesWithProgress.filter((c) => !c.required_for_onboarding);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate('/user-dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar dashboard
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Leren</h1>
          </div>
          <p className="text-muted-foreground">
            Voltooi cursussen om AI verantwoord te kunnen gebruiken.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Required Courses */}
        {requiredCourses.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold">Verplichte Cursussen</h2>
            </div>
            <div className="grid gap-4">
              {requiredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* Optional Courses */}
        {optionalCourses.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Overige Cursussen</h2>
            </div>
            <div className="grid gap-4">
              {optionalCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {coursesWithProgress.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Geen cursussen beschikbaar</h3>
              <p className="text-muted-foreground">
                Er zijn momenteel geen gepubliceerde cursussen.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function CourseCard({ course }: { course: CourseWithProgress }) {
  const navigate = useNavigate();
  const hasStarted = course.progressPercentage > 0;

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        course.isCompleted && 'bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800',
        course.required_for_onboarding && !course.isCompleted && 'border-amber-200 dark:border-amber-800'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                course.isCompleted
                  ? 'bg-green-500 text-white'
                  : course.required_for_onboarding
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {course.isCompleted ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <BookOpen className="h-5 w-5" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{course.title}</CardTitle>
              {course.description && (
                <CardDescription className="mt-1 line-clamp-1">
                  {course.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {course.required_for_onboarding && !course.isCompleted && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400">
                Verplicht
              </Badge>
            )}
            {course.unlocks_capability && (
              <Badge variant="secondary" className="gap-1">
                <GraduationCap className="h-3 w-3" />
                {course.unlocks_capability === 'ai_rijbewijs' ? 'AI Rijbewijs' : course.unlocks_capability}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          {/* Progress info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {course.lessonsCount} lessen
              </span>
              {course.isCompleted ? (
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  Afgerond
                </span>
              ) : hasStarted ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {course.completedLessons} / {course.lessonsCount} voltooid
                </span>
              ) : null}
            </div>
            {!course.isCompleted && hasStarted && (
              <Progress value={course.progressPercentage} className="h-2" />
            )}
          </div>

          {/* Action button */}
          <Button
            onClick={() => navigate(`/learn/course/${course.id}`)}
            variant={course.isCompleted ? 'outline' : 'default'}
            className="gap-2 shrink-0"
          >
            {course.isCompleted ? (
              <>Bekijk opnieuw</>
            ) : hasStarted ? (
              <>
                Doorgaan
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Start cursus
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
