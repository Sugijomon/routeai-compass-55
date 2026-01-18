import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Award } from 'lucide-react';

interface LessonCompletionModalProps {
  open: boolean;
  score: number;
  earnedPoints: number;
  maxPoints: number;
  timeSpent: number; // in seconds
  hasQuizzes: boolean;
  onContinue: () => void;
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
  onContinue,
}: LessonCompletionModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-2xl">🎉 Les Afgerond!</DialogTitle>
          <DialogDescription className="text-base">
            Gefeliciteerd! Je hebt deze les succesvol afgerond.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Score display - only show if quizzes exist */}
          {hasQuizzes && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
              <Award className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Je score</p>
                <p className="text-2xl font-bold text-foreground">{score}%</p>
                <p className="text-sm text-muted-foreground">
                  {earnedPoints} van {maxPoints} punten behaald
                </p>
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

        <Button onClick={onContinue} className="w-full" size="lg">
          Doorgaan
        </Button>
      </DialogContent>
    </Dialog>
  );
}
