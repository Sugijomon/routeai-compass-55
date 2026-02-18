import { Plus, FileText, Video, HelpCircle, CheckSquare, ToggleLeft, Edit3, MessageSquare, Sparkles, AlertCircle, List, Heading } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
      <DropdownMenuContent align="center" className="w-64 bg-popover">
        {/* Layout Blocks */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">Opmaak</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAddBlock('hero')}>
          <Sparkles className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Hero</p>
            <p className="text-xs text-muted-foreground">Grote intro-kaart met titel</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddBlock('section_header')}>
          <Heading className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Sectietitel</p>
            <p className="text-xs text-muted-foreground">Visuele scheiding in de les</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddBlock('callout')}>
          <AlertCircle className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Callout</p>
            <p className="text-xs text-muted-foreground">Tip, info of waarschuwing</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddBlock('key_takeaways')}>
          <List className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Kernpunten</p>
            <p className="text-xs text-muted-foreground">Sluitende samenvatting</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Content Blocks */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">Content</DropdownMenuLabel>
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

        <DropdownMenuSeparator />

        {/* Quiz Blocks */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">Quiz Blokken</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAddBlock('quiz_mc')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Multiple Choice</p>
            <p className="text-xs text-muted-foreground">Eén correct antwoord</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddBlock('quiz_ms')}>
          <CheckSquare className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Multiple Select</p>
            <p className="text-xs text-muted-foreground">Meerdere correcte antwoorden</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddBlock('quiz_tf')}>
          <ToggleLeft className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Waar / Onwaar</p>
            <p className="text-xs text-muted-foreground">True/False vraag</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddBlock('quiz_fill')}>
          <Edit3 className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Invulvraag</p>
            <p className="text-xs text-muted-foreground">Fill-in-the-blank</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddBlock('quiz_essay')}>
          <MessageSquare className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Essay</p>
            <p className="text-xs text-muted-foreground">Open vraag</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
