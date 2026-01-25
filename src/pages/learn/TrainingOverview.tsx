import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  BookOpen,
  GraduationCap,
  CheckCircle,
  ArrowRight,
  Clock,
  FileText,
  Star,
  XCircle,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;
type Lesson = Tables<'lessons'>;

interface CourseWithProgress extends Course {
  lessonsCount: number;
  completedLessons: number;
  progressPercentage: number;
  isCompleted: boolean;
}

interface LessonWithProgress extends Lesson {
  isCompleted: boolean;
  hasProgress: boolean;
  score: number | null;
  passed: boolean;
}

export default function TrainingOverview() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
  }, []);

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
    queryKey: ['user-all-course-progress', userId],
    queryFn: async () => {
      if (!userId) return {};

      const { data, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', userId);

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
    enabled: !!userId,
  });

  // Fetch user's completed courses
  const { data: completedCourses } = useQuery({
    queryKey: ['user-completed-courses', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();

      const { data, error } = await supabase
        .from('user_course_completions')
        .select('course_id')
        .eq('user_id', userId);

      if (error) throw error;
      return new Set(data?.map((c) => c.course_id) ?? []);
    },
    enabled: !!userId,
  });

  // Fetch standalone lessons (lessons not assigned to any course)
  const { data: standaloneLessons } = useQuery({
    queryKey: ['standalone-lessons'],
    queryFn: async () => {
      // Get all lesson IDs that are part of courses
      const { data: courseLessonData } = await supabase
        .from('course_lessons')
        .select('lesson_id');
      
      const lessonIdsInCourses = new Set(courseLessonData?.map(cl => cl.lesson_id) ?? []);
      
      // Get all published standalone lessons
      const { data: allLessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('is_published', true)
        .eq('lesson_type', 'standalone')
        .order('title');

      if (error) throw error;
      
      // Filter out lessons that are in courses
      return (allLessons ?? []).filter(lesson => !lessonIdsInCourses.has(lesson.id)) as Lesson[];
    },
  });

  // Fetch user's completed lessons with score data
  const { data: lessonCompletions } = useQuery({
    queryKey: ['user-lesson-completions-detail', userId],
    queryFn: async () => {
      if (!userId) return new Map<string, { score: number | null }>();

      const { data, error } = await supabase
        .from('user_lesson_completions')
        .select('lesson_id, score')
        .eq('user_id', userId);

      if (error) throw error;
      
      const map = new Map<string, { score: number | null }>();
      data?.forEach((l) => {
        map.set(l.lesson_id, { score: l.score });
      });
      return map;
    },
    enabled: !!userId,
  });

  // Fetch user's lesson progress (in-progress lessons)
  const { data: lessonProgress } = useQuery({
    queryKey: ['user-lesson-progress-all', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();

      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId);

      if (error) throw error;
      return new Set(data?.map((p) => p.lesson_id) ?? []);
    },
    enabled: !!userId,
  });

  // Derive completed lessons set from completions
  const completedLessons = new Set(lessonCompletions?.keys() ?? []);

  // Combine standalone lessons with completion status and progress
  const standaloneLessonsWithProgress: LessonWithProgress[] = (standaloneLessons ?? []).map((lesson) => {
    const completion = lessonCompletions?.get(lesson.id);
    const isCompleted = completedLessons.has(lesson.id);
    const hasProgress = lessonProgress?.has(lesson.id) ?? false;
    const score = completion?.score ?? null;
    const passingScore = lesson.passing_score ?? 0;
    const passed = isCompleted && (passingScore === 0 || (score !== null && score >= passingScore));
    
    return {
      ...lesson,
      isCompleted,
      hasProgress: hasProgress && !isCompleted,
      score,
      passed,
    };
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
      <PageHeader
        title="Leren"
        subtitle="Voltooi cursussen om AI verantwoord te kunnen gebruiken."
        icon={<GraduationCap className="h-5 w-5" />}
        backButton={{}}
      />

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

        {/* Standalone Lessons */}
        {standaloneLessonsWithProgress.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Losse Lessen</h2>
            </div>
            <div className="grid gap-4">
              {standaloneLessonsWithProgress.map((lesson) => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  userId={userId}
                  onRetry={() => {
                    // Invalidate queries to refetch data
                    // The query keys will auto-refetch
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {coursesWithProgress.length === 0 && standaloneLessonsWithProgress.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Geen leermateriaal beschikbaar</h3>
              <p className="text-muted-foreground">
                Er zijn momenteel geen gepubliceerde cursussen of lessen.
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

function LessonCard({ lesson, userId, onRetry }: { 
  lesson: LessonWithProgress; 
  userId: string | null;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Determine lesson status
  const isCompletedAndPassed = lesson.isCompleted && lesson.passed;
  const isCompletedButFailed = lesson.isCompleted && !lesson.passed;
  const isInProgress = lesson.hasProgress && !lesson.isCompleted;
  
  const handleRetry = async () => {
    if (!userId || !lesson.id) return;
    
    setIsRetrying(true);
    try {
      // Delete lesson progress to reset quiz answers
      await supabase
        .from('user_lesson_progress')
        .delete()
        .eq('user_id', userId)
        .eq('lesson_id', lesson.id);
      
      console.log('Deleted lesson progress for retry');
      onRetry();
      
      // Navigate to lesson fresh
      navigate(`/learn/${lesson.id}?retry=true`);
    } catch (error) {
      console.error('Error resetting lesson:', error);
      toast.error('Kon les niet resetten');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        isCompletedAndPassed && 'bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800',
        isCompletedButFailed && 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-800'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                isCompletedAndPassed
                  ? 'bg-green-500 text-white'
                  : isCompletedButFailed
                  ? 'bg-red-500 text-white'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {isCompletedAndPassed ? (
                <CheckCircle className="h-5 w-5" />
              ) : isCompletedButFailed ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{lesson.title}</CardTitle>
              {lesson.description && (
                <CardDescription className="mt-1 line-clamp-1">
                  {lesson.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lesson.score !== null && (
              <Badge 
                variant={lesson.passed ? 'default' : 'destructive'}
                className={lesson.passed ? 'bg-green-600' : ''}
              >
                {lesson.score}%
              </Badge>
            )}
            {lesson.estimated_duration && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {lesson.estimated_duration} min
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {isCompletedAndPassed ? (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Geslaagd
              </span>
            ) : isCompletedButFailed ? (
              <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                Niet geslaagd
              </span>
            ) : isInProgress ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Bezig
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Losse les
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View results button for completed lessons */}
            {lesson.isCompleted && (
              <Button
                onClick={() => navigate(`/learn/${lesson.id}?review=true`)}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <Eye className="h-4 w-4" />
                Bekijk
              </Button>
            )}
            
            {/* Main action button */}
            {isCompletedButFailed ? (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="gap-2"
              >
                <RotateCcw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
                Opnieuw proberen
              </Button>
            ) : isInProgress ? (
              <Button
                onClick={() => navigate(`/learn/${lesson.id}`)}
                className="gap-2"
              >
                Doorgaan
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : isCompletedAndPassed ? (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                variant="outline"
                className="gap-2"
              >
                <RotateCcw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
                Opnieuw
              </Button>
            ) : (
              <Button
                onClick={() => navigate(`/learn/${lesson.id}`)}
                className="gap-2"
              >
                Start les
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
