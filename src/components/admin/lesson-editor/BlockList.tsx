import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import type { LessonBlock } from '@/types/lesson-blocks';
import { getBlockTypeIcon, getBlockTypeLabel, getBlockPreview } from '@/types/lesson-blocks';

interface BlockListProps {
  blocks: LessonBlock[];
  onEdit: (block: LessonBlock) => void;
  onDelete: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
}

export function BlockList({
  blocks,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockListProps) {
  const [deleteBlock, setDeleteBlock] = useState<LessonBlock | null>(null);

  if (blocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Nog geen blokken. Voeg je eerste blok toe hieronder.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
          >
            {/* Block number */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {index + 1}
            </div>

            {/* Block type icon */}
            <span className="text-xl">{getBlockTypeIcon(block.type)}</span>

            {/* Block info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {getBlockTypeLabel(block.type)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground truncate">
                {getBlockPreview(block)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveUp(block.id)}
                disabled={index === 0}
                title="Omhoog verplaatsen"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveDown(block.id)}
                disabled={index === blocks.length - 1}
                title="Omlaag verplaatsen"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(block)}
                title="Bewerken"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteBlock(block)}
                title="Verwijderen"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteBlock} onOpenChange={() => setDeleteBlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blok verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je dit {deleteBlock ? getBlockTypeLabel(deleteBlock.type).toLowerCase() : 'blok'} wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteBlock) {
                  onDelete(deleteBlock.id);
                  setDeleteBlock(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
