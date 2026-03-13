import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Edit, Trash2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  // Fetch questions for this lesson
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

  const handleAddBlock = (type: BlockType) => {
    const newBlock = editor.addBlock(type);
    setEditingBlock(newBlock);
  };

  const handleEditBlock = (block: LessonBlock) => {
    setEditingBlock(block);
  };

  const handleSaveBlock = (updatedBlock: LessonBlock) => {
    editor.updateBlock(updatedBlock.id, updatedBlock);
    setEditingBlock(null);
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

          {/* Block Editor Tab */}
          <TabsContent value="content">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold mb-4">Lesinhoud</h3>
              <BlockList
                blocks={editor.blocks}
                onEdit={handleEditBlock}
                onDelete={editor.deleteBlock}
                onMoveUp={editor.moveBlockUp}
                onMoveDown={editor.moveBlockDown}
              />
              <div className="mt-4">
                <AddBlockDropdown onAddBlock={handleAddBlock} />
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
                        <p className="text-sm font-medium line-clamp-1">
                          {q.question_text}
                        </p>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/editor/questions/${q.id}/edit`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeleteQuestionId(q.id)}
                        >
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
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
}
