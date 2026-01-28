import { BaseQuestionProps, EssayAnswer, EssayConfig } from '@/types/learning';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export default function EssayQuestion({
  question,
  userAnswer,
  onAnswer,
  disabled = false,
  showFeedback = false
}: BaseQuestionProps) {
  const config = question.question_config as EssayConfig;
  const answer = userAnswer as EssayAnswer | undefined;
  const [text, setText] = useState(answer?.text || '');
  
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (answer?.text !== undefined) {
      setText(answer.text);
    }
  }, [answer]);

  const handleChange = (value: string) => {
    setText(value);
    onAnswer({ text: value });
  };

  const isWithinLimits = () => {
    if (config?.min_words && wordCount < config.min_words) return false;
    if (config?.max_words && wordCount > config.max_words) return false;
    return true;
  };

  const getWordCountStatus = () => {
    if (!config?.min_words && !config?.max_words) return 'neutral';
    if (config?.min_words && wordCount < config.min_words) return 'warning';
    if (config?.max_words && wordCount > config.max_words) return 'error';
    return 'success';
  };

  const status = getWordCountStatus();

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={config?.placeholder || 'Schrijf je antwoord hier...'}
        disabled={disabled}
        className={cn(
          "min-h-[200px] resize-y",
          status === 'error' && "border-red-500 focus-visible:ring-red-500",
          status === 'warning' && "border-amber-500 focus-visible:ring-amber-500"
        )}
      />
      
      <div className="flex justify-between items-center text-sm">
        <span className={cn(
          "text-muted-foreground",
          status === 'error' && "text-red-600",
          status === 'warning' && "text-amber-600",
          status === 'success' && "text-green-600"
        )}>
          {wordCount} {wordCount === 1 ? 'woord' : 'woorden'}
        </span>
        
        {(config?.min_words || config?.max_words) && (
          <span className={cn(
            "text-muted-foreground",
            !isWithinLimits() && "text-destructive"
          )}>
            {config.min_words && config.max_words
              ? `Vereist: ${config.min_words}-${config.max_words} woorden`
              : config.min_words
              ? `Minimaal: ${config.min_words} woorden`
              : config.max_words
              ? `Maximaal: ${config.max_words} woorden`
              : null
            }
          </span>
        )}
      </div>

      {showFeedback && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Dit open antwoord wordt later beoordeeld door een beoordelaar.
          </p>
        </div>
      )}

      {!isWithinLimits() && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {status === 'warning' 
              ? `Je antwoord is te kort. Schrijf nog ${config?.min_words ? config.min_words - wordCount : 0} ${(config?.min_words || 0) - wordCount === 1 ? 'woord' : 'woorden'} meer.`
              : `Je antwoord is te lang. Verwijder ${wordCount - (config?.max_words || 0)} ${wordCount - (config?.max_words || 0) === 1 ? 'woord' : 'woorden'}.`
            }
          </p>
        </div>
      )}
    </div>
  );
}
