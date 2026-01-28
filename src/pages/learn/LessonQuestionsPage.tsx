import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLessonQuestions, useUserAnswers, useSubmitAnswer } from '@/hooks/useQuestions';
import QuestionRenderer from '@/components/learning/QuestionRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuestionAnswer, LearningQuestion } from '@/types/learning';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronLeft, ChevronRight, Trophy, RotateCcw } from 'lucide-react';

export default function LessonQuestionsPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<QuestionAnswer | undefined>();
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);

  // Get authenticated user
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

  const { data: questions, isLoading: questionsLoading } = useLessonQuestions(lessonId);
  const { data: userAnswers, isLoading: answersLoading } = useUserAnswers(lessonId, userId);
  const submitAnswer = useSubmitAnswer();

  const isLoading = questionsLoading || answersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Vragen laden...</span>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Geen vragen gevonden</h2>
            <p className="text-muted-foreground mb-4">
              Deze les heeft nog geen vragen.
            </p>
            <Button onClick={() => navigate(-1)}>
              Terug
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const hasNextQuestion = currentQuestionIndex < questions.length - 1;
  const hasPreviousQuestion = currentQuestionIndex > 0;

  // Check if question was already answered
  const existingAnswer = userAnswers?.find(a => a.question_id === currentQuestion.id);
  const isQuestionSubmitted = submittedQuestions.has(currentQuestion.id) || !!existingAnswer;

  // Calculate progress and score
  const answeredCount = new Set([
    ...submittedQuestions,
    ...(userAnswers?.map(a => a.question_id) || [])
  ]).size;
  const progressPercentage = (answeredCount / questions.length) * 100;
  
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const earnedPoints = userAnswers?.reduce((sum, a) => sum + (a.points_earned || 0), 0) || 0;

  const handleSubmit = async () => {
    if (!currentAnswer || !lessonId) return;

    await submitAnswer.mutateAsync({
      questionId: currentQuestion.id,
      lessonId: lessonId,
      answer: currentAnswer,
      question: currentQuestion,
    });

    setSubmittedQuestions(prev => new Set([...prev, currentQuestion.id]));

    // Auto-advance after short delay if not last question
    if (hasNextQuestion) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer(undefined);
      }, 1500);
    } else {
      // Show results after last question
      setTimeout(() => setShowResults(true), 1500);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setCurrentAnswer(undefined);
    setSubmittedQuestions(new Set());
    setShowResults(false);
  };

  if (showResults) {
    const correctCount = userAnswers?.filter(a => a.is_correct).length || 0;
    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <CardTitle className="text-2xl">Resultaten</CardTitle>
              <CardDescription>
                Je hebt alle vragen beantwoord!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold text-primary">{scorePercentage}%</p>
                  <p className="text-sm text-muted-foreground">Score</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{earnedPoints}/{totalPoints}</p>
                  <p className="text-sm text-muted-foreground">Punten</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-center">
                  <span className="text-lg font-semibold text-green-600">{correctCount}</span>
                  <span className="text-muted-foreground"> van de </span>
                  <span className="text-lg font-semibold">{questions.length}</span>
                  <span className="text-muted-foreground"> vragen correct</span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRestart}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Opnieuw proberen
                </Button>
                <Button 
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Terug naar les
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Vraag {currentQuestionIndex + 1} van {questions.length}
            </p>
            <p className="text-sm font-medium">
              {earnedPoints}/{totalPoints} punten
            </p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Question */}
        <QuestionRenderer
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          userAnswer={currentAnswer || (existingAnswer?.user_answer as QuestionAnswer)}
          onAnswer={setCurrentAnswer}
          disabled={isQuestionSubmitted}
          showFeedback={isQuestionSubmitted}
          isCorrect={existingAnswer?.is_correct}
        />

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentQuestionIndex(prev => prev - 1);
              setCurrentAnswer(undefined);
            }}
            disabled={!hasPreviousQuestion}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Vorige
          </Button>

          <div className="flex gap-3">
            {!isQuestionSubmitted && (
              <Button
                onClick={handleSubmit}
                disabled={!currentAnswer || submitAnswer.isPending}
              >
                {submitAnswer.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  'Controleer'
                )}
              </Button>
            )}
            
            {hasNextQuestion && (
              <Button
                variant={isQuestionSubmitted ? "default" : "outline"}
                onClick={() => {
                  setCurrentQuestionIndex(prev => prev + 1);
                  setCurrentAnswer(undefined);
                }}
              >
                Volgende
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {!hasNextQuestion && isQuestionSubmitted && (
              <Button onClick={() => setShowResults(true)}>
                Bekijk resultaten
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
