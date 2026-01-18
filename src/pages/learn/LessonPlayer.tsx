import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LessonBlock } from '@/types/lesson-blocks';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { LessonPlayerHeader } from '@/components/lesson-player/LessonPlayerHeader';
import { LessonPlayerFooter } from '@/components/lesson-player/LessonPlayerFooter';
import { ParagraphBlockPlayer } from '@/components/lesson-player/ParagraphBlockPlayer';
import { VideoBlockPlayer } from '@/components/lesson-player/VideoBlockPlayer';
import { QuizBlockPlayer } from '@/components/lesson-player/QuizBlockPlayer';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/useAppStore';

export default function LessonPlayer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const getCurrentUser = useAppStore(state => state.getCurrentUser);
  const currentUser = getCurrentUser();
  const [canProceedFromBlock, setCanProceedFromBlock] = useState(true);

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
    isLoading: progressLoading,
    goNext,
    goPrevious,
    canGoPrevious,
    isLastBlock,
    markBlockCompleted,
    incrementQuizAttempt,
    recordQuizResult,
    calculateFinalScore,
  } = useLessonProgress({ 
    lessonId: lessonId || '', 
    blocks,
  });

  const currentBlock = blocks[currentBlockIndex];

  // Handle block proceed state
  const handleCanProceed = useCallback((canProceed: boolean) => {
    setCanProceedFromBlock(canProceed);
  }, []);

  // Reset canProceed when block changes
  const handleBlockChange = useCallback(() => {
    // Default: paragraphs can proceed immediately
    if (currentBlock?.type === 'paragraph') {
      setCanProceedFromBlock(true);
    } else {
      setCanProceedFromBlock(false);
    }
  }, [currentBlock]);

  // Handle lesson completion
  const handleComplete = async () => {
    if (!lessonId || !currentUser?.id) return;

    try {
      // Mark last block as completed
      if (currentBlock) {
        markBlockCompleted(currentBlock.id);
      }

      // Calculate final score from quizzes
      const { earnedPoints, maxPoints, percentage } = calculateFinalScore();
      
      // Determine time spent (approximate based on when started)
      const timeSpent = 0; // We can calculate this from started_at if needed

      // Create completion record with quiz score
      const { error } = await supabase
        .from('user_lesson_completions')
        .upsert({
          user_id: currentUser.id,
          lesson_id: lessonId,
          score: percentage,
          time_spent: timeSpent,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
        });

      if (error) throw error;

      // Show success with score if there were quizzes
      if (maxPoints > 0) {
        toast.success(`Les afgerond! 🎉 Score: ${earnedPoints}/${maxPoints} punten (${percentage}%)`);
      } else {
        toast.success('Les afgerond! 🎉');
      }
      
      navigate('/training');
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error('Kon les niet afronden');
    }
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
        return (
          <QuizBlockPlayer
            block={currentBlock}
            attempts={quizAttempts[currentBlock.id] ?? 0}
            onAttempt={() => incrementQuizAttempt(currentBlock.id)}
            onCanProceed={handleCanProceed}
            onQuizResult={recordQuizResult}
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
        nextEnabled={canProceedFromBlock}
      />
    </div>
  );
}
