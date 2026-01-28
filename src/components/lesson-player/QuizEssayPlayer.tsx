import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { QuizEssayBlock } from '@/types/lesson-blocks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizEssayPlayerProps {
  block: QuizEssayBlock;
  attempts: number;
  onAttempt: () => void;
  onCanProceed: (canProceed: boolean) => void;
  onQuizResult?: (blockId: string, correct: boolean, points: number) => void;
  alreadyCompleted?: boolean;
  previousResult?: { correct: boolean; points: number; answer?: string };
}

type QuizState = 'answering' | 'submitted';

export function QuizEssayPlayer({ 
  block, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  attempts,
  onAttempt, 
  onCanProceed,
  onQuizResult,
  alreadyCompleted,
  previousResult,
}: QuizEssayPlayerProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [quizState, setQuizState] = useState<QuizState>('answering');
  const [wordCount, setWordCount] = useState(0);

  // Restore state if already completed
  useEffect(() => {
    if (alreadyCompleted && previousResult) {
      setUserAnswer(previousResult.answer || '');
      setQuizState('submitted');
      onCanProceed(true);
    }
  }, [alreadyCompleted, previousResult, onCanProceed]);

  // Update word count
  useEffect(() => {
    const words = userAnswer.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [userAnswer]);

  const isValidLength = (): boolean => {
    if (block.min_words && wordCount < block.min_words) return false;
    if (block.max_words && wordCount > block.max_words) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || !isValidLength()) return;

    onAttempt();
    setQuizState('submitted');
    onCanProceed(true);
    
    // Essay questions are marked as "pending" - they need manual grading
    // For now, we award partial points (e.g., 50%) for submitting
    const partialPoints = Math.floor(block.points * 0.5);
    onQuizResult?.(block.id, true, partialPoints);
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium text-foreground prose prose-slate max-w-none">
        <ReactMarkdown>{block.question}</ReactMarkdown>
      </div>

      <div className="text-sm text-muted-foreground flex items-center gap-4">
        <span>{block.points} punten</span>
        {(block.min_words || block.max_words) && (
          <span>
            {block.min_words && `Min. ${block.min_words} woorden`}
            {block.min_words && block.max_words && ' • '}
            {block.max_words && `Max. ${block.max_words} woorden`}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder={block.placeholder || "Schrijf hier je antwoord..."}
          disabled={quizState === 'submitted'}
          className={cn(
            "min-h-[200px] text-base",
            quizState === 'submitted' && "bg-muted"
          )}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span className={cn(
            wordCount > 0 && block.min_words && wordCount < block.min_words && "text-amber-600",
            block.max_words && wordCount > block.max_words && "text-red-600"
          )}>
            {wordCount} {wordCount === 1 ? 'woord' : 'woorden'}
          </span>
          {!isValidLength() && (
            <span className="text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {block.min_words && wordCount < block.min_words && `Minimaal ${block.min_words} woorden vereist`}
              {block.max_words && wordCount > block.max_words && `Maximaal ${block.max_words} woorden toegestaan`}
            </span>
          )}
        </div>
      </div>

      {quizState === 'answering' && (
        <Button 
          onClick={handleSubmit} 
          disabled={!userAnswer.trim() || !isValidLength()}
          className="w-full"
        >
          Antwoord inleveren
        </Button>
      )}

      {quizState === 'submitted' && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 space-y-3">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <FileText className="h-5 w-5" />
            <span className="font-medium text-lg">✅ Antwoord ingeleverd</span>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            Je antwoord is opgeslagen. Open vragen worden handmatig beoordeeld door een docent.
          </p>
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300">
            <CheckCircle className="h-4 w-4" />
            <span>Je kunt doorgaan naar het volgende onderdeel</span>
          </div>
        </div>
      )}

    </div>
  );
}
