import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Award } from 'lucide-react';

interface LessonCompletionModalProps {
  open: boolean;
  score: number;
  earnedPoints: number;
  maxPoints: number;
  timeSpent: number; // in seconds
  hasQuizzes: boolean;
  passingScore: number; // percentage required to pass (0-100)
  attemptNumber?: number; // current attempt number
  onContinue: () => void;
  onRetry?: () => void; // callback for retry button
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconden`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} ${minutes === 1 ? 'minuut' : 'minuten'}`;
  }
  return `${minutes} ${minutes === 1 ? 'minuut' : 'minuten'} en ${remainingSeconds} seconden`;
}

export function LessonCompletionModal({
  open,
  score,
  earnedPoints,
  maxPoints,
  timeSpent,
  hasQuizzes,
  passingScore,
  attemptNumber,
  onContinue,
  onRetry,
}: LessonCompletionModalProps) {
  // Determine if user passed based on score vs passing threshold
  // If no quizzes, user automatically passes
  const passed = !hasQuizzes || score >= passingScore;

  const handleButtonClick = () => {
    if (!passed && onRetry) {
      onRetry();
    } else {
      onContinue();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {passed ? (
              <CheckCircle className="h-10 w-10 text-green-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600" />
            )}
          </div>
          <DialogTitle className="text-2xl">
            {passed ? '🎉 Les Afgerond!' : '❌ Niet Geslaagd'}
          </DialogTitle>
          {attemptNumber && (
            <p className="text-sm text-muted-foreground mt-1">
              Dit was poging #{attemptNumber}
            </p>
          )}
          <DialogDescription className="text-base">
            {passed 
              ? 'Gefeliciteerd! Je hebt deze les succesvol afgerond.'
              : `Je hebt ${score}% behaald, maar ${passingScore}% is nodig om te slagen.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Score display - only show if quizzes exist */}
          {hasQuizzes && (
            <div className={`flex items-center gap-3 rounded-lg p-4 ${
              passed ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
            }`}>
              <Award className={`h-6 w-6 ${passed ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm text-muted-foreground">Je score</p>
                <p className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {score}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {earnedPoints} van {maxPoints} punten behaald
                </p>
                {!passed && (
                  <p className="text-sm text-red-600 mt-1">
                    Minimaal {passingScore}% nodig
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Time spent */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <Clock className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Tijd besteed</p>
              <p className="text-lg font-semibold text-foreground">{formatTime(timeSpent)}</p>
            </div>
          </div>
        </div>

        <Button onClick={handleButtonClick} className="w-full" size="lg">
          {passed ? 'Doorgaan' : 'Opnieuw proberen'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
