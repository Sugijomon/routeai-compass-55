import { LearningQuestion, QuestionAnswer } from '@/types/learning';
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion';
import MultipleSelectQuestion from './questions/MultipleSelectQuestion';
import TrueFalseQuestion from './questions/TrueFalseQuestion';
import FillInQuestion from './questions/FillInQuestion';
import EssayQuestion from './questions/EssayQuestion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionRendererProps {
  question: LearningQuestion;
  questionNumber?: number;
  userAnswer?: QuestionAnswer;
  onAnswer: (answer: QuestionAnswer) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  isCorrect?: boolean | null;
}

export default function QuestionRenderer({
  question,
  questionNumber,
  userAnswer,
  onAnswer,
  disabled = false,
  showFeedback = false,
  isCorrect
}: QuestionRendererProps) {
  const renderQuestion = () => {
    const baseProps = {
      question,
      userAnswer,
      onAnswer,
      disabled,
      showFeedback
    };

    switch (question.question_type) {
      case 'multiple_choice':
        return <MultipleChoiceQuestion {...baseProps} />;
      case 'multiple_select':
        return <MultipleSelectQuestion {...baseProps} />;
      case 'true_false':
        return <TrueFalseQuestion {...baseProps} />;
      case 'fill_in':
        return <FillInQuestion {...baseProps} />;
      case 'essay':
        return <EssayQuestion {...baseProps} />;
      default:
        return (
          <div className="p-4 bg-muted rounded-lg text-muted-foreground">
            Onbekend vraagtype: {question.question_type}
          </div>
        );
    }
  };

  const getQuestionTypeLabel = () => {
    switch (question.question_type) {
      case 'multiple_choice': return 'Meerkeuze';
      case 'multiple_select': return 'Meerdere antwoorden';
      case 'true_false': return 'Waar/Niet waar';
      case 'fill_in': return 'Invullen';
      case 'essay': return 'Open vraag';
      default: return 'Vraag';
    }
  };

  return (
    <Card className={cn(
      "transition-all",
      showFeedback && isCorrect === true && "ring-2 ring-green-500/50",
      showFeedback && isCorrect === false && "ring-2 ring-red-500/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {questionNumber && (
              <p className="text-sm text-muted-foreground mb-1">
                Vraag {questionNumber}
              </p>
            )}
            <CardTitle className="text-lg leading-relaxed">
              {question.question_text}
              {question.is_required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </CardTitle>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="text-xs">
              {getQuestionTypeLabel()}
            </Badge>
            
            {showFeedback && isCorrect !== null && isCorrect !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isCorrect ? "text-green-600" : "text-red-600"
              )}>
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Correct</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Onjuist</span>
                  </>
                )}
              </div>
            )}
            
            {showFeedback && question.question_type === 'essay' && (
              <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                <AlertCircle className="h-4 w-4" />
                <span>Wordt beoordeeld</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderQuestion()}

        {/* Explanation (shown after feedback) */}
        {showFeedback && question.explanation && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm font-medium mb-1">Toelichting:</p>
            <p className="text-sm text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        )}

        {/* Points indicator */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {question.points} {question.points === 1 ? 'punt' : 'punten'}
          </p>
          
          {question.is_required && (
            <p className="text-xs text-muted-foreground">
              Verplichte vraag
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
