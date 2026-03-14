import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ArrowRight, 
  BookOpen, 
  ArrowLeft,
  GraduationCap,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;
type Lesson = Tables<'lessons'>;
type CourseLesson = Tables<'course_lessons'>;

interface CourseLessonWithDetails extends CourseLesson {
  lesson: Lesson;
}

export default function CoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  // Get authenticated user from Supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('No course ID');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_published', true)
        .single();
      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });

  // Fetch course lessons with details
  const { data: courseLessons } = useQuery({
    queryKey: ['course-lessons-player', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_lessons')
        .select(`
          *,
          lesson:lessons(*)
        `)
        .eq('course_id', courseId)
        .order('sequence_order', { ascending: true });
      if (error) throw error;
      return (data || []).map((cl) => ({
        ...cl,
        lesson: cl.lesson as Lesson,
      })) as CourseLessonWithDetails[];
    },
    enabled: !!courseId,
  });

  // Fetch user's completed lessons for this course
  const { data: completedLessonIds } = useQuery({
    queryKey: ['user-lesson-completions', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) return [];
      
      // Get lesson IDs in this course
      const lessonIds = courseLessons?.map((cl) => cl.lesson_id).filter(Boolean) ?? [];
      if (lessonIds.length === 0) return [];

      const { data, error } = await supabase
        .from('user_lesson_completions')
        .select('lesson_id')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      if (error) throw error;
      return data?.map((c) => c.lesson_id) ?? [];
    },
    enabled: !!courseId && !!userId && !!courseLessons,
  });

  // Fetch course progress
  const { data: _courseProgress } = useQuery({
    queryKey: ['user-course-progress', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) return null;
      const { data } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
      return data;
    },
    enabled: !!courseId && !!userId,
  });

  // Check if course is already completed
  const { data: courseCompletion } = useQuery({
    queryKey: ['user-course-completion', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) return null;
      const { data } = await supabase
        .from('user_course_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
      return data;
    },
    enabled: !!courseId && !!userId,
  });

  const getLessonStatus = (_index: number, lessonId: string | null) => {
    if (!lessonId) return 'available';
    
    if (completedLessonIds?.includes(lessonId)) {
      return 'completed';
    }
    
    return 'available';
  };

  // Calculate progress
  const completedCount = completedLessonIds?.length ?? 0;
  const totalCount = courseLessons?.length ?? 0;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Find next lesson to work on
  const findNextLesson = () => {
    if (!courseLessons) return null;
    for (let i = 0; i < courseLessons.length; i++) {
      const status = getLessonStatus(i, courseLessons[i].lesson_id);
      if (status === 'current') {
        return courseLessons[i];
      }
    }
    return null;
  };

  const nextLesson = findNextLesson();

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Cursus niet gevonden</h2>
            <p className="text-muted-foreground mb-4">
              Deze cursus bestaat niet of is niet gepubliceerd.
            </p>
            <Button onClick={() => navigate('/training')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar overzicht
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate('/training')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar overzicht
          </Button>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <Badge variant="outline">Cursus</Badge>
                {courseCompletion && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Afgerond
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              {course.description && (
                <p className="text-muted-foreground mt-1">{course.description}</p>
              )}
            </div>
            {course.unlocks_capability && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                <GraduationCap className="h-3 w-3" />
                Ontgrendelt: {course.unlocks_capability}
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Voortgang</span>
              <span className="font-medium">
                {completedCount} van {totalCount} lessen afgerond ({progressPercentage}%)
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Continue Button */}
        {nextLesson && !courseCompletion && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Volgende les</p>
                  <p className="font-semibold">{nextLesson.lesson?.title}</p>
                </div>
                <Button asChild>
                  <Link to={`/learn/${nextLesson.lesson_id}?courseId=${courseId}`}>
                    Doorgaan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Message */}
        {courseCompletion && (
          <Card className="mb-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    🎉 Cursus afgerond!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Je hebt alle lessen succesvol afgerond.
                    {courseCompletion.final_score && ` Eindscore: ${courseCompletion.final_score}%`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lessons List */}
        <Card>
          <CardHeader>
            <CardTitle>Lesoverzicht</CardTitle>
            <CardDescription>
              Voltooi de lessen in volgorde om de cursus af te ronden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {courseLessons?.map((cl, index) => {
                const status = getLessonStatus(index, cl.lesson_id);
                const isCompleted = status === 'completed';
                const isCurrent = status === 'current';
                const isLocked = status === 'locked';

                return (
                  <div
                    key={cl.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                      isCompleted && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
                      isCurrent && 'bg-primary/5 border-primary/30 hover:border-primary/50',
                      isLocked && 'bg-muted/50 opacity-60'
                    )}
                  >
                    {/* Status Icon */}
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                        isCompleted && 'bg-green-500 text-white',
                        isCurrent && 'bg-primary text-primary-foreground',
                        isLocked && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : isLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium truncate',
                        isLocked && 'text-muted-foreground'
                      )}>
                        {cl.lesson?.title}
                      </p>
                      {cl.lesson?.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {cl.lesson.description}
                        </p>
                      )}
                      {cl.lesson?.estimated_duration && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>~{cl.lesson.estimated_duration} min</span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      {isCompleted && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/learn/${cl.lesson_id}?courseId=${courseId}`}>
                            Bekijk opnieuw
                          </Link>
                        </Button>
                      )}
                      {isCurrent && (
                        <Button size="sm" asChild>
                          <Link to={`/learn/${cl.lesson_id}?courseId=${courseId}`}>
                            Start
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {isLocked && (
                        <span className="text-sm text-muted-foreground">
                          Vergrendeld
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
