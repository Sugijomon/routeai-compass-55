import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { QuestionRenderer } from '@/components/learning';
import type { QuestionType, QuestionConfig, QuestionAnswer, LearningQuestion } from '@/types/learning';
import type { Json } from '@/integrations/supabase/types';

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: 'Meerkeuze (1 antwoord)',
  multiple_select: 'Meerkeuze (meerdere antwoorden)',
  true_false: 'Waar/Onwaar',
  fill_in: 'Invulvraag',
  essay: 'Open vraag',
};

export default function QuestionEditor() {
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!questionId;
  const prefilledLessonId = searchParams.get('lessonId') || '';

  // Form state
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(1);
  const [isRequired, setIsRequired] = useState(true);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(prefilledLessonId);
  
  // Type-specific config state
  const [mcOptions, setMcOptions] = useState([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' },
  ]);
  const [correctMcAnswer, setCorrectMcAnswer] = useState('a');
  const [correctMsAnswers, setCorrectMsAnswers] = useState<string[]>([]);
  const [correctTfAnswer, setCorrectTfAnswer] = useState(true);
  const [fillInAnswer, setFillInAnswer] = useState('');
  const [fillInCaseSensitive, setFillInCaseSensitive] = useState(false);
  const [essayMinWords, setEssayMinWords] = useState<number | undefined>();
  const [essayMaxWords, setEssayMaxWords] = useState<number | undefined>();

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewAnswer, setPreviewAnswer] = useState<QuestionAnswer | undefined>();

  // Fetch lessons for dropdown
  const { data: lessons } = useQuery({
    queryKey: ['lessons-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing question if editing
  const { data: existingQuestion, isLoading: loadingQuestion } = useQuery({
    queryKey: ['question', questionId],
    queryFn: async () => {
      if (!questionId) return null;
      const { data, error } = await supabase
        .from('learning_questions')
        .select('*')
        .eq('id', questionId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingQuestion) {
      setQuestionType(existingQuestion.question_type as QuestionType);
      setQuestionText(existingQuestion.question_text);
      setExplanation(existingQuestion.explanation || '');
      setPoints(existingQuestion.points || 1);
      setIsRequired(existingQuestion.is_required ?? true);
      setSelectedLessonId(existingQuestion.lesson_id || '');

      const config = existingQuestion.question_config as Record<string, unknown>;
      const answer = existingQuestion.correct_answer as Record<string, unknown>;

      if (existingQuestion.question_type === 'multiple_choice' || existingQuestion.question_type === 'multiple_select') {
        if (config.options) {
          setMcOptions(config.options as { id: string; text: string }[]);
        }
        if (existingQuestion.question_type === 'multiple_choice') {
          setCorrectMcAnswer((answer.selected as string) || 'a');
        } else {
          setCorrectMsAnswers((answer.selected as string[]) || []);
        }
      } else if (existingQuestion.question_type === 'true_false') {
        setCorrectTfAnswer((answer.selected as boolean) ?? true);
      } else if (existingQuestion.question_type === 'fill_in') {
        setFillInAnswer((answer.text as string) || '');
        setFillInCaseSensitive((config.case_sensitive as boolean) ?? false);
      } else if (existingQuestion.question_type === 'essay') {
        setEssayMinWords(config.min_words as number | undefined);
        setEssayMaxWords(config.max_words as number | undefined);
      }
    }
  }, [existingQuestion]);

  // Build question config based on type (as JSON-compatible object)
  const buildConfig = (): Json => {
    switch (questionType) {
      case 'multiple_choice':
      case 'multiple_select':
        return { options: mcOptions.filter(o => o.text.trim()) } as unknown as Json;
      case 'true_false':
        return {} as Json;
      case 'fill_in':
        return { case_sensitive: fillInCaseSensitive } as unknown as Json;
      case 'essay':
        return { 
          min_words: essayMinWords, 
          max_words: essayMaxWords 
        } as unknown as Json;
      default:
        return {} as Json;
    }
  };

  // Build correct answer based on type (as JSON-compatible object)
  const buildCorrectAnswer = (): Json => {
    switch (questionType) {
      case 'multiple_choice':
        return { selected: correctMcAnswer } as unknown as Json;
      case 'multiple_select':
        return { selected: correctMsAnswers } as unknown as Json;
      case 'true_false':
        return { selected: correctTfAnswer } as unknown as Json;
      case 'fill_in':
        return { text: fillInAnswer } as unknown as Json;
      case 'essay':
        return { text: '' } as unknown as Json; // Essays don't have a "correct" answer
      default:
        return { selected: '' } as unknown as Json;
    }
  };

  // Build preview question object
  const buildPreviewQuestion = (): LearningQuestion => ({
    id: questionId || 'preview',
    lesson_id: selectedLessonId,
    question_type: questionType,
    question_text: questionText,
    question_config: buildConfig() as unknown as QuestionConfig,
    correct_answer: buildCorrectAnswer() as unknown as QuestionAnswer,
    points,
    explanation: explanation || undefined,
    order_index: 0,
    is_required: isRequired,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const questionData = {
        lesson_id: selectedLessonId || null,
        question_type: questionType,
        question_text: questionText,
        question_config: buildConfig(),
        correct_answer: buildCorrectAnswer(),
        points,
        explanation: explanation || null,
        is_required: isRequired,
        created_by: user?.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('learning_questions')
          .update(questionData)
          .eq('id', questionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('learning_questions')
          .insert(questionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-questions'] });
      queryClient.invalidateQueries({ queryKey: ['content-editor-stats'] });
      toast.success(isEditing ? 'Vraag bijgewerkt!' : 'Vraag aangemaakt!');
      navigate('/editor');
    },
    onError: (error) => {
      toast.error('Fout bij opslaan: ' + (error as Error).message);
    },
  });

  const handleSave = () => {
    if (!questionText.trim()) {
      toast.error('Voer een vraagtekst in');
      return;
    }
    saveMutation.mutate();
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...mcOptions];
    newOptions[index].text = text;
    setMcOptions(newOptions);
  };

  const toggleMsAnswer = (optionId: string) => {
    setCorrectMsAnswers(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  if (isEditing && loadingQuestion) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/editor')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Vraag Bewerken' : 'Nieuwe Vraag'}
              </h1>
              <p className="text-muted-foreground">
                Maak of bewerk een vraag voor een les
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? 'Verberg Preview' : 'Preview'}
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Basis Instellingen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson">Les (optioneel)</Label>
                  <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een les..." />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons?.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Vraagtype</Label>
                  <Select 
                    value={questionType} 
                    onValueChange={(val) => setQuestionType(val as QuestionType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(questionTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question">Vraagtekst</Label>
                  <Textarea
                    id="question"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Stel hier je vraag..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="points">Punten</Label>
                    <Input
                      id="points"
                      type="number"
                      min={1}
                      value={points}
                      onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <Switch
                      id="required"
                      checked={isRequired}
                      onCheckedChange={setIsRequired}
                    />
                    <Label htmlFor="required">Verplicht</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Type-specific Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Antwoordopties</CardTitle>
                <CardDescription>
                  Configureer de antwoorden voor dit vraagtype
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Multiple Choice Options */}
                {(questionType === 'multiple_choice' || questionType === 'multiple_select') && (
                  <div className="space-y-3">
                    {mcOptions.map((option, index) => (
                      <div key={option.id} className="flex items-center gap-3">
                        {questionType === 'multiple_choice' ? (
                          <input
                            type="radio"
                            name="correct"
                            checked={correctMcAnswer === option.id}
                            onChange={() => setCorrectMcAnswer(option.id)}
                            className="h-4 w-4"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={correctMsAnswers.includes(option.id)}
                            onChange={() => toggleMsAnswer(option.id)}
                            className="h-4 w-4"
                          />
                        )}
                        <span className="font-medium w-6">
                          {option.id.toUpperCase()}.
                        </span>
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Optie ${option.id.toUpperCase()}`}
                        />
                      </div>
                    ))}
                    <p className="text-sm text-muted-foreground">
                      {questionType === 'multiple_choice' 
                        ? 'Selecteer het juiste antwoord' 
                        : 'Selecteer alle juiste antwoorden'}
                    </p>
                  </div>
                )}

                {/* True/False Options */}
                {questionType === 'true_false' && (
                  <div className="space-y-3">
                    <Label>Juiste antwoord</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={correctTfAnswer === true}
                          onChange={() => setCorrectTfAnswer(true)}
                          className="h-4 w-4"
                        />
                        Waar
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={correctTfAnswer === false}
                          onChange={() => setCorrectTfAnswer(false)}
                          className="h-4 w-4"
                        />
                        Onwaar
                      </label>
                    </div>
                  </div>
                )}

                {/* Fill-in Options */}
                {questionType === 'fill_in' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fillAnswer">Juiste antwoord</Label>
                      <Input
                        id="fillAnswer"
                        value={fillInAnswer}
                        onChange={(e) => setFillInAnswer(e.target.value)}
                        placeholder="Het correcte antwoord..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="caseSensitive"
                        checked={fillInCaseSensitive}
                        onCheckedChange={setFillInCaseSensitive}
                      />
                      <Label htmlFor="caseSensitive">Hoofdlettergevoelig</Label>
                    </div>
                  </div>
                )}

                {/* Essay Options */}
                {questionType === 'essay' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Open vragen worden handmatig beoordeeld.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minWords">Minimum woorden</Label>
                        <Input
                          id="minWords"
                          type="number"
                          min={0}
                          value={essayMinWords || ''}
                          onChange={(e) => setEssayMinWords(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Optioneel"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxWords">Maximum woorden</Label>
                        <Input
                          id="maxWords"
                          type="number"
                          min={0}
                          value={essayMaxWords || ''}
                          onChange={(e) => setEssayMaxWords(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Optioneel"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Explanation */}
            <Card>
              <CardHeader>
                <CardTitle>Uitleg</CardTitle>
                <CardDescription>
                  Wordt getoond na het beantwoorden van de vraag
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Leg uit waarom dit het juiste antwoord is..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    Zo ziet de vraag eruit voor gebruikers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {questionText ? (
                    <QuestionRenderer
                      question={buildPreviewQuestion()}
                      userAnswer={previewAnswer}
                      onAnswer={setPreviewAnswer}
                      showFeedback={false}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      Voer een vraagtekst in om de preview te zien
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
