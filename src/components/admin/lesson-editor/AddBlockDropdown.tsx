import { FileText, Video, HelpCircle, CheckSquare, ToggleLeft, Edit3, MessageSquare, Sparkles, AlertCircle, List, Heading, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BlockType } from '@/types/lesson-blocks';

interface AddBlockDropdownProps {
  onAddBlock: (type: BlockType) => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType }[] = [
  { type: 'paragraph',      label: 'Tekst',           icon: FileText },
  { type: 'video',          label: 'Video',           icon: Video },
  { type: 'download',       label: 'Download',        icon: Download },
  { type: 'hero',           label: 'Hero',            icon: Sparkles },
  { type: 'section_header', label: 'Sectietitel',     icon: Heading },
  { type: 'callout',        label: 'Callout',         icon: AlertCircle },
  { type: 'key_takeaways',  label: 'Kernpunten',      icon: List },
  { type: 'quiz_mc',        label: 'Meerkeuze',       icon: HelpCircle },
  { type: 'quiz_ms',        label: 'Multi-select',    icon: CheckSquare },
  { type: 'quiz_tf',        label: 'Waar/Onwaar',     icon: ToggleLeft },
  { type: 'quiz_fill',      label: 'Invulvraag',      icon: Edit3 },
  { type: 'quiz_essay',     label: 'Essay',           icon: MessageSquare },
];

export function AddBlockDropdown({ onAddBlock }: AddBlockDropdownProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Blok toevoegen</p>
      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddBlock(type)}
          >
            <Icon className="h-4 w-4 mr-1" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
