import { BaseQuestionProps, MultipleSelectAnswer, MultipleSelectConfig } from '@/types/learning';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function MultipleSelectQuestion({
  question,
  userAnswer,
  onAnswer,
  disabled = false,
  showFeedback = false
}: BaseQuestionProps) {
  const config = question.question_config as MultipleSelectConfig;
  const answer = userAnswer as MultipleSelectAnswer | undefined;
  const correctAnswer = question.correct_answer as MultipleSelectAnswer;
  const [selected, setSelected] = useState<string[]>(answer?.selected || []);

  useEffect(() => {
    if (answer?.selected) {
      setSelected(answer.selected);
    }
  }, [answer]);

  const handleChange = (optionId: string, checked: boolean) => {
    let newSelected: string[];
    
    if (checked) {
      // Check max selections limit
      if (config.max_selections && selected.length >= config.max_selections) {
        return;
      }
      newSelected = [...selected, optionId];
    } else {
      newSelected = selected.filter(id => id !== optionId);
    }

    setSelected(newSelected);
    onAnswer({ selected: newSelected });
  };

  const getOptionFeedbackClass = (optionId: string) => {
    if (!showFeedback || !answer) return '';
    
    const isUserSelected = selected.includes(optionId);
    const isCorrectOption = correctAnswer?.selected?.includes(optionId);
    
    if (isCorrectOption && isUserSelected) {
      return 'border-green-500 bg-green-50 dark:bg-green-950/30';
    }
    if (isCorrectOption && !isUserSelected) {
      return 'border-green-500 bg-green-50/50 dark:bg-green-950/20';
    }
    if (isUserSelected && !isCorrectOption) {
      return 'border-red-500 bg-red-50 dark:bg-red-950/30';
    }
    return '';
  };

  const getSelectionHint = () => {
    if (config.min_selections && config.max_selections) {
      if (config.min_selections === config.max_selections) {
        return `Selecteer precies ${config.min_selections} ${config.min_selections === 1 ? 'optie' : 'opties'}`;
      }
      return `Selecteer ${config.min_selections}-${config.max_selections} opties`;
    }
    if (config.min_selections) {
      return `Selecteer minimaal ${config.min_selections} ${config.min_selections === 1 ? 'optie' : 'opties'}`;
    }
    if (config.max_selections) {
      return `Selecteer maximaal ${config.max_selections} ${config.max_selections === 1 ? 'optie' : 'opties'}`;
    }
    return 'Selecteer alle juiste antwoorden';
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        {getSelectionHint()}
      </p>
      
      {config.options?.map((option) => {
        const isUserSelected = selected.includes(option.id);
        const isCorrectOption = correctAnswer?.selected?.includes(option.id);
        
        return (
          <div
            key={option.id}
            className={cn(
              "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
              disabled ? "opacity-70 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer",
              getOptionFeedbackClass(option.id)
            )}
          >
            <Checkbox
              id={`option-${option.id}`}
              checked={isUserSelected}
              onCheckedChange={(checked) => handleChange(option.id, checked as boolean)}
              disabled={disabled}
            />
            <Label
              htmlFor={`option-${option.id}`}
              className={cn(
                "flex-1 cursor-pointer",
                disabled && "cursor-not-allowed"
              )}
            >
              {option.text}
            </Label>
            
            {showFeedback && answer && (
              <>
                {isCorrectOption && isUserSelected && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {isCorrectOption && !isUserSelected && (
                  <CheckCircle2 className="h-5 w-5 text-green-600 opacity-50" />
                )}
                {isUserSelected && !isCorrectOption && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </>
            )}
          </div>
        );
      })}
      
      <p className="text-xs text-muted-foreground mt-2">
        {selected.length} van {config.options?.length || 0} geselecteerd
      </p>
    </div>
  );
}
