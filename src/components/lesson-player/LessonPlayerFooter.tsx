import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LessonPlayerFooterProps {
  currentBlock: number;
  totalBlocks: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastBlock: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
}

export function LessonPlayerFooter({
  currentBlock,
  totalBlocks,
  canGoPrevious,
  isLastBlock,
  onNext,
  onPrevious,
  onComplete,
}: LessonPlayerFooterProps) {
  return (
    <footer className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Vorige
          </Button>

          <span className="text-sm text-muted-foreground">
            Blok {currentBlock + 1} van {totalBlocks}
          </span>

          {isLastBlock ? (
            <Button onClick={onComplete} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Afronden
            </Button>
          ) : (
            <Button onClick={onNext} className="gap-2">
              Volgende
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}
