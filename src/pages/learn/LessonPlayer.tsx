import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LessonBlock } from '@/types/lesson-blocks';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { LessonPlayerHeader } from '@/components/lesson-player/LessonPlayerHeader';
import { LessonPlayerFooter } from '@/components/lesson-player/LessonPlayerFooter';
import { ParagraphBlockPlayer } from '@/components/lesson-player/ParagraphBlockPlayer';
import { VideoBlockPlayer } from '@/components/lesson-player/VideoBlockPlayer';
import { QuizBlockPlayer } from '@/components/lesson-player/QuizBlockPlayer';
import { LessonCompletionModal } from '@/components/lesson-player/LessonCompletionModal';
import { CourseCompletionModal } from '@/components/lesson-player/CourseCompletionModal';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LessonPlayer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [canProceedFromBlock, setCanProceedFromBlock] = useState(true);

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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCourseCompletionModal, setShowCourseCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    score: number;
    earnedPoints: number;
    maxPoints: number;
    timeSpent: number;
    hasQuizzes: boolean;
  } | null>(null);
  const [courseCompletionData, setCourseCompletionData] = useState<{
    courseTitle: string;
    finalScore: number;
    lessonsCompleted: number;
    totalLessons: number;
    unlockedCapability: string | null;
  } | null>(null);

  // Force clear cache and refetch on mount
  useEffect(() => {
    if (lessonId) {
      // Invalidate and refetch lesson data
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', lessonId] });
    }
  }, [lessonId, queryClient]);

  // Fetch lesson data
  const { data: lesson, isLoading: lessonLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      if (!lessonId) throw new Error('No lesson ID');
      
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
    staleTime: 0, // Always consider data stale
    refetchOnMount: 'always', // Always refetch when component mounts
  });

  const blocks: LessonBlock[] = Array.isArray(lesson?.blocks) 
    ? (lesson.blocks as unknown as LessonBlock[]).sort((a, b) => a.order - b.order)
    : [];

  // Progress tracking
  const {
    currentBlockIndex,
    progressPercentage,
    quizAttempts,
    quizResults,
    startedAt,
    isLoading: progressLoading,
    goNext,
    goPrevious,
    canGoPrevious,
    isLastBlock,
    markBlockCompleted,
    incrementQuizAttempt,
    recordQuizResult,
    calculateFinalScore,
    blocksCompleted,
  } = useLessonProgress({ 
    lessonId: lessonId || '', 
    blocks,
  });

  const currentBlock = blocks[currentBlockIndex];

  // Handle block proceed state
  const handleCanProceed = useCallback((canProceed: boolean) => {
    setCanProceedFromBlock(canProceed);
  }, []);

  // Check if current block is already completed (for quiz restoration)
  const isBlockCompleted = currentBlock ? blocksCompleted.includes(currentBlock.id) : false;

  // Handle lesson completion
  const handleComplete = async () => {
    if (!lessonId || !userId) return;

    try {
      // Mark last block as completed
      if (currentBlock) {
        markBlockCompleted(currentBlock.id);
      }

      // Calculate final score from quizzes
      const { earnedPoints, maxPoints, percentage } = calculateFinalScore();
      
      // Calculate time spent from started_at
      let timeSpent = 0;
      if (startedAt) {
        const startTime = new Date(startedAt).getTime();
        const now = Date.now();
        timeSpent = Math.round((now - startTime) / 1000);
      }

      // Create completion record with quiz score
      const { error } = await supabase
        .from('user_lesson_completions')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          score: percentage,
          time_spent: timeSpent,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
        });

      if (error) throw error;

      // Update course progress and check if course is complete
      const courseResult = await updateCourseProgress();

      if (courseResult?.courseComplete) {
        // Show course completion modal
        setCourseCompletionData(courseResult);
        setShowCourseCompletionModal(true);
      } else {
        // Show lesson completion modal
        setCompletionData({
          score: percentage,
          earnedPoints,
          maxPoints,
          timeSpent,
          hasQuizzes: maxPoints > 0,
        });
        setShowCompletionModal(true);
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error('Kon les niet afronden');
    }
  };

  // Update course progress when lesson is completed
  const updateCourseProgress = async (): Promise<{
    courseComplete: boolean;
    courseTitle: string;
    finalScore: number;
    lessonsCompleted: number;
    totalLessons: number;
    unlockedCapability: string | null;
  } | null> => {
    if (!lessonId || !userId) return null;

    try {
      // Find if this lesson is part of the specified course (or any course)
      const courseQuery = courseId 
        ? supabase
            .from('course_lessons')
            .select('course_id, courses!inner(id, title, unlocks_capability)')
            .eq('lesson_id', lessonId)
            .eq('course_id', courseId)
            .maybeSingle()
        : supabase
            .from('course_lessons')
            .select('course_id, courses!inner(id, title, unlocks_capability)')
            .eq('lesson_id', lessonId)
            .maybeSingle();

      const { data: courseLesson } = await courseQuery;

      if (!courseLesson?.course_id) return null;

      const courseData = courseLesson.courses as unknown as { 
        id: string; 
        title: string; 
        unlocks_capability: string | null;
      };

      // Get total lessons in course
      const { count: totalLessons } = await supabase
        .from('course_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseLesson.course_id);

      // Get all lesson IDs in this course
      const { data: courseLessonIds } = await supabase
        .from('course_lessons')
        .select('lesson_id')
        .eq('course_id', courseLesson.course_id);

      const lessonIds = courseLessonIds?.map(cl => cl.lesson_id).filter(Boolean) ?? [];

      // Get completed lessons for this course (including the one we just completed)
      const { data: completedLessons } = await supabase
        .from('user_lesson_completions')
        .select('lesson_id, score')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      const lessonsCompleted = completedLessons?.length ?? 0;
      const lessonsRequired = totalLessons ?? 1;
      const progressPercentage = Math.round((lessonsCompleted / lessonsRequired) * 100);

      // Calculate average score
      const averageScore = completedLessons && completedLessons.length > 0
        ? Math.round(completedLessons.reduce((sum, l) => sum + (l.score ?? 0), 0) / completedLessons.length)
        : 0;

      // Get existing progress
      const { data: existingProgress } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseLesson.course_id)
        .maybeSingle();

      if (existingProgress) {
        await supabase
          .from('user_course_progress')
          .update({
            lessons_completed: lessonsCompleted,
            progress_percentage: progressPercentage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('user_course_progress')
          .insert({
            user_id: userId,
            course_id: courseLesson.course_id,
            lessons_completed: lessonsCompleted,
            lessons_required: lessonsRequired,
            progress_percentage: progressPercentage,
          });
      }

      // Check if course is complete
      if (progressPercentage >= 100) {
        // Record course completion
        await supabase
          .from('user_course_completions')
          .upsert({
            user_id: userId,
            course_id: courseLesson.course_id,
            final_score: averageScore,
            capability_unlocked: courseData.unlocks_capability,
            completed_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,course_id',
          });

        // If course unlocks ai_rijbewijs, update profile
        if (courseData.unlocks_capability === 'ai_rijbewijs') {
          await supabase
            .from('profiles')
            .update({
              has_ai_rijbewijs: true,
              ai_rijbewijs_obtained_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }

        return {
          courseComplete: true,
          courseTitle: courseData.title,
          finalScore: averageScore,
          lessonsCompleted,
          totalLessons: lessonsRequired,
          unlockedCapability: courseData.unlocks_capability,
        };
      }

      return null;
    } catch (error) {
      console.error('Error updating course progress:', error);
      return null;
    }
  };

  const handleContinue = () => {
    setShowCompletionModal(false);
    // Navigate back to course if in course context, otherwise to training
    navigate(courseId ? `/learn/course/${courseId}` : '/training');
  };

  const handleCourseComplete = () => {
    setShowCourseCompletionModal(false);
    navigate('/user-dashboard');
  };

  // Loading states
  if (lessonLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error or not found
  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Les niet gevonden</h2>
            <p className="text-muted-foreground mb-4">
              Deze les bestaat niet of is niet gepubliceerd.
            </p>
            <button 
              onClick={() => navigate('/training')}
              className="text-primary hover:underline"
            >
              Terug naar overzicht
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty lesson
  if (blocks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Lege les</h2>
            <p className="text-muted-foreground mb-4">
              Deze les heeft nog geen inhoud.
            </p>
            <button 
              onClick={() => navigate('/training')}
              className="text-primary hover:underline"
            >
              Terug naar overzicht
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render current block
  const renderBlock = () => {
    if (!currentBlock) return null;

    switch (currentBlock.type) {
      case 'paragraph':
        return <ParagraphBlockPlayer block={currentBlock} />;
      case 'video':
        return (
          <VideoBlockPlayer 
            block={currentBlock} 
            onCanProceed={handleCanProceed} 
          />
        );
      case 'quiz_mc':
        // If quiz is already completed, show it as answered
        const existingResult = quizResults[currentBlock.id];
        return (
          <QuizBlockPlayer
            key={currentBlock.id}
            block={currentBlock}
            attempts={quizAttempts[currentBlock.id] ?? 0}
            onAttempt={() => incrementQuizAttempt(currentBlock.id)}
            onCanProceed={handleCanProceed}
            onQuizResult={recordQuizResult}
            alreadyCompleted={isBlockCompleted}
            previousResult={existingResult}
          />
        );
      default:
        return (
          <div className="text-muted-foreground">
            Onbekend bloktype
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LessonPlayerHeader
        title={lesson.title}
        currentBlock={currentBlockIndex}
        totalBlocks={blocks.length}
        progressPercentage={progressPercentage}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              {renderBlock()}
            </CardContent>
          </Card>
        </div>
      </main>

      <LessonPlayerFooter
        currentBlock={currentBlockIndex}
        totalBlocks={blocks.length}
        canGoNext={currentBlockIndex < blocks.length - 1}
        canGoPrevious={canGoPrevious}
        isLastBlock={isLastBlock}
        onNext={goNext}
        onPrevious={goPrevious}
        onComplete={handleComplete}
        nextEnabled={canProceedFromBlock || isBlockCompleted}
      />

      {/* Completion Modal */}
      {completionData && (
        <LessonCompletionModal
          open={showCompletionModal}
          score={completionData.score}
          earnedPoints={completionData.earnedPoints}
          maxPoints={completionData.maxPoints}
          timeSpent={completionData.timeSpent}
          hasQuizzes={completionData.hasQuizzes}
          onContinue={handleContinue}
        />
      )}

      {/* Course Completion Modal */}
      {courseCompletionData && (
        <CourseCompletionModal
          open={showCourseCompletionModal}
          courseTitle={courseCompletionData.courseTitle}
          finalScore={courseCompletionData.finalScore}
          lessonsCompleted={courseCompletionData.lessonsCompleted}
          totalLessons={courseCompletionData.totalLessons}
          unlockedCapability={courseCompletionData.unlockedCapability}
          onContinue={handleCourseComplete}
        />
      )}
    </div>
  );
}
