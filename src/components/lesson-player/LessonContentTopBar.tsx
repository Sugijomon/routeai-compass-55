import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen } from 'lucide-react';

interface LessonContentTopBarProps {
  lessonTitle: string;
  estimatedDuration: number | null;
  progressPercentage: number;
  currentBlock?: number;
  totalBlocks?: number;
}

export function LessonContentTopBar({
  lessonTitle,
  estimatedDuration,
  progressPercentage,
  currentBlock,
  totalBlocks,
}: LessonContentTopBarProps) {
  return (
    <div className="h-14 shrink-0 border-b bg-card flex items-center px-6 gap-4">
      {/* Unit / Lesson title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
        <h1 className="text-sm font-semibold text-foreground truncate">
          {lessonTitle}
        </h1>
      </div>

      {/* Read time */}
      {estimatedDuration && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Clock className="h-3.5 w-3.5" />
          <span>~{estimatedDuration} min</span>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-2 shrink-0 w-36">
        <Progress value={progressPercentage} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground font-medium w-8 text-right">
          {progressPercentage}%
        </span>
      </div>
    </div>
  );
}
