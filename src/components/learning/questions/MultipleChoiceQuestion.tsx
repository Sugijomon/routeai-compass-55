import { BaseQuestionProps, MultipleChoiceAnswer, MultipleChoiceConfig } from '@/types/learning';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function MultipleChoiceQuestion({
  question,
  userAnswer,
  onAnswer,
  disabled = false,
  showFeedback = false
}: BaseQuestionProps) {
  const config = question.question_config as MultipleChoiceConfig;
  const answer = userAnswer as MultipleChoiceAnswer | undefined;
  const correctAnswer = question.correct_answer as MultipleChoiceAnswer;

  const handleChange = (value: string) => {
    onAnswer({ selected: value });
  };

  const getOptionFeedbackClass = (optionId: string) => {
    if (!showFeedback || !answer) return '';
    
    const isUserSelected = answer.selected === optionId;
    const isCorrectOption = correctAnswer?.selected === optionId;
    
    if (isCorrectOption) {
      return 'border-green-500 bg-green-50 dark:bg-green-950/30';
    }
    if (isUserSelected && !isCorrectOption) {
      return 'border-red-500 bg-red-50 dark:bg-red-950/30';
    }
    return '';
  };

  return (
    <RadioGroup
      value={answer?.selected || ''}
      onValueChange={handleChange}
      disabled={disabled}
      className="space-y-3"
    >
      {config.options?.map((option) => {
        const isUserSelected = answer?.selected === option.id;
        const isCorrectOption = correctAnswer?.selected === option.id;
        
        return (
          <div
            key={option.id}
            className={cn(
              "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
              disabled ? "opacity-70 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer",
              getOptionFeedbackClass(option.id)
            )}
          >
            <RadioGroupItem
              value={option.id}
              id={`option-${option.id}`}
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
                {isCorrectOption && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {isUserSelected && !isCorrectOption && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </>
            )}
          </div>
        );
      })}
    </RadioGroup>
  );
}
