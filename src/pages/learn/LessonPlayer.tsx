import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LessonBlock } from '@/types/lesson-blocks';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useLessonAttempts } from '@/hooks/useLessonAttempts';
import { CourseSidebar } from '@/components/lesson-player/CourseSidebar';
import { LessonContentTopBar } from '@/components/lesson-player/LessonContentTopBar';
import { ParagraphBlockPlayer } from '@/components/lesson-player/ParagraphBlockPlayer';
import { VideoBlockPlayer } from '@/components/lesson-player/VideoBlockPlayer';
import { QuizBlockPlayer } from '@/components/lesson-player/QuizBlockPlayer';
import { QuizTrueFalsePlayer } from '@/components/lesson-player/QuizTrueFalsePlayer';
import { QuizMultipleSelectPlayer } from '@/components/lesson-player/QuizMultipleSelectPlayer';
import { QuizFillInPlayer } from '@/components/lesson-player/QuizFillInPlayer';
import { QuizEssayPlayer } from '@/components/lesson-player/QuizEssayPlayer';
import { HeroBlockPlayer } from '@/components/lesson-player/HeroBlockPlayer';
import { CalloutBlockPlayer } from '@/components/lesson-player/CalloutBlockPlayer';
import { KeyTakeawaysBlockPlayer } from '@/components/lesson-player/KeyTakeawaysBlockPlayer';
import { SectionHeaderBlockPlayer } from '@/components/lesson-player/SectionHeaderBlockPlayer';
import { LessonCompletionModal } from '@/components/lesson-player/LessonCompletionModal';
import { CourseCompletionModal } from '@/components/lesson-player/CourseCompletionModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LessonPlayer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [_canProceedFromBlock, setCanProceedFromBlock] = useState(true);

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
    passingScore: number;
    attemptNumber: number;
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
    staleTime: 0,
    refetchOnMount: 'always',
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
    goNext: _goNext,
    goPrevious: _goPrevious,
    canGoPrevious: _canGoPrevious,
    isLastBlock: _isLastBlock,
    markBlockCompleted,
    incrementQuizAttempt,
    recordQuizResult,
    calculateFinalScore,
    blocksCompleted,
  } = useLessonProgress({
    lessonId: lessonId || '',
    blocks,
  });

  // Attempt tracking
  const {
    currentAttemptNumber,
    completeCurrentAttempt,
    startNewAttempt,
    isLoading: attemptsLoading,
  } = useLessonAttempts({
    lessonId: lessonId || '',
    userId,
  });

  const currentBlock = blocks[currentBlockIndex];

  // Handle block proceed state
  const handleCanProceed = useCallback((canProceed: boolean) => {
    setCanProceedFromBlock(canProceed);
  }, []);

  // Check if current block is already completed
  const _isBlockCompleted = currentBlock ? blocksCompleted.includes(currentBlock.id) : false;

  // Handle lesson completion
  const handleComplete = async () => {
    if (!lessonId || !userId) return;
    try {
      if (currentBlock) {
        markBlockCompleted(currentBlock.id);
      }
      const { earnedPoints, maxPoints, percentage } = calculateFinalScore();
      let timeSpent = 0;
      if (startedAt) {
        const startTime = new Date(startedAt).getTime();
        timeSpent = Math.round((Date.now() - startTime) / 1000);
      }
      const lessonPassingScore = lesson?.passing_score ?? 0;
      const passed = maxPoints === 0 || percentage >= lessonPassingScore;

      await completeCurrentAttempt({
        score: earnedPoints,
        maxScore: maxPoints,
        percentage,
        passed,
        timeSpent,
      });

      const { error } = await supabase
        .from('user_lesson_completions')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          score: percentage,
          time_spent: timeSpent,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });
      if (error) throw error;

      const courseResult = await updateCourseProgress();

      if (courseResult?.courseComplete) {
        setCourseCompletionData(courseResult);
        setShowCourseCompletionModal(true);
      } else {
        setCompletionData({
          score: percentage,
          earnedPoints,
          maxPoints,
          timeSpent,
          hasQuizzes: maxPoints > 0,
          passingScore: lessonPassingScore,
          attemptNumber: currentAttemptNumber,
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
      const courseQuery = courseId
        ? supabase.from('course_lessons').select('course_id, courses!inner(id, title, unlocks_capability)').eq('lesson_id', lessonId).eq('course_id', courseId).maybeSingle()
        : supabase.from('course_lessons').select('course_id, courses!inner(id, title, unlocks_capability)').eq('lesson_id', lessonId).maybeSingle();
      const { data: courseLesson } = await courseQuery;
      if (!courseLesson?.course_id) return null;

      const courseData = courseLesson.courses as unknown as { id: string; title: string; unlocks_capability: string | null };
      const { count: totalLessons } = await supabase.from('course_lessons').select('id', { count: 'exact', head: true }).eq('course_id', courseLesson.course_id);
      const { data: courseLessonIds } = await supabase.from('course_lessons').select('lesson_id').eq('course_id', courseLesson.course_id);
      const lessonIds = courseLessonIds?.map(cl => cl.lesson_id).filter(Boolean) ?? [];
      const { data: completedLessons } = await supabase.from('user_lesson_completions').select('lesson_id, score').eq('user_id', userId).in('lesson_id', lessonIds);

      const lessonsCompleted = completedLessons?.length ?? 0;
      const lessonsRequired = totalLessons ?? 1;
      const pPct = Math.round((lessonsCompleted / lessonsRequired) * 100);
      const averageScore = completedLessons && completedLessons.length > 0
        ? Math.round(completedLessons.reduce((sum, l) => sum + (l.score ?? 0), 0) / completedLessons.length)
        : 0;

      const { data: existingProgress } = await supabase.from('user_course_progress').select('*').eq('user_id', userId).eq('course_id', courseLesson.course_id).maybeSingle();
      if (existingProgress) {
        await supabase.from('user_course_progress').update({ lessons_completed: lessonsCompleted, progress_percentage: pPct, updated_at: new Date().toISOString() }).eq('id', existingProgress.id);
      } else {
        await supabase.from('user_course_progress').insert({ user_id: userId, course_id: courseLesson.course_id, lessons_completed: lessonsCompleted, lessons_required: lessonsRequired, progress_percentage: pPct });
      }

      if (pPct >= 100) {
        await supabase.from('user_course_completions').upsert({ user_id: userId, course_id: courseLesson.course_id, final_score: averageScore, capability_unlocked: courseData.unlocks_capability, completed_at: new Date().toISOString() }, { onConflict: 'user_id,course_id' });
        if (courseData.unlocks_capability === 'ai_rijbewijs') {
          await supabase.from('profiles').update({ has_ai_rijbewijs: true, ai_rijbewijs_obtained_at: new Date().toISOString() }).eq('id', userId);
        }
        return { courseComplete: true, courseTitle: courseData.title, finalScore: averageScore, lessonsCompleted, totalLessons: lessonsRequired, unlockedCapability: courseData.unlocks_capability };
      }
      return null;
    } catch (error) {
      console.error('Error updating course progress:', error);
      return null;
    }
  };

  const handleContinue = () => {
    setShowCompletionModal(false);
    navigate(courseId ? `/learn/course/${courseId}` : '/learn');
  };

  const handleRetry = async () => {
    if (!lessonId || !userId) return;
    setShowCompletionModal(false);
    setCompletionData(null);
    try {
      await supabase.from('user_lesson_progress').delete().eq('user_id', userId).eq('lesson_id', lessonId);
      await supabase.from('user_lesson_completions').delete().eq('user_id', userId).eq('lesson_id', lessonId);
      await startNewAttempt();
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', lessonId] });
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate(`/learn/${lessonId}?retry=true${courseId ? `&courseId=${courseId}` : ''}`, { replace: true });
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error('Error resetting lesson progress:', error);
      toast.error('Kon les niet resetten');
    }
  };

  const handleCourseComplete = () => {
    setShowCourseCompletionModal(false);
    navigate('/dashboard');
  };

  // Loading states
  if (lessonLoading || progressLoading || attemptsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Laden...</span>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Les niet gevonden</h2>
            <p className="text-muted-foreground mb-4">Deze les bestaat niet of is niet gepubliceerd.</p>
            <button onClick={() => navigate('/learn')} className="text-primary hover:underline">Terug naar overzicht</button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Lege les</h2>
            <p className="text-muted-foreground mb-4">Deze les heeft nog geen inhoud.</p>
            <button onClick={() => navigate('/learn')} className="text-primary hover:underline">Terug naar overzicht</button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render a single block
  const renderBlock = (block: LessonBlock) => {
    const existingResult = quizResults[block.id];
    const blockCompleted = blocksCompleted.includes(block.id);
    const commonQuizProps = {
      key: block.id,
      attempts: quizAttempts[block.id] ?? 0,
      onAttempt: () => incrementQuizAttempt(block.id),
      onCanProceed: handleCanProceed,
      onQuizResult: recordQuizResult,
      alreadyCompleted: blockCompleted,
      previousResult: existingResult,
    };

    switch (block.type) {
      case 'paragraph':
        return <ParagraphBlockPlayer key={block.id} block={block} />;
      case 'video':
        return <VideoBlockPlayer key={block.id} block={block} onCanProceed={handleCanProceed} />;
      case 'quiz_mc':
        return <QuizBlockPlayer block={block} {...commonQuizProps} />;
      case 'quiz_ms':
        return <QuizMultipleSelectPlayer block={block} {...commonQuizProps} />;
      case 'quiz_tf':
        return <QuizTrueFalsePlayer block={block} {...commonQuizProps} />;
      case 'quiz_fill':
        return <QuizFillInPlayer block={block} {...commonQuizProps} />;
      case 'quiz_essay':
        return <QuizEssayPlayer block={block} {...commonQuizProps} />;
      case 'hero':
        return <HeroBlockPlayer key={block.id} block={block} />;
      case 'callout':
        return <CalloutBlockPlayer key={block.id} block={block} />;
      case 'key_takeaways':
        return <KeyTakeawaysBlockPlayer key={block.id} block={block} />;
      case 'section_header':
        return <SectionHeaderBlockPlayer key={block.id} block={block} />;
      default: {
        const unknownBlock = block as { type: string };
        return (
          <div key={(block as { id: string }).id} className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-amber-800 dark:text-amber-200 font-medium">Onbekend bloktype: {unknownBlock.type}</p>
          </div>
        );
      }
    }
  };

  // Check if all blocks are done (for complete button)
  // All blocks vertical scroll - complete button at bottom

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Left: Course Sidebar */}
      <CourseSidebar
        courseId={courseId}
        currentLessonId={lessonId || ''}
        userId={userId}
        currentBlockIndex={currentBlockIndex}
      />

      {/* Right: Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <LessonContentTopBar
          lessonTitle={lesson.title}
          estimatedDuration={lesson.estimated_duration}
          progressPercentage={progressPercentage}
          currentBlock={currentBlockIndex}
          totalBlocks={blocks.length}
        />

        {/* Scrollable content — all blocks rendered vertically */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
            {blocks.map((block) => (
              <div key={block.id} className="scroll-mt-20">
                {renderBlock(block)}
              </div>
            ))}

            {/* Complete button at bottom */}
            <div className="pt-4 pb-12 flex justify-center">
              <Button
                size="lg"
                onClick={handleComplete}
                className="gap-2 px-8"
              >
                <CheckCircle className="h-5 w-5" />
                Les afronden
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Completion Modal */}
      {completionData && (
        <LessonCompletionModal
          open={showCompletionModal}
          score={completionData.score}
          earnedPoints={completionData.earnedPoints}
          maxPoints={completionData.maxPoints}
          timeSpent={completionData.timeSpent}
          hasQuizzes={completionData.hasQuizzes}
          passingScore={completionData.passingScore}
          attemptNumber={completionData.attemptNumber}
          onContinue={handleContinue}
          onRetry={handleRetry}
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
