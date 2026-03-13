import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { BlockList } from '@/components/admin/lesson-editor/BlockList';
import { AddBlockDropdown } from '@/components/admin/lesson-editor/AddBlockDropdown';
import { BlockEditorDialog } from '@/components/admin/lesson-editor/BlockEditorDialog';
import { LessonMetadataPanel } from '@/components/admin/lesson-editor/LessonMetadataPanel';
import { SaveIndicator } from '@/components/admin/lesson-editor/SaveIndicator';
import { useLessonEditor } from '@/hooks/useLessonEditor';
import { useDashboardRedirect } from '@/hooks/useDashboardRedirect';
import type { Tables } from '@/integrations/supabase/types';
import type { LessonBlock, BlockType } from '@/types/lesson-blocks';

type Lesson = Tables<'lessons'>;

export default function AdminLessonEdit() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const dashboardUrl = useDashboardRedirect();
  const [editingBlock, setEditingBlock] = useState<LessonBlock | null>(null);

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

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Les bewerken"
        breadcrumbs={[
          { label: 'Admin', href: dashboardUrl.path },
          { label: 'Lessen', href: '/admin/lessons' },
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
          { label: 'Admin', href: dashboardUrl.path },
          { label: 'Lessen', href: '/admin/lessons' },
          { label: 'Fout' },
        ]}
      >
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Les niet gevonden of er is een fout opgetreden.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/admin/lessons">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar lessen
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
        { label: 'Admin', href: dashboardUrl.path },
        { label: 'Lessen', href: '/admin/lessons' },
        { label: editor.title || 'Bewerken' },
      ]}
      actions={
        <div className="flex items-center gap-4">
          <SaveIndicator isSaving={editor.isSaving} lastSaved={editor.lastSaved} />
          <Button variant="outline" asChild>
            <Link to="/admin/lessons">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        {/* Main Content - Block Editor */}
        <div className="space-y-4">
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
        </div>

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
    </AdminPageLayout>
  );
}
