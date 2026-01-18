import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export function SaveIndicator({ isSaving, lastSaved }: SaveIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm transition-opacity',
        isSaving ? 'text-muted-foreground' : 'text-green-600'
      )}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Opslaan...</span>
        </>
      ) : lastSaved ? (
        <>
          <Check className="h-4 w-4" />
          <span>Opgeslagen om {formatTime(lastSaved)}</span>
        </>
      ) : null}
    </div>
  );
}
