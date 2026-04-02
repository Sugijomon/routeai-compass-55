import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { QuizTFBlock } from '@/types/lesson-blocks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizTrueFalsePlayerProps {
  block: QuizTFBlock;
  attempts: number;
  onAttempt: () => void;
  onCanProceed: (canProceed: boolean) => void;
  onQuizResult?: (blockId: string, correct: boolean, points: number) => void;
  onQuizAnswer?: (blockId: string, answer: unknown) => void;
  alreadyCompleted?: boolean;
  previousResult?: { correct: boolean; points: number };
}

type QuizState = 'answering' | 'correct' | 'incorrect' | 'failed';

export function QuizTrueFalsePlayer({ 
  block, 
  attempts, 
  onAttempt, 
  onCanProceed,
  onQuizResult,
  onQuizAnswer,
  alreadyCompleted,
  previousResult,
}: QuizTrueFalsePlayerProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [quizState, setQuizState] = useState<QuizState>('answering');
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);

  const remainingAttempts = block.max_attempts - attempts;

  // Restore state if already completed
  useEffect(() => {
    if (alreadyCompleted && previousResult) {
      setSelectedAnswer(previousResult.correct ? block.correct_answer : null);
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

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    onAttempt();

    if (selectedAnswer === block.correct_answer) {
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
    setSelectedAnswer(null);
    setQuizState('answering');
  };

  const options = [
    { value: true, label: 'Waar' },
    { value: false, label: 'Niet waar' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium text-foreground prose prose-slate max-w-none">
        <ReactMarkdown>{block.question}</ReactMarkdown>
      </div>

      <div className="text-sm text-muted-foreground">
        {block.points} punten • {remainingAttempts} {remainingAttempts === 1 ? 'poging' : 'pogingen'} over
      </div>

      <div className="flex gap-4">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.value;
          const isCorrect = option.value === block.correct_answer;
          const showResult = quizState !== 'answering';
          const shouldRevealCorrect = quizState === 'correct' || quizState === 'failed';
          
          let optionStyle = 'border-border hover:border-primary/50 hover:bg-accent/50 flex-1';
          
          if (showResult) {
            if (shouldRevealCorrect && isCorrect) {
              optionStyle = 'border-green-500 bg-green-50 dark:bg-green-950/30 flex-1';
            } else if (isSelected && !isCorrect) {
              optionStyle = 'border-red-500 bg-red-50 dark:bg-red-950/30 flex-1';
            } else {
              optionStyle = 'border-border opacity-60 flex-1';
            }
          } else if (isSelected) {
            optionStyle = 'border-primary bg-primary/5 flex-1';
          }

          return (
            <Card
              key={String(option.value)}
              className={cn(
                'p-6 cursor-pointer transition-all text-center',
                optionStyle,
                quizState !== 'answering' && 'cursor-default pointer-events-none'
              )}
              onClick={() => {
                if (quizState === 'answering') {
                  setSelectedAnswer(option.value);
                }
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-semibold">{option.label}</span>
                {shouldRevealCorrect && isCorrect && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {showResult && isSelected && !isCorrect && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {quizState === 'answering' && (
        <Button 
          onClick={handleSubmit} 
          disabled={selectedAnswer === null}
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
            Geen pogingen meer. Het juiste antwoord was: <strong>{block.correct_answer ? 'Waar' : 'Niet waar'}</strong>
          </p>
          <p className="text-sm text-muted-foreground mt-2">{block.explanation}</p>
        </div>
      )}
    </div>
  );
}
