import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, BookOpen, Clock, FileText, GraduationCap, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useDashboardRedirect } from '@/hooks/useDashboardRedirect';
import type { Tables } from '@/integrations/supabase/types';

type LessonWithCourses = Tables<'lessons'> & {
  course_lessons: Array<{
    course_id: string;
    sequence_order: number;
    courses: { id: string; title: string } | null;
  }>;
};

export default function AdminLessons() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dashboardUrl = useDashboardRedirect();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteLesson, setDeleteLesson] = useState<LessonWithCourses | null>(null);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  // Fetch all lessons with course linkages
  const { data: lessons, isLoading, error } = useQuery({
    queryKey: ['admin-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          course_lessons (
            course_id,
            sequence_order,
            courses ( id, title )
          )
        `)
        .order('title');

      if (error) throw error;
      return data as LessonWithCourses[];
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

  const uniqueCourses = useMemo(() => {
    const seen = new Map<string, string>();
    lessons?.forEach(l =>
      l.course_lessons?.forEach(cl => {
        if (cl.courses?.id) seen.set(cl.courses.id, cl.courses.title);
      })
    );
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [lessons]);

  const filtered = useMemo(() => {
    return lessons?.filter(l => {
      const matchSearch = !search ||
        l.title.toLowerCase().includes(search.toLowerCase());
      const matchCourse =
        courseFilter === 'all' ? true :
        courseFilter === 'none' ? (l.course_lessons?.length ?? 0) === 0 :
        l.course_lessons?.some(cl => cl.courses?.id === courseFilter);
      const matchStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'published' ? l.is_published === true :
        l.is_published === false;
      return matchSearch && matchCourse && matchStatus;
    }) ?? [];
  }, [lessons, search, courseFilter, statusFilter]);

  if (error) {
    return (
      <AdminPageLayout
        title="Lessen"
        breadcrumbs={[
          { label: 'Admin', href: dashboardUrl.path },
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
        { label: 'Admin', href: dashboardUrl.path },
        { label: 'Lessen' },
      ]}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Les
        </Button>
      }
    >
      {/* Filter controls */}
      <div className="flex gap-3 items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Zoek op lesnaam..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Alle cursussen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle cursussen</SelectItem>
            <SelectItem value="none">— Niet gekoppeld</SelectItem>
            {uniqueCourses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Alle statussen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="published">Gepubliceerd</SelectItem>
            <SelectItem value="concept">Concept</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Titel</TableHead>
                <TableHead>Gebruikt in</TableHead>
                <TableHead>Duur</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lesson) => (
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
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant={lesson.course_lessons?.length > 0 ? 'outline' : 'secondary'} className="text-[10px]">
                            {lesson.course_lessons?.length > 0 ? 'Cursusles' : 'Standalone'}
                          </Badge>
                          {lesson.lesson_type === 'ai_literacy_exam' && (
                            <Badge className="text-[10px] bg-blue-500/15 text-blue-700 border-blue-500/30 hover:bg-blue-500/20">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              Rijbewijs Examen
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lesson.course_lessons?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lesson.course_lessons.slice(0, 2).map((cl) => (
                          <Badge key={cl.course_id} variant="secondary" className="text-xs">
                            {cl.courses?.title}
                          </Badge>
                        ))}
                        {lesson.course_lessons.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lesson.course_lessons.length - 2} meer
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">— Niet gekoppeld</span>
                    )}
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
