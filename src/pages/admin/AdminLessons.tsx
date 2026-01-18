import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, BookOpen, Clock, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CreateLessonDialog } from '@/components/admin/CreateLessonDialog';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import type { Tables } from '@/integrations/supabase/types';

type Lesson = Tables<'lessons'>;

export default function AdminLessons() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);

  // Fetch all lessons (admin sees all, including unpublished)
  const { data: lessons, isLoading, error } = useQuery({
    queryKey: ['admin-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Lesson[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      toast.success('Les verwijderd');
      setDeleteLesson(null);
    },
    onError: (error) => {
      toast.error('Fout bij verwijderen: ' + error.message);
    },
  });

  const handleEdit = (lessonId: string) => {
    navigate(`/admin/lessons/${lessonId}/edit`);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}u ${mins}m` : `${hours}u`;
  };

  if (error) {
    return (
      <AdminPageLayout
        title="Lessen"
        breadcrumbs={[
          { label: 'Admin', href: '/admin-dashboard' },
          { label: 'Lessen' },
        ]}
      >
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          Fout bij laden: {error.message}
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Lessen"
      breadcrumbs={[
        { label: 'Admin', href: '/admin-dashboard' },
        { label: 'Lessen' },
      ]}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Les
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : lessons && lessons.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Titel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duur</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lesson.lesson_type === 'standalone' ? 'secondary' : 'outline'}>
                      {lesson.lesson_type === 'standalone' ? 'Standalone' : 'Course Module'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDuration(lesson.estimated_duration)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lesson.is_published ? 'default' : 'secondary'}>
                      {lesson.is_published ? 'Gepubliceerd' : 'Concept'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(lesson.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteLesson(lesson)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Geen lessen gevonden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Maak je eerste les aan om te beginnen.
          </p>
          <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Les
          </Button>
        </div>
      )}

      {/* Create Lesson Dialog */}
      <CreateLessonDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteLesson} onOpenChange={() => setDeleteLesson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Les verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je "{deleteLesson?.title}" wilt verwijderen? 
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLesson && deleteMutation.mutate(deleteLesson.id)}
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
