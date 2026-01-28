import { BaseQuestionProps, TrueFalseAnswer } from '@/types/learning';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function TrueFalseQuestion({
  question,
  userAnswer,
  onAnswer,
  disabled = false,
  showFeedback = false
}: BaseQuestionProps) {
  const answer = userAnswer as TrueFalseAnswer | undefined;
  const correctAnswer = question.correct_answer as TrueFalseAnswer;

  const handleChange = (value: string) => {
    onAnswer({ selected: value === 'true' });
  };

  const getOptionFeedbackClass = (isTrue: boolean) => {
    if (!showFeedback || answer === undefined) return '';
    
    const isUserSelected = answer.selected === isTrue;
    const isCorrectOption = correctAnswer?.selected === isTrue;
    
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
      value={answer?.selected === undefined ? '' : answer.selected.toString()}
      onValueChange={handleChange}
      disabled={disabled}
      className="space-y-3"
    >
      {[
        { value: 'true', label: 'Waar', isTrue: true },
        { value: 'false', label: 'Niet waar', isTrue: false }
      ].map(({ value, label, isTrue }) => {
        const isUserSelected = answer?.selected === isTrue;
        const isCorrectOption = correctAnswer?.selected === isTrue;
        
        return (
          <div
            key={value}
            className={cn(
              "flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors",
              disabled ? "opacity-70 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer",
              getOptionFeedbackClass(isTrue)
            )}
          >
            <RadioGroupItem
              value={value}
              id={`tf-${value}`}
              disabled={disabled}
            />
            <Label
              htmlFor={`tf-${value}`}
              className={cn(
                "flex-1 cursor-pointer text-base font-medium",
                disabled && "cursor-not-allowed"
              )}
            >
              {label}
            </Label>
            
            {showFeedback && answer !== undefined && (
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
