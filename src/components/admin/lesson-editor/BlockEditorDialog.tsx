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
import { Switch } from '@/components/ui/switch';
import type { 
  LessonBlock, 
  ParagraphBlock, 
  VideoBlock, 
  QuizMCBlock,
  QuizMSBlock,
  QuizTFBlock,
  QuizFillBlock,
  QuizEssayBlock,
  HeroBlock,
  CalloutBlock,
  KeyTakeawaysBlock,
  SectionHeaderBlock,
} from '@/types/lesson-blocks';
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
      case 'quiz_ms':
        if (!editedBlock.question.trim()) {
          newErrors.question = 'Vraag is verplicht';
        }
        editedBlock.options.forEach((opt, idx) => {
          if (!opt.trim()) {
            newErrors[`option_${idx}`] = `Optie ${String.fromCharCode(65 + idx)} is verplicht`;
          }
        });
        if (editedBlock.correct_answers.length === 0) {
          newErrors.correct_answers = 'Selecteer minstens één correct antwoord';
        }
        if (!editedBlock.explanation.trim()) {
          newErrors.explanation = 'Uitleg is verplicht';
        }
        break;
      case 'quiz_tf':
        if (!editedBlock.question.trim()) {
          newErrors.question = 'Vraag is verplicht';
        }
        if (!editedBlock.explanation.trim()) {
          newErrors.explanation = 'Uitleg is verplicht';
        }
        break;
      case 'quiz_fill':
        if (!editedBlock.question.trim()) {
          newErrors.question = 'Vraag is verplicht';
        }
        if (!editedBlock.correct_answer.trim()) {
          newErrors.correct_answer = 'Correct antwoord is verplicht';
        }
        if (!editedBlock.explanation.trim()) {
          newErrors.explanation = 'Uitleg is verplicht';
        }
        break;
      case 'quiz_essay':
        if (!editedBlock.question.trim()) {
          newErrors.question = 'Vraag is verplicht';
        }
        break;
      case 'hero':
        if (!editedBlock.title.trim()) {
          newErrors.title = 'Titel is verplicht';
        }
        break;
      case 'callout':
        if (!editedBlock.body.trim()) {
          newErrors.body = 'Inhoud is verplicht';
        }
        break;
      case 'key_takeaways':
        if (editedBlock.items.every(i => !i.trim())) {
          newErrors.items = 'Voeg minstens één punt toe';
        }
        break;
      case 'section_header':
        if (!editedBlock.title.trim()) {
          newErrors.title = 'Titel is verplicht';
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
            <QuizMCEditor
              block={editedBlock as QuizMCBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'quiz_ms' && (
            <QuizMSEditor
              block={editedBlock as QuizMSBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'quiz_tf' && (
            <QuizTFEditor
              block={editedBlock as QuizTFBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'quiz_fill' && (
            <QuizFillEditor
              block={editedBlock as QuizFillBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'quiz_essay' && (
            <QuizEssayEditor
              block={editedBlock as QuizEssayBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'hero' && (
            <HeroEditor
              block={editedBlock as HeroBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'callout' && (
            <CalloutEditor
              block={editedBlock as CalloutBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'key_takeaways' && (
            <KeyTakeawaysEditor
              block={editedBlock as KeyTakeawaysBlock}
              errors={errors}
              onChange={(updates) => setEditedBlock({ ...editedBlock, ...updates })}
            />
          )}

          {editedBlock.type === 'section_header' && (
            <SectionHeaderEditor
              block={editedBlock as SectionHeaderBlock}
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

// Quiz Multiple Choice Editor
function QuizMCEditor({
  block,
  errors,
  onChange,
}: {
  block: QuizMCBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<QuizMCBlock>) => void;
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
          Vraag <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="question"
          placeholder="Wat is...?"
          value={block.question}
          onChange={(e) => onChange({ question: e.target.value })}
          rows={3}
        />
        {errors.question && (
          <p className="text-sm text-destructive">{errors.question}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>
          Antwoordopties <span className="text-destructive">*</span>
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
          Uitleg <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="explanation"
          placeholder="Leg uit waarom dit het correcte antwoord is..."
          value={block.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
          rows={3}
        />
        {errors.explanation && (
          <p className="text-sm text-destructive">{errors.explanation}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="points">Punten</Label>
          <Input
            id="points"
            type="number"
            min="1"
            value={block.points}
            onChange={(e) => onChange({ points: parseInt(e.target.value) || 10 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Max Pogingen</Label>
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

// Quiz Multiple Select Editor
function QuizMSEditor({
  block,
  errors,
  onChange,
}: {
  block: QuizMSBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<QuizMSBlock>) => void;
}) {
  const optionLabels = ['Option A', 'Option B', 'Option C', 'Option D'];

  const updateOption = (index: number, value: string) => {
    const newOptions = [...block.options] as [string, string, string, string];
    newOptions[index] = value;
    onChange({ options: newOptions });
  };

  const toggleCorrectAnswer = (index: number) => {
    const current = block.correct_answers;
    if (current.includes(index)) {
      onChange({ correct_answers: current.filter((i) => i !== index) });
    } else {
      onChange({ correct_answers: [...current, index].sort() });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">
          Vraag <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="question"
          placeholder="Welke van de volgende zijn...?"
          value={block.question}
          onChange={(e) => onChange({ question: e.target.value })}
          rows={3}
        />
        {errors.question && (
          <p className="text-sm text-destructive">{errors.question}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Meerdere antwoorden kunnen correct zijn.
        </p>
      </div>

      <div className="space-y-3">
        <Label>
          Antwoordopties <span className="text-destructive">*</span>
        </Label>
        {errors.correct_answers && (
          <p className="text-sm text-destructive">{errors.correct_answers}</p>
        )}
        {block.options.map((option, index) => (
          <div key={index} className="rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id={`option-${index}`}
                checked={block.correct_answers.includes(index)}
                onCheckedChange={() => toggleCorrectAnswer(index)}
              />
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">
          Uitleg <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="explanation"
          placeholder="Leg uit waarom deze antwoorden correct zijn..."
          value={block.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
          rows={3}
        />
        {errors.explanation && (
          <p className="text-sm text-destructive">{errors.explanation}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="points">Punten</Label>
          <Input
            id="points"
            type="number"
            min="1"
            value={block.points}
            onChange={(e) => onChange({ points: parseInt(e.target.value) || 10 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Max Pogingen</Label>
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

// Quiz True/False Editor
function QuizTFEditor({
  block,
  errors,
  onChange,
}: {
  block: QuizTFBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<QuizTFBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">
          Stelling <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="question"
          placeholder="[Stelling die waar of onwaar is]"
          value={block.question}
          onChange={(e) => onChange({ question: e.target.value })}
          rows={3}
        />
        {errors.question && (
          <p className="text-sm text-destructive">{errors.question}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Correct Antwoord</Label>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={block.correct_answer === true ? 'default' : 'outline'}
            onClick={() => onChange({ correct_answer: true })}
            className="flex-1"
          >
            ✓ Waar
          </Button>
          <Button
            type="button"
            variant={block.correct_answer === false ? 'default' : 'outline'}
            onClick={() => onChange({ correct_answer: false })}
            className="flex-1"
          >
            ✗ Onwaar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">
          Uitleg <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="explanation"
          placeholder="Leg uit waarom de stelling waar/onwaar is..."
          value={block.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
          rows={3}
        />
        {errors.explanation && (
          <p className="text-sm text-destructive">{errors.explanation}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="points">Punten</Label>
          <Input
            id="points"
            type="number"
            min="1"
            value={block.points}
            onChange={(e) => onChange({ points: parseInt(e.target.value) || 10 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Max Pogingen</Label>
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

// Quiz Fill-in-the-blank Editor
function QuizFillEditor({
  block,
  errors,
  onChange,
}: {
  block: QuizFillBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<QuizFillBlock>) => void;
}) {
  const [variationsText, setVariationsText] = useState(block.accept_variations.join('\n'));

  useEffect(() => {
    setVariationsText(block.accept_variations.join('\n'));
  }, [block.accept_variations]);

  const handleVariationsChange = (text: string) => {
    setVariationsText(text);
    const variations = text.split('\n').map((v) => v.trim()).filter(Boolean);
    onChange({ accept_variations: variations });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">
          Vraag <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="question"
          placeholder="Vul het ontbrekende woord in: De hoofdstad van Nederland is _____."
          value={block.question}
          onChange={(e) => onChange({ question: e.target.value })}
          rows={3}
        />
        {errors.question && (
          <p className="text-sm text-destructive">{errors.question}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Gebruik _____ om aan te geven waar het antwoord moet komen.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="correct_answer">
          Correct Antwoord <span className="text-destructive">*</span>
        </Label>
        <Input
          id="correct_answer"
          placeholder="Amsterdam"
          value={block.correct_answer}
          onChange={(e) => onChange({ correct_answer: e.target.value })}
        />
        {errors.correct_answer && (
          <p className="text-sm text-destructive">{errors.correct_answer}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="variations">Accepteer ook (optioneel)</Label>
        <Textarea
          id="variations"
          placeholder="Alternatieve correcte antwoorden, één per regel"
          value={variationsText}
          onChange={(e) => handleVariationsChange(e.target.value)}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Voeg alternatieve spellingen of synoniemen toe, één per regel.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="caseSensitive"
          checked={block.case_sensitive}
          onCheckedChange={(checked) => onChange({ case_sensitive: checked })}
        />
        <Label htmlFor="caseSensitive" className="text-sm font-normal cursor-pointer">
          Hoofdlettergevoelig
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder tekst</Label>
        <Input
          id="placeholder"
          placeholder="Vul hier je antwoord in..."
          value={block.placeholder}
          onChange={(e) => onChange({ placeholder: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">
          Uitleg <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="explanation"
          placeholder="Leg uit waarom dit het correcte antwoord is..."
          value={block.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
          rows={3}
        />
        {errors.explanation && (
          <p className="text-sm text-destructive">{errors.explanation}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="points">Punten</Label>
          <Input
            id="points"
            type="number"
            min="1"
            value={block.points}
            onChange={(e) => onChange({ points: parseInt(e.target.value) || 10 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Max Pogingen</Label>
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

// Quiz Essay Editor
function QuizEssayEditor({
  block,
  errors,
  onChange,
}: {
  block: QuizEssayBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<QuizEssayBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">
          Vraag <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="question"
          placeholder="Beschrijf in je eigen woorden..."
          value={block.question}
          onChange={(e) => onChange({ question: e.target.value })}
          rows={3}
        />
        {errors.question && (
          <p className="text-sm text-destructive">{errors.question}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Essay vragen worden handmatig beoordeeld.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minWords">Minimum woorden (optioneel)</Label>
          <Input
            id="minWords"
            type="number"
            min="0"
            placeholder="Geen minimum"
            value={block.min_words || ''}
            onChange={(e) => onChange({ min_words: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxWords">Maximum woorden (optioneel)</Label>
          <Input
            id="maxWords"
            type="number"
            min="0"
            placeholder="Geen maximum"
            value={block.max_words || ''}
            onChange={(e) => onChange({ max_words: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder tekst</Label>
        <Input
          id="placeholder"
          placeholder="Schrijf hier je antwoord..."
          value={block.placeholder}
          onChange={(e) => onChange({ placeholder: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Punten</Label>
        <Input
          id="points"
          type="number"
          min="1"
          value={block.points}
          onChange={(e) => onChange({ points: parseInt(e.target.value) || 20 })}
        />
        <p className="text-xs text-muted-foreground">
          Punten worden toegekend na handmatige beoordeling.
        </p>
      </div>
    </div>
  );
}

// Hero Block Editor
function HeroEditor({
  block,
  errors,
  onChange,
}: {
  block: HeroBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<HeroBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titel <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          placeholder="Welkom bij deze les"
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitel (optioneel)</Label>
        <Input
          id="subtitle"
          placeholder="Een korte introductiezin..."
          value={block.subtitle || ''}
          onChange={(e) => onChange({ subtitle: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}

// Callout Block Editor
function CalloutEditor({
  block,
  errors,
  onChange,
}: {
  block: CalloutBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<CalloutBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Variant</Label>
        <div className="flex gap-2">
          {(['green', 'blue', 'yellow'] as const).map((v) => (
            <Button
              key={v}
              type="button"
              variant={block.variant === v ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ variant: v })}
            >
              {v === 'green' ? '🟢 Tip' : v === 'blue' ? '🔵 Info' : '🟡 Waarschuwing'}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ctitle">Titel (optioneel)</Label>
        <Input
          id="ctitle"
          placeholder="Let op!"
          value={block.title || ''}
          onChange={(e) => onChange({ title: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Inhoud <span className="text-destructive">*</span></Label>
        <Textarea
          id="body"
          placeholder="De inhoud van de callout..."
          value={block.body}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={3}
        />
        {errors.body && <p className="text-sm text-destructive">{errors.body}</p>}
      </div>
    </div>
  );
}

// Key Takeaways Block Editor
function KeyTakeawaysEditor({
  block,
  errors,
  onChange,
}: {
  block: KeyTakeawaysBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<KeyTakeawaysBlock>) => void;
}) {
  const updateItem = (idx: number, value: string) => {
    const newItems = [...block.items];
    newItems[idx] = value;
    onChange({ items: newItems });
  };
  const addItem = () => onChange({ items: [...block.items, ''] });
  const removeItem = (idx: number) => onChange({ items: block.items.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Kernpunten <span className="text-destructive">*</span></Label>
        {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}
        <div className="space-y-2">
          {block.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm w-4">{idx + 1}.</span>
              <Input
                placeholder={`Kernpunt ${idx + 1}`}
                value={item}
                onChange={(e) => updateItem(idx, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(idx)}
                disabled={block.items.length <= 1}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          + Punt toevoegen
        </Button>
      </div>
    </div>
  );
}

// Section Header Block Editor
function SectionHeaderEditor({
  block,
  errors,
  onChange,
}: {
  block: SectionHeaderBlock;
  errors: Record<string, string>;
  onChange: (updates: Partial<SectionHeaderBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shtitle">Sectietitel <span className="text-destructive">*</span></Label>
        <Input
          id="shtitle"
          placeholder="Deel 1: Inleiding"
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="shsubtitle">Ondertitel (optioneel)</Label>
        <Input
          id="shsubtitle"
          placeholder="Een korte beschrijving van dit onderdeel..."
          value={block.subtitle || ''}
          onChange={(e) => onChange({ subtitle: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
