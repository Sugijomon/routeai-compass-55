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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { LessonBlock, ParagraphBlock, VideoBlock, QuizBlock } from '@/types/lesson-blocks';
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (block) {
      setEditedBlock({ ...block });
      setErrors({});
    }
  }, [block]);

  if (!editedBlock) return null;

  const validateBlock = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (editedBlock.type) {
      case 'paragraph':
        if (!editedBlock.content.trim()) {
          newErrors.content = 'Inhoud is verplicht';
        }
        break;
      case 'video':
        if (!editedBlock.url.trim()) {
          newErrors.url = 'Video URL is verplicht';
        } else {
          try {
            new URL(editedBlock.url);
          } catch {
            newErrors.url = 'Voer een geldige URL in';
          }
        }
        break;
      case 'quiz_mc':
        if (!editedBlock.question.trim()) {
          newErrors.question = 'Vraag is verplicht';
        }
        editedBlock.options.forEach((opt, idx) => {
          if (!opt.trim()) {
            newErrors[`option_${idx}`] = `Optie ${String.fromCharCode(65 + idx)} is verplicht`;
          }
        });
        if (!editedBlock.explanation.trim()) {
          newErrors.explanation = 'Uitleg is verplicht';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateBlock()) {
      onSave(editedBlock);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {getBlockTypeLabel(editedBlock.type)} Block</DialogTitle>
          <DialogDescription>
            Pas de inhoud van dit blok aan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {editedBlock.type === 'paragraph' && (
            <ParagraphEditor
              block={editedBlock as ParagraphBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'video' && (
            <VideoEditor
              block={editedBlock as VideoBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'quiz_mc' && (
            <QuizEditor
              block={editedBlock as QuizBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
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
  errors,
  onChange,
}: {
  block: ParagraphBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<ParagraphBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">
          Inhoud <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="content"
          placeholder="Write your content here. Markdown is supported."
          value={block.content}
          onChange={(e) => onChange({ content: e.target.value })}
          className="font-mono text-sm min-h-[300px]"
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Je kunt Markdown gebruiken voor opmaak (bold, italic, lijsten, etc.)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input
          id="imageUrl"
          placeholder="https://... (optional)"
          value={block.image_url || ''}
          onChange={(e) => onChange({ image_url: e.target.value || undefined })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageCaption">Image Caption (optional)</Label>
        <Input
          id="imageCaption"
          placeholder="Caption for the image..."
          value={block.image_caption || ''}
          onChange={(e) => onChange({ image_caption: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}

// Video Block Editor
function VideoEditor({
  block,
  errors,
  onChange,
}: {
  block: VideoBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<VideoBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="videoUrl">
          Video URL <span className="text-destructive">*</span>
        </Label>
        <Input
          id="videoUrl"
          placeholder="YouTube or Vimeo URL"
          value={block.url}
          onChange={(e) => onChange({ url: e.target.value })}
        />
        {errors.url && (
          <p className="text-sm text-destructive">{errors.url}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Ondersteund: YouTube, Vimeo, of directe video URL
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (seconds, optional)</Label>
        <Input
          id="duration"
          type="number"
          min="0"
          placeholder="e.g. 180"
          value={block.duration || ''}
          onChange={(e) => onChange({ duration: e.target.value ? parseInt(e.target.value) : undefined })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="caption">Caption (optional)</Label>
        <Input
          id="caption"
          placeholder="Video caption or title..."
          value={block.caption || ''}
          onChange={(e) => onChange({ caption: e.target.value || undefined })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="mustWatchFull"
          checked={block.must_watch_full}
          onCheckedChange={(checked) => onChange({ must_watch_full: checked === true })}
        />
        <Label htmlFor="mustWatchFull" className="text-sm font-normal cursor-pointer">
          Require user to watch entire video before continuing
        </Label>
      </div>
    </div>
  );
}

// Quiz Block Editor
function QuizEditor({
  block,
  errors,
  onChange,
}: {
  block: QuizBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<QuizBlock>) => void;
}) {
  const optionLabels = ['Option A', 'Option B', 'Option C', 'Option D'];

  const updateOption = (index: number, value: string) => {
    const newOptions = [...block.options] as [string, string, string, string];
    newOptions[index] = value;
    onChange({ options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">
          Question <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="question"
          placeholder="What is...?"
          value={block.question}
          onChange={(e) => onChange({ question: e.target.value })}
          rows={3}
        />
        {errors.question && (
          <p className="text-sm text-destructive">{errors.question}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Markdown wordt ondersteund voor opmaak.
        </p>
      </div>

      <div className="space-y-3">
        <Label>
          Answer Options <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={block.correct_answer.toString()}
          onValueChange={(value) => onChange({ correct_answer: parseInt(value) })}
        >
          {block.options.map((option, index) => (
            <div key={index} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-3">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="text-xs text-muted-foreground cursor-pointer">
                  Correct
                </Label>
                <div className="flex-1">
                  <Input
                    placeholder={optionLabels[index]}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                  {errors[`option_${index}`] && (
                    <p className="text-sm text-destructive mt-1">{errors[`option_${index}`]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">
          Explanation <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="explanation"
          placeholder="Explain why this is the correct answer..."
          value={block.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
          rows={3}
        />
        {errors.explanation && (
          <p className="text-sm text-destructive">{errors.explanation}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Wordt getoond nadat de gebruiker heeft geantwoord.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="points">Points</Label>
          <Input
            id="points"
            type="number"
            min="1"
            value={block.points}
            onChange={(e) => onChange({ points: parseInt(e.target.value) || 10 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Max Attempts</Label>
          <Input
            id="maxAttempts"
            type="number"
            min="1"
            value={block.max_attempts}
            onChange={(e) => onChange({ max_attempts: parseInt(e.target.value) || 3 })}
          />
        </div>
      </div>
    </div>
  );
}
