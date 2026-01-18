import { Plus, FileText, Video, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BlockType } from '@/types/lesson-blocks';

interface AddBlockDropdownProps {
  onAddBlock: (type: BlockType) => void;
}

export function AddBlockDropdown({ onAddBlock }: AddBlockDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full border-dashed">
          <Plus className="mr-2 h-4 w-4" />
          Blok Toevoegen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        <DropdownMenuItem onClick={() => onAddBlock('paragraph')}>
          <FileText className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Paragraaf</p>
            <p className="text-xs text-muted-foreground">Tekst met optionele afbeelding</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddBlock('video')}>
          <Video className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Video</p>
            <p className="text-xs text-muted-foreground">Embedded video URL</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddBlock('quiz')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Quiz</p>
            <p className="text-xs text-muted-foreground">Meerkeuzevraag</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
