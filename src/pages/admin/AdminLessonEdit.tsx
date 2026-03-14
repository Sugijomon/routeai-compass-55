import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Edit, Trash2, HelpCircle, ChevronUp, ChevronDown, GripVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { BlockList } from '@/components/admin/lesson-editor/BlockList';
import { AddBlockDropdown } from '@/components/admin/lesson-editor/AddBlockDropdown';
import { BlockEditorDialog } from '@/components/admin/lesson-editor/BlockEditorDialog';
import { LessonMetadataPanel } from '@/components/admin/lesson-editor/LessonMetadataPanel';
import { SaveIndicator } from '@/components/admin/lesson-editor/SaveIndicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLessonEditor } from '@/hooks/useLessonEditor';
import { useDashboardRedirect } from '@/hooks/useDashboardRedirect';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import type { LessonBlock, BlockType } from '@/types/lesson-blocks';

type Lesson = Tables<'lessons'>;

const questionTypeLabels: Record<string, string> = {
  multiple_choice: 'Meerkeuze',
  multiple_select: 'Multi-select',
  true_false: 'Waar/Onwaar',
  fill_in: 'Invulvraag',
  essay: 'Open vraag',
};

export default function AdminLessonEdit() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const dashboardUrl = useDashboardRedirect();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingBlock, setEditingBlock] = useState<LessonBlock | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [deleteTopicIndex, setDeleteTopicIndex] = useState<number | null>(null);
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(null);

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      if (!lessonId) throw new Error('No lesson ID');
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();
      if (error) throw error;
      return data as Lesson | null;
    },
    enabled: !!lessonId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['lesson-questions', lessonId],
    queryFn: async () => {
      if (!lessonId) return [];
      const { data, error } = await supabase
        .from('learning_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });

  const editor = useLessonEditor({ lesson });

  // Ensure activeTopicIndex is valid
  const safeActiveIndex = Math.min(activeTopicIndex, Math.max(0, editor.topics.length - 1));
  const activeTopic = editor.topics[safeActiveIndex];

  const handleAddBlock = (type: BlockType) => {
    const targetTopicId = activeTopic?.id;
    if (!targetTopicId) {
      // Create a topic first
      const newTopic = editor.addTopic();
      setActiveTopicIndex(editor.topics.length); // will be 0 after first add
      const newBlock = editor.addBlock(type, newTopic.id);
      setEditingBlock(newBlock);
      return;
    }
    const newBlock = editor.addBlock(type, targetTopicId);
    setEditingBlock(newBlock);
  };

  const handleEditBlock = (block: LessonBlock) => {
    setEditingBlock(block);
  };

  const handleSaveBlock = (updatedBlock: LessonBlock) => {
    editor.updateBlock(updatedBlock.id, updatedBlock);
    setEditingBlock(null);
  };

  const handleAddTopic = () => {
    const newTopic = editor.addTopic();
    setActiveTopicIndex(editor.topics.length - 1);
    // Start editing title immediately
    setEditingTopicIndex(editor.topics.length - 1);
  };

  const handleDeleteTopic = () => {
    if (deleteTopicIndex === null) return;
    const topic = editor.topics[deleteTopicIndex];
    if (topic) {
      editor.deleteTopic(topic.id);
      setActiveTopicIndex(Math.max(0, safeActiveIndex - 1));
    }
    setDeleteTopicIndex(null);
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestionId) return;
    try {
      const { error } = await supabase
        .from('learning_questions')
        .delete()
        .eq('id', deleteQuestionId);
      if (error) throw error;
      toast.success('Vraag verwijderd');
      queryClient.invalidateQueries({ queryKey: ['lesson-questions', lessonId] });
    } catch (err) {
      console.error(err);
      toast.error('Kon vraag niet verwijderen');
    } finally {
      setDeleteQuestionId(null);
    }
  };

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Les bewerken"
        breadcrumbs={[
          { label: 'Content Editor', href: '/editor/cursussen' },
          { label: 'Lessen', href: '/editor/cursussen' },
          { label: 'Laden...' },
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminPageLayout>
    );
  }

  if (error || !lesson) {
    return (
      <AdminPageLayout
        title="Les niet gevonden"
        breadcrumbs={[
          { label: 'Content Editor', href: '/editor/cursussen' },
          { label: 'Lessen', href: '/editor/cursussen' },
          { label: 'Fout' },
        ]}
      >
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Les niet gevonden of er is een fout opgetreden.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/editor/cursussen">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar cursussen
            </Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Les Bewerken"
      breadcrumbs={[
        { label: 'Content Editor', href: '/editor/cursussen' },
        { label: 'Lessen', href: '/editor/cursussen' },
        { label: editor.title || 'Bewerken' },
      ]}
      actions={
        <div className="flex items-center gap-4">
          <SaveIndicator isSaving={editor.isSaving} lastSaved={editor.lastSaved} />
          <Button variant="outline" asChild>
            <Link to="/editor/cursussen">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        {/* Main Content */}
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Lesinhoud</TabsTrigger>
            <TabsTrigger value="questions">
              Vragen
              {questions && questions.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                  {questions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Topics + Block Editor Tab */}
          <TabsContent value="content">
            <div className="grid gap-4 grid-cols-[240px,1fr]">
              {/* LEFT: Topic list */}
              <div className="rounded-lg border bg-card p-3 space-y-3 self-start">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Onderwerpen</h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddTopic} title="Nieuw onderwerp">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {editor.topics.length === 0 ? (
                  <div className="rounded border border-dashed p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-2">Nog geen onderwerpen.</p>
                    <Button variant="outline" size="sm" onClick={handleAddTopic}>
                      <Plus className="mr-1 h-3 w-3" />
                      Eerste onderwerp
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {editor.topics.map((topic, index) => (
                      <div
                        key={topic.id}
                        className={cn(
                          'group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors',
                          index === safeActiveIndex
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-foreground'
                        )}
                        onClick={() => {
                          setActiveTopicIndex(index);
                          setEditingTopicIndex(null);
                        }}
                      >
                        {/* Reorder buttons */}
                        <div className="flex flex-col shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); editor.moveTopicUp(topic.id); if (index === safeActiveIndex && index > 0) setActiveTopicIndex(index - 1); }}
                            disabled={index === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0 leading-none"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); editor.moveTopicDown(topic.id); if (index === safeActiveIndex && index < editor.topics.length - 1) setActiveTopicIndex(index + 1); }}
                            disabled={index === editor.topics.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0 leading-none"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Title */}
                        {editingTopicIndex === index ? (
                          <Input
                            autoFocus
                            defaultValue={topic.title}
                            className="h-6 text-xs px-1.5"
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val) editor.updateTopicTitle(topic.id, val);
                              setEditingTopicIndex(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) editor.updateTopicTitle(topic.id, val);
                                setEditingTopicIndex(null);
                              }
                              if (e.key === 'Escape') setEditingTopicIndex(null);
                            }}
                          />
                        ) : (
                          <span className="truncate flex-1 min-w-0">{topic.title}</span>
                        )}

                        {/* Block count */}
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">
                          {topic.blocks.length}
                        </Badge>

                        {/* Actions */}
                        <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingTopicIndex(index); }}
                            className="text-muted-foreground hover:text-foreground p-0.5"
                            title="Hernoemen"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (topic.blocks.length > 0) {
                                setDeleteTopicIndex(index);
                              } else {
                                editor.deleteTopic(topic.id);
                                setActiveTopicIndex(Math.max(0, safeActiveIndex - 1));
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                            title="Verwijderen"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Blocks for active topic */}
              <div className="rounded-lg border bg-card p-4">
                {activeTopic ? (
                  <>
                    {/* Topic title header */}
                    <div className="mb-4">
                      <Input
                        value={activeTopic.title}
                        onChange={(e) => editor.updateTopicTitle(activeTopic.id, e.target.value)}
                        className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0 h-auto"
                        placeholder="Onderwerpnaam..."
                      />
                    </div>

                    {/* Block list */}
                    <BlockList
                      blocks={activeTopic.blocks}
                      onEdit={handleEditBlock}
                      onDelete={editor.deleteBlock}
                      onMoveUp={editor.moveBlockUp}
                      onMoveDown={editor.moveBlockDown}
                    />

                    {/* Add block */}
                    <div className="mt-4">
                      <AddBlockDropdown onAddBlock={handleAddBlock} />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-3">Maak een onderwerp aan om blokken toe te voegen.</p>
                    <Button variant="outline" onClick={handleAddTopic}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nieuw onderwerp
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Vragen voor deze les</h3>
                <Button
                  size="sm"
                  onClick={() => navigate(`/editor/questions/new?lessonId=${lessonId}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe vraag
                </Button>
              </div>

              {questionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : questions && questions.length > 0 ? (
                <div className="space-y-2">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-sm font-medium line-clamp-1">{q.question_text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {questionTypeLabels[q.question_type] || q.question_type}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {q.points} {q.points === 1 ? 'punt' : 'punten'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/editor/questions/${q.id}/edit`)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteQuestionId(q.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={HelpCircle}
                  title="Nog geen vragen voor deze les"
                  description="Voeg vragen toe om de kennis van gebruikers te toetsen."
                  action={{
                    label: 'Nieuwe vraag',
                    onClick: () => navigate(`/editor/questions/new?lessonId=${lessonId}`),
                  }}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Sidebar - Metadata Panel */}
        <div className="space-y-4">
          <LessonMetadataPanel
            lessonId={lessonId}
            title={editor.title}
            description={editor.description}
            lessonType={editor.lessonType}
            estimatedDuration={editor.estimatedDuration}
            passingScore={editor.passingScore}
            isPublished={editor.isPublished}
            onTitleChange={editor.setTitle}
            onDescriptionChange={editor.setDescription}
            onLessonTypeChange={editor.setLessonType}
            onDurationChange={editor.setEstimatedDuration}
            onPassingScoreChange={editor.setPassingScore}
            onPublishedChange={editor.setIsPublished}
          />
        </div>
      </div>

      {/* Block Editor Dialog */}
      <BlockEditorDialog
        block={editingBlock}
        open={!!editingBlock}
        onOpenChange={(open) => !open && setEditingBlock(null)}
        onSave={handleSaveBlock}
      />

      {/* Delete Topic Confirmation */}
      <AlertDialog open={deleteTopicIndex !== null} onOpenChange={() => setDeleteTopicIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Onderwerp verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dit onderwerp bevat {deleteTopicIndex !== null ? editor.topics[deleteTopicIndex]?.blocks.length : 0} blok(ken). Alles wordt permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTopic} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Confirmation */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vraag verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden. De vraag en bijbehorende antwoorden worden permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
}
