import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { LessonBlock, parseLessonContent, flattenTopicBlocks } from '@/types/lesson-blocks';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useLessonAttempts } from '@/hooks/useLessonAttempts';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function ExamenPage() {
  const { user, signOut } = useAuth();
  const { hasAiRijbewijs, refetch: refetchProfile } = useUserProfile();
  const { isSuperAdmin, isOrgAdmin, isContentEditor } = useUserRole();
  const navigate = useNavigate();
  const userId = user?.id ?? null;
  const [_canProceedFromBlock, setCanProceedFromBlock] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    score: number;
    earnedPoints: number;
    maxPoints: number;
    timeSpent: number;
    hasQuizzes: boolean;
    passingScore: number;
    attemptNumber: number;
  } | null>(null);

  // Admin/editor roles bypass the exam - redirect to dashboard if they land here
  useEffect(() => {
    if (isSuperAdmin || isOrgAdmin || isContentEditor) {
      navigate('/dashboard', { replace: true });
    }
  }, [isSuperAdmin, isOrgAdmin, isContentEditor, navigate]);

  // If user already has rijbewijs, redirect to dashboard
  useEffect(() => {
    if (hasAiRijbewijs) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasAiRijbewijs, navigate]);

  // Fetch the ai_literacy_exam lesson
  const { data: lesson, isLoading: lessonLoading, error } = useQuery({
    queryKey: ['ai-literacy-exam'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('lesson_type', 'ai_literacy_exam')
        .eq('is_published', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const lessonId = lesson?.id ?? '';
  const topics = lesson ? parseLessonContent(lesson.blocks) : [];
  const blocks: LessonBlock[] = flattenTopicBlocks(topics);

  const {
    currentBlockIndex,
    progressPercentage,
    quizAttempts,
    quizResults,
    startedAt,
    isLoading: progressLoading,
    markBlockCompleted,
    incrementQuizAttempt,
    recordQuizResult,
    calculateFinalScore,
    blocksCompleted,
  } = useLessonProgress({ lessonId, topics });

  const {
    currentAttemptNumber,
    completeCurrentAttempt,
    startNewAttempt,
    isLoading: attemptsLoading,
  } = useLessonAttempts({ lessonId, userId });

  const handleCanProceed = (canProceed: boolean) => setCanProceedFromBlock(canProceed);

  const handleComplete = async () => {
    if (!lessonId || !userId) return;
    try {
      const currentBlock = blocks[blocks.length - 1];
      if (currentBlock) markBlockCompleted(currentBlock.id);

      const { earnedPoints, maxPoints, percentage } = calculateFinalScore();
      let timeSpent = 0;
      if (startedAt) {
        timeSpent = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
      }
      const passingScore = lesson?.passing_score ?? 80;
      const passed = maxPoints === 0 || percentage >= passingScore;

      await completeCurrentAttempt({
        score: earnedPoints,
        maxScore: maxPoints,
        percentage,
        passed,
        timeSpent,
      });

      // Also write to user_lesson_completions
      await supabase.from('user_lesson_completions').upsert({
        user_id: userId,
        lesson_id: lessonId,
        score: percentage,
        time_spent: timeSpent,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' });

      if (passed) {
        // The trigger will handle granting the rijbewijs — just refetch the profile
        await refetchProfile();
        toast.success('Gefeliciteerd! Je hebt het AI Literacy examen gehaald!');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      } else {
        setCompletionData({
          score: percentage,
          earnedPoints,
          maxPoints,
          timeSpent,
          hasQuizzes: maxPoints > 0,
          passingScore,
          attemptNumber: currentAttemptNumber,
        });
        setShowCompletionModal(true);
      }
    } catch (err) {
      console.error('Error completing exam:', err);
      toast.error('Er ging iets mis bij het afronden van het examen.');
    }
  };

  const handleRetry = () => {
    // Pure local state reset — no Supabase calls
    setShowCompletionModal(false);
    setCompletionData(null);
    // Force full page reload to reset all local component state
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

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
      case 'paragraph': return <ParagraphBlockPlayer key={block.id} block={block} />;
      case 'video': return <VideoBlockPlayer key={block.id} block={block} onCanProceed={handleCanProceed} />;
      case 'quiz_mc': return <QuizBlockPlayer block={block} {...commonQuizProps} />;
      case 'quiz_ms': return <QuizMultipleSelectPlayer block={block} {...commonQuizProps} />;
      case 'quiz_tf': return <QuizTrueFalsePlayer block={block} {...commonQuizProps} />;
      case 'quiz_fill': return <QuizFillInPlayer block={block} {...commonQuizProps} />;
      case 'quiz_essay': return <QuizEssayPlayer block={block} {...commonQuizProps} />;
      case 'hero': return <HeroBlockPlayer key={block.id} block={block} />;
      case 'callout': return <CalloutBlockPlayer key={block.id} block={block} />;
      case 'key_takeaways': return <KeyTakeawaysBlockPlayer key={block.id} block={block} />;
      case 'section_header': return <SectionHeaderBlockPlayer key={block.id} block={block} />;
      default: return null;
    }
  };

  // Loading
  if (lessonLoading || progressLoading || attemptsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No exam lesson found
  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Examen niet beschikbaar</h2>
            <p className="text-muted-foreground">
              Er is nog geen AI Literacy examen gepubliceerd. Neem contact op met je AI Verantwoordelijke.
            </p>
            <Button variant="outline" onClick={handleSignOut} className="gap-2 mt-4">
              <LogOut className="h-4 w-4" /> Uitloggen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Minimal header — no sidebar, no navigation */}
      <header className="shrink-0 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">RouteAI — AI Literacy Examen</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" /> Uitloggen
          </Button>
        </div>
      </header>

      {/* Top bar with progress */}
      <LessonContentTopBar
        lessonTitle={lesson.title}
        estimatedDuration={lesson.estimated_duration}
        progressPercentage={progressPercentage}
        currentBlock={currentBlockIndex}
        totalBlocks={blocks.length}
      />

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          {/* Intro banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                Welkom bij het AI Literacy Examen
              </h2>
              <p className="text-muted-foreground">
                Leg hier het AI Literacy examen af. Wie slaagt krijgt toegang tot RouteAI en ontvangt het AI-Rijbewijs.
                Je hebt minimaal {lesson.passing_score ?? 80}% nodig om te slagen.
              </p>
            </CardContent>
          </Card>

          {/* Lesson blocks */}
          {blocks.map((block) => (
            <div key={block.id} className="scroll-mt-20">
              {renderBlock(block)}
            </div>
          ))}

          {/* Complete button */}
          <div className="pt-4 pb-12 flex justify-center">
            <Button size="lg" onClick={handleComplete} className="gap-2 px-8">
              <CheckCircle className="h-5 w-5" />
              Examen afronden
            </Button>
          </div>
        </div>
      </main>

      {/* Failed modal — offers retry */}
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
          onContinue={() => setShowCompletionModal(false)}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
