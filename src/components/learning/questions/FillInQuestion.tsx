import { BaseQuestionProps, FillInAnswer, FillInConfig } from '@/types/learning';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function FillInQuestion({
  question,
  userAnswer,
  onAnswer,
  disabled = false,
  showFeedback = false
}: BaseQuestionProps) {
  const config = question.question_config as FillInConfig;
  const answer = userAnswer as FillInAnswer | undefined;
  const correctAnswer = question.correct_answer as FillInAnswer;
  const [text, setText] = useState(answer?.text || '');

  useEffect(() => {
    if (answer?.text !== undefined) {
      setText(answer.text);
    }
  }, [answer]);

  const handleChange = (value: string) => {
    setText(value);
    onAnswer({ text: value });
  };

  const isCorrect = () => {
    if (!showFeedback || !answer?.text || !correctAnswer?.text) return null;
    
    let correctText = correctAnswer.text;
    let userText = answer.text;

    if (!config?.case_sensitive) {
      correctText = correctText.toLowerCase().trim();
      userText = userText.toLowerCase().trim();
    } else {
      correctText = correctText.trim();
      userText = userText.trim();
    }

    if (correctText === userText) return true;

    if (config?.accept_variations) {
      const variations = config.accept_variations.map(v => 
        config.case_sensitive ? v.trim() : v.toLowerCase().trim()
      );
      if (variations.includes(userText)) return true;
    }

    return false;
  };

  const feedbackResult = showFeedback ? isCorrect() : null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={config?.placeholder || 'Typ je antwoord hier...'}
          disabled={disabled}
          className={cn(
            "max-w-md pr-10",
            showFeedback && feedbackResult === true && "border-green-500 focus-visible:ring-green-500",
            showFeedback && feedbackResult === false && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        
        {showFeedback && feedbackResult !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {feedbackResult ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
        )}
      </div>
      
      {config?.case_sensitive && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Let op: het antwoord is hoofdlettergevoelig</span>
        </div>
      )}
      
      {showFeedback && feedbackResult === false && correctAnswer?.text && (
        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-sm">
            <span className="font-medium">Juiste antwoord:</span>{' '}
            <span className="text-green-600 dark:text-green-400">{correctAnswer.text}</span>
          </p>
          {config?.accept_variations && config.accept_variations.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Ook geaccepteerd: {config.accept_variations.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
