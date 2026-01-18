import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { QuizBlock } from '@/types/lesson-blocks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizBlockPlayerProps {
  block: QuizBlock;
  attempts: number;
  onAttempt: () => void;
  onCanProceed: (canProceed: boolean) => void;
  onQuizResult?: (blockId: string, correct: boolean, points: number) => void;
}

type QuizState = 'answering' | 'correct' | 'incorrect' | 'failed';

export function QuizBlockPlayer({ 
  block, 
  attempts, 
  onAttempt, 
  onCanProceed,
  onQuizResult,
}: QuizBlockPlayerProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<QuizState>('answering');
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);

  const remainingAttempts = block.max_attempts - attempts;
  const optionLabels = ['A', 'B', 'C', 'D'];

  // Check if already passed (from previous session)
  useEffect(() => {
    if (hasAnsweredCorrectly) {
      onCanProceed(true);
    }
  }, [hasAnsweredCorrectly, onCanProceed]);

  const handleSubmit = () => {
    if (selectedOption === null) return;

    onAttempt();

    if (selectedOption === block.correct_answer) {
      setQuizState('correct');
      setHasAnsweredCorrectly(true);
      onCanProceed(true);
      // Report quiz result with points earned
      onQuizResult?.(block.id, true, block.points);
    } else {
      if (remainingAttempts <= 1) {
        setQuizState('failed');
        // Allow proceeding even on fail, but record the failure with 0 points
        onCanProceed(true);
        onQuizResult?.(block.id, false, 0);
      } else {
        setQuizState('incorrect');
      }
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setQuizState('answering');
  };

  return (
    <div className="space-y-6">
      {/* Question with markdown support */}
      <div className="text-lg font-medium text-foreground prose prose-slate max-w-none">
        <ReactMarkdown>{block.question}</ReactMarkdown>
      </div>

      {/* Points indicator */}
      <div className="text-sm text-muted-foreground">
        {block.points} punten • {remainingAttempts > 0 ? `${remainingAttempts} pogingen over` : 'Geen pogingen meer'}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {block.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = index === block.correct_answer;
          const showResult = quizState !== 'answering';
          
          let optionStyle = 'border-border hover:border-primary/50 hover:bg-accent/50';
          
          if (showResult) {
            if (isCorrect) {
              optionStyle = 'border-green-500 bg-green-50';
            } else if (isSelected && !isCorrect) {
              optionStyle = 'border-red-500 bg-red-50';
            }
          } else if (isSelected) {
            optionStyle = 'border-primary bg-primary/5';
          }

          return (
            <Card
              key={index}
              className={cn(
                'p-4 cursor-pointer transition-all',
                optionStyle,
                quizState !== 'answering' && 'cursor-default'
              )}
              onClick={() => {
                if (quizState === 'answering') {
                  setSelectedOption(index);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border',
                  isSelected && quizState === 'answering' 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : 'border-border bg-background'
                )}>
                  {optionLabels[index]}
                </span>
                <span className="flex-1">{option}</span>
                {showResult && isCorrect && (
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

      {/* Submit/Retry button */}
      {quizState === 'answering' && (
        <Button 
          onClick={handleSubmit} 
          disabled={selectedOption === null}
          className="w-full"
        >
          Controleer antwoord
        </Button>
      )}

      {/* Result messages */}
      {quizState === 'correct' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Correct! +{block.points} punten</span>
          </div>
          <p className="text-sm text-green-600">{block.explanation}</p>
        </div>
      )}

      {quizState === 'incorrect' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Helaas, dat is niet correct</span>
          </div>
          <p className="text-sm text-amber-600">
            Je hebt nog {remainingAttempts - 1} {remainingAttempts - 1 === 1 ? 'poging' : 'pogingen'} over.
          </p>
          <Button onClick={handleRetry} variant="outline" className="w-full">
            Opnieuw proberen
          </Button>
        </div>
      )}

      {quizState === 'failed' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Geen pogingen meer</span>
          </div>
          <p className="text-sm text-muted-foreground">{block.explanation}</p>
        </div>
      )}
    </div>
  );
}
