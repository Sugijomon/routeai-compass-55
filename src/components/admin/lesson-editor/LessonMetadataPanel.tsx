import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LessonMetadataPanelProps {
  lessonId?: string;
  title: string;
  description: string;
  lessonType: string;
  estimatedDuration: number | null;
  passingScore: number;
  isPublished: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onLessonTypeChange: (type: string) => void;
  onDurationChange: (duration: number | null) => void;
  onPassingScoreChange: (score: number) => void;
  onPublishedChange: (published: boolean) => void;
}

export function LessonMetadataPanel({
  lessonId,
  title,
  description,
  lessonType,
  estimatedDuration,
  passingScore,
  isPublished,
  onTitleChange,
  onDescriptionChange,
  onLessonTypeChange,
  onDurationChange,
  onPassingScoreChange,
  onPublishedChange,
}: LessonMetadataPanelProps) {
  const [examConflict, setExamConflict] = useState(false);

  useEffect(() => {
    if (lessonType !== 'ai_literacy_exam') {
      setExamConflict(false);
      return;
    }
    const check = async () => {
      const { count } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('lesson_type', 'ai_literacy_exam')
        .eq('is_published', true)
        .neq('id', lessonId ?? '');
      setExamConflict((count ?? 0) > 0);
    };
    check();
  }, [lessonType, lessonId]);
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h3 className="font-semibold">Les Instellingen</h3>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Titel van de les"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Beschrijving</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Korte beschrijving..."
          rows={2}
        />
      </div>

      {/* Type and Duration row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lessonType">Type</Label>
          <Select value={lessonType} onValueChange={onLessonTypeChange}>
            <SelectTrigger id="lessonType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standalone">Standalone</SelectItem>
              <SelectItem value="course_module">Course Module</SelectItem>
              <SelectItem value="ai_literacy_exam">AI Literacy Examen</SelectItem>
            </SelectContent>
          </Select>
          {examConflict && (
            <Alert className="mt-2 border-orange-500/50 bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-xs text-orange-700">
                Let op: er bestaat al een gepubliceerd AI Literacy Examen. Als u dit examen ook publiceert, kan het systeem willekeurig één van beide tonen. Archiveer het oude examen eerst.
              </AlertDescription>
            </Alert>
          )}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duur (min)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            value={estimatedDuration ?? ''}
            onChange={(e) => onDurationChange(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="15"
          />
        </div>
      </div>

      {/* Passing Score */}
      <div className="space-y-2">
        <Label htmlFor="passingScore">Slaagpercentage (%)</Label>
        <Input
          id="passingScore"
          type="number"
          min={0}
          max={100}
          value={passingScore}
          onChange={(e) => onPassingScoreChange(parseInt(e.target.value) || 80)}
        />
      </div>

      {/* Publish Toggle */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="published" className="text-base">Gepubliceerd</Label>
            <p className="text-xs text-muted-foreground">
              Zichtbaar voor alle gebruikers
            </p>
          </div>
          <Switch
            id="published"
            checked={isPublished}
            onCheckedChange={onPublishedChange}
          />
        </div>

        {isPublished && (
          <Alert className="mt-3" variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Deze les is nu zichtbaar voor alle gebruikers.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
