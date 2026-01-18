import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

interface LessonPlayerHeaderProps {
  title: string;
  currentBlock: number;
  totalBlocks: number;
  progressPercentage: number;
}

export function LessonPlayerHeader({
  title,
  currentBlock,
  totalBlocks,
  progressPercentage,
}: LessonPlayerHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/training')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          </div>
          <span className="text-sm text-muted-foreground shrink-0">
            {progressPercentage}%
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Progress value={progressPercentage} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Blok {currentBlock + 1} van {totalBlocks}
          </span>
        </div>
      </div>
    </header>
  );
}
