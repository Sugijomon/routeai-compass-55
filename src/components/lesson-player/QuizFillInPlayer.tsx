import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { QuizFillBlock } from '@/types/lesson-blocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizFillInPlayerProps {
  block: QuizFillBlock;
  attempts: number;
  onAttempt: () => void;
  onCanProceed: (canProceed: boolean) => void;
  onQuizResult?: (blockId: string, correct: boolean, points: number) => void;
  alreadyCompleted?: boolean;
  previousResult?: { correct: boolean; points: number };
}

type QuizState = 'answering' | 'correct' | 'incorrect' | 'failed';

export function QuizFillInPlayer({ 
  block, 
  attempts, 
  onAttempt, 
  onCanProceed,
  onQuizResult,
  alreadyCompleted,
  previousResult,
}: QuizFillInPlayerProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [quizState, setQuizState] = useState<QuizState>('answering');
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);

  const remainingAttempts = block.max_attempts - attempts;

  // Restore state if already completed
  useEffect(() => {
    if (alreadyCompleted && previousResult) {
      setUserAnswer(previousResult.correct ? block.correct_answer : '');
      setQuizState(previousResult.correct ? 'correct' : 'failed');
      setHasAnsweredCorrectly(previousResult.correct);
      onCanProceed(true);
    }
  }, [alreadyCompleted, previousResult, block.correct_answer, onCanProceed]);

  useEffect(() => {
    if (hasAnsweredCorrectly) {
      onCanProceed(true);
    }
  }, [hasAnsweredCorrectly, onCanProceed]);

  const checkAnswer = (answer: string): boolean => {
    const normalizeString = (str: string) => {
      let normalized = str.trim();
      if (!block.case_sensitive) {
        normalized = normalized.toLowerCase();
      }
      return normalized;
    };

    const normalizedAnswer = normalizeString(answer);
    const normalizedCorrect = normalizeString(block.correct_answer);

    // Check main correct answer
    if (normalizedAnswer === normalizedCorrect) {
      return true;
    }

    // Check accepted variations
    if (block.accept_variations && block.accept_variations.length > 0) {
      return block.accept_variations.some(
        variation => normalizeString(variation) === normalizedAnswer
      );
    }

    return false;
  };

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;

    onAttempt();

    if (checkAnswer(userAnswer)) {
      setQuizState('correct');
      setHasAnsweredCorrectly(true);
      onCanProceed(true);
      onQuizResult?.(block.id, true, block.points);
    } else {
      if (remainingAttempts <= 1) {
        setQuizState('failed');
        onCanProceed(true);
        onQuizResult?.(block.id, false, 0);
      } else {
        setQuizState('incorrect');
      }
    }
  };

  const handleRetry = () => {
    setUserAnswer('');
    setQuizState('answering');
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium text-foreground prose prose-slate max-w-none">
        <ReactMarkdown>{block.question}</ReactMarkdown>
      </div>

      <div className="text-sm text-muted-foreground">
        {block.points} punten • {remainingAttempts} {remainingAttempts === 1 ? 'poging' : 'pogingen'} over
        {!block.case_sensitive && <span className="ml-2">(hoofdletters niet verplicht)</span>}
      </div>

      <div className="space-y-4">
        <Input
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder={block.placeholder || "Vul je antwoord in..."}
          disabled={quizState !== 'answering'}
          className={cn(
            "text-lg py-6",
            quizState === 'correct' && "border-green-500 bg-green-50 dark:bg-green-950/30",
            quizState === 'failed' && "border-red-500 bg-red-50 dark:bg-red-950/30"
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && quizState === 'answering') {
              handleSubmit();
            }
          }}
        />
      </div>

      {quizState === 'answering' && (
        <Button 
          onClick={handleSubmit} 
          disabled={!userAnswer.trim()}
          className="w-full"
        >
          Controleer antwoord
        </Button>
      )}

      {quizState === 'correct' && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium text-lg">✅ CORRECT!</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-300">{block.explanation}</p>
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            +{block.points} punten
          </p>
        </div>
      )}

      {quizState === 'incorrect' && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium text-lg">❌ INCORRECT</span>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-300">
            Je hebt nog {remainingAttempts} {remainingAttempts === 1 ? 'poging' : 'pogingen'} over.
          </p>
          <Button onClick={handleRetry} variant="outline" className="w-full">
            Opnieuw proberen
          </Button>
        </div>
      )}

      {quizState === 'failed' && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <XCircle className="h-5 w-5" />
            <span className="font-medium text-lg">❌ INCORRECT</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-300">
            Geen pogingen meer. Het juiste antwoord was: <strong>{block.correct_answer}</strong>
          </p>
          <p className="text-sm text-muted-foreground mt-2">{block.explanation}</p>
        </div>
      )}
    </div>
  );
}
