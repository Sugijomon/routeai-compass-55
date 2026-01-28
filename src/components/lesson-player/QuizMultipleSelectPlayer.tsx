import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { QuizMSBlock } from '@/types/lesson-blocks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Square, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizMultipleSelectPlayerProps {
  block: QuizMSBlock;
  attempts: number;
  onAttempt: () => void;
  onCanProceed: (canProceed: boolean) => void;
  onQuizResult?: (blockId: string, correct: boolean, points: number) => void;
  alreadyCompleted?: boolean;
  previousResult?: { correct: boolean; points: number };
}

type QuizState = 'answering' | 'correct' | 'incorrect' | 'failed';

export function QuizMultipleSelectPlayer({ 
  block, 
  attempts, 
  onAttempt, 
  onCanProceed,
  onQuizResult,
  alreadyCompleted,
  previousResult,
}: QuizMultipleSelectPlayerProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [quizState, setQuizState] = useState<QuizState>('answering');
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);

  const remainingAttempts = block.max_attempts - attempts;
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Restore state if already completed
  useEffect(() => {
    if (alreadyCompleted && previousResult) {
      setSelectedOptions(previousResult.correct ? block.correct_answers : []);
      setQuizState(previousResult.correct ? 'correct' : 'failed');
      setHasAnsweredCorrectly(previousResult.correct);
      onCanProceed(true);
    }
  }, [alreadyCompleted, previousResult, block.correct_answers, onCanProceed]);

  useEffect(() => {
    if (hasAnsweredCorrectly) {
      onCanProceed(true);
    }
  }, [hasAnsweredCorrectly, onCanProceed]);

  const toggleOption = (index: number) => {
    if (quizState !== 'answering') return;
    
    setSelectedOptions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) return;

    onAttempt();

    // Check if arrays have same elements (order doesn't matter)
    const isCorrect = 
      selectedOptions.length === block.correct_answers.length &&
      selectedOptions.every(opt => block.correct_answers.includes(opt));

    if (isCorrect) {
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
    setSelectedOptions([]);
    setQuizState('answering');
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium text-foreground prose prose-slate max-w-none">
        <ReactMarkdown>{block.question}</ReactMarkdown>
      </div>

      <div className="text-sm text-muted-foreground">
        {block.points} punten • {remainingAttempts} {remainingAttempts === 1 ? 'poging' : 'pogingen'} over
        <br />
        <span className="text-xs">Selecteer meerdere antwoorden</span>
      </div>

      <div className="space-y-3">
        {block.options.map((option, index) => {
          const isSelected = selectedOptions.includes(index);
          const isCorrect = block.correct_answers.includes(index);
          const showResult = quizState !== 'answering';
          const shouldRevealCorrect = quizState === 'correct' || quizState === 'failed';
          
          let optionStyle = 'border-border hover:border-primary/50 hover:bg-accent/50';
          
          if (showResult) {
            if (shouldRevealCorrect && isCorrect) {
              optionStyle = 'border-green-500 bg-green-50 dark:bg-green-950/30';
            } else if (isSelected && !isCorrect) {
              optionStyle = 'border-red-500 bg-red-50 dark:bg-red-950/30';
            } else if (quizState === 'incorrect') {
              optionStyle = 'border-border';
            } else {
              optionStyle = 'border-border opacity-60';
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
                quizState !== 'answering' && 'cursor-default pointer-events-none'
              )}
              onClick={() => toggleOption(index)}
            >
              <div className="flex items-center gap-3">
                {isSelected ? (
                  <CheckSquare className={cn(
                    "h-5 w-5 shrink-0",
                    shouldRevealCorrect && isCorrect ? "text-green-600" : 
                    showResult && !isCorrect ? "text-red-600" : "text-primary"
                  )} />
                ) : (
                  <Square className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border shrink-0',
                  shouldRevealCorrect && isCorrect 
                    ? 'border-green-500 bg-green-500 text-white'
                    : isSelected && !isCorrect && showResult
                    ? 'border-red-500 bg-red-500 text-white'
                    : isSelected && quizState === 'answering' 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : 'border-border bg-background'
                )}>
                  {optionLabels[index]}
                </span>
                <span className="flex-1">{option}</span>
                {shouldRevealCorrect && isCorrect && (
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                )}
                {showResult && isSelected && !isCorrect && (
                  <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {quizState === 'answering' && (
        <Button 
          onClick={handleSubmit} 
          disabled={selectedOptions.length === 0}
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
            Geen pogingen meer. De juiste antwoorden waren: <strong>{block.correct_answers.map(i => block.options[i]).join(', ')}</strong>
          </p>
          <p className="text-sm text-muted-foreground mt-2">{block.explanation}</p>
        </div>
      )}
    </div>
  );
}
