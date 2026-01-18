import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, CheckCircle, BookOpen, Trophy } from 'lucide-react';

interface CourseCompletionModalProps {
  open: boolean;
  courseTitle: string;
  finalScore: number;
  lessonsCompleted: number;
  totalLessons: number;
  unlockedCapability: string | null;
  onContinue: () => void;
}

export function CourseCompletionModal({
  open,
  courseTitle,
  finalScore,
  lessonsCompleted,
  totalLessons,
  unlockedCapability,
  onContinue,
}: CourseCompletionModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <DialogTitle className="text-2xl">🎉 Cursus Afgerond!</DialogTitle>
          <DialogDescription className="text-base">
            {courseTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Score */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Eindscore</p>
              <p className="text-2xl font-bold text-foreground">{finalScore}%</p>
            </div>
          </div>

          {/* Lessons completed */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lessen afgerond</p>
              <p className="text-lg font-semibold text-foreground">
                {lessonsCompleted} / {totalLessons}
              </p>
            </div>
          </div>

          {/* Unlocked capability */}
          {unlockedCapability && (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Ontgrendeld</p>
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  ✅ {unlockedCapability === 'ai_rijbewijs' ? 'AI Rijbewijs' : unlockedCapability}
                </p>
              </div>
            </div>
          )}

          {unlockedCapability === 'ai_rijbewijs' && (
            <p className="text-center text-sm text-muted-foreground">
              Je kunt nu AI-toepassingen starten! 🚀
            </p>
          )}
        </div>

        <Button onClick={onContinue} className="w-full" size="lg">
          Naar Dashboard
        </Button>
      </DialogContent>
    </Dialog>
  );
}
