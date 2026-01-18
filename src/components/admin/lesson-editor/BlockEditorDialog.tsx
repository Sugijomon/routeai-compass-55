import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import type { LessonBlock, ParagraphBlock, VideoBlock, QuizBlock, QuizOption } from '@/types/lesson-blocks';
import { getBlockTypeLabel } from '@/types/lesson-blocks';

interface BlockEditorDialogProps {
  block: LessonBlock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (block: LessonBlock) => void;
}

export function BlockEditorDialog({
  block,
  open,
  onOpenChange,
  onSave,
}: BlockEditorDialogProps) {
  const [editedBlock, setEditedBlock] = useState<LessonBlock | null>(null);

  useEffect(() => {
    if (block) {
      setEditedBlock({ ...block });
    }
  }, [block]);

  if (!editedBlock) return null;

  const handleSave = () => {
    onSave(editedBlock);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getBlockTypeLabel(editedBlock.type)} Bewerken</DialogTitle>
          <DialogDescription>
            Pas de inhoud van dit blok aan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {editedBlock.type === 'paragraph' && (
            <ParagraphEditor
              block={editedBlock as ParagraphBlock}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'video' && (
            <VideoEditor
              block={editedBlock as VideoBlock}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'quiz' && (
            <QuizEditor
              block={editedBlock as QuizBlock}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Paragraph Block Editor
function ParagraphEditor({
  block,
  onChange,
}: {
  block: ParagraphBlock;
  onChange: (updates: Partial<ParagraphBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">Inhoud</Label>
        <Textarea
          id="content"
          placeholder="Schrijf hier je tekst... (Markdown wordt ondersteund)"
          value={block.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Je kunt Markdown gebruiken voor opmaak (bold, italic, lijsten, etc.)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Afbeelding URL (optioneel)</Label>
        <Input
          id="imageUrl"
          placeholder="https://example.com/image.jpg"
          value={block.imageUrl || ''}
          onChange={(e) => onChange({ imageUrl: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}

// Video Block Editor
function VideoEditor({
  block,
  onChange,
}: {
  block: VideoBlock;
  onChange: (updates: Partial<VideoBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titel (optioneel)</Label>
        <Input
          id="title"
          placeholder="Bijv. Introductie tot AI"
          value={block.title || ''}
          onChange={(e) => onChange({ title: e.target.value || undefined })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video URL</Label>
        <Input
          id="videoUrl"
          placeholder="https://youtube.com/watch?v=... of https://vimeo.com/..."
          value={block.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Ondersteund: YouTube, Vimeo, of directe video URL
        </p>
      </div>
    </div>
  );
}

// Quiz Block Editor
function QuizEditor({
  block,
  onChange,
}: {
  block: QuizBlock;
  onChange: (updates: Partial<QuizBlock>) => void;
}) {
  const addOption = () => {
    const newOption: QuizOption = {
      id: `opt_${Date.now()}`,
      text: '',
      isCorrect: false,
      explanation: '',
    };
    onChange({ options: [...block.options, newOption] });
  };

  const updateOption = (optionId: string, updates: Partial<QuizOption>) => {
    const updatedOptions = block.options.map((opt) =>
      opt.id === optionId ? { ...opt, ...updates } : opt
    );
    onChange({ options: updatedOptions });
  };

  const removeOption = (optionId: string) => {
    onChange({ options: block.options.filter((opt) => opt.id !== optionId) });
  };

  const setCorrectAnswer = (optionId: string) => {
    const updatedOptions = block.options.map((opt) => ({
      ...opt,
      isCorrect: opt.id === optionId,
    }));
    onChange({ options: updatedOptions });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">Vraag</Label>
        <Textarea
          id="question"
          placeholder="Stel hier je vraag..."
          value={block.question}
          onChange={(e) => onChange({ question: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Antwoordopties</Label>
        {block.options.map((option, index) => (
          <div key={option.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  checked={option.isCorrect}
                  onCheckedChange={() => setCorrectAnswer(option.id)}
                />
                <span className="text-xs text-muted-foreground">Correct</span>
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  placeholder={`Optie ${index + 1}`}
                  value={option.text}
                  onChange={(e) => updateOption(option.id, { text: e.target.value })}
                />
                <Input
                  placeholder="Uitleg (optioneel)"
                  value={option.explanation || ''}
                  onChange={(e) => updateOption(option.id, { explanation: e.target.value })}
                  className="text-sm"
                />
              </div>
              {block.options.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(option.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {block.options.length < 6 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addOption}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Optie Toevoegen
          </Button>
        )}
      </div>
    </div>
  );
}
