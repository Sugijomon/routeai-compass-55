import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

export default function ContentEditorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch courses with lesson counts
  const { data: courses, isLoading } = useQuery({
    queryKey: ['editor-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*, course_lessons(id)')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['editor-course-stats'],
    queryFn: async () => {
      const [coursesRes, lessonsRes] = await Promise.all([
        supabase.from('courses').select('id, is_published'),
        supabase.from('lessons').select('id'),
      ]);
      const allCourses = coursesRes.data || [];
      return {
        totalCourses: allCourses.length,
        totalLessons: lessonsRes.data?.length || 0,
        totalPublished: allCourses.filter((c) => c.is_published).length,
      };
    },
  });

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error('Titel is verplicht');
      return;
    }
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({ title: newTitle.trim(), description: newDescription.trim() || null })
        .select('id')
        .single();

      if (error) throw error;
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
      navigate(`/admin/courses/${data.id}/edit`);
    } catch (err) {
      console.error(err);
      toast.error('Kon cursus niet aanmaken');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      // Delete course_lessons first, then course
      await supabase.from('course_lessons').delete().eq('course_id', deleteId);
      const { error } = await supabase.from('courses').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Cursus verwijderd');
      queryClient.invalidateQueries({ queryKey: ['editor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['editor-course-stats'] });
    } catch (err) {
      console.error(err);
      toast.error('Kon cursus niet verwijderen');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Mijn Cursussen</h1>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe cursus
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Cursussen"
            value={statsLoading ? '-' : stats?.totalCourses || 0}
            icon={GraduationCap}
            isLoading={statsLoading}
          />
          <StatCard
            title="Lessen"
            value={statsLoading ? '-' : stats?.totalLessons || 0}
            icon={BookOpen}
            isLoading={statsLoading}
          />
          <StatCard
            title="Gepubliceerd"
            value={statsLoading ? '-' : stats?.totalPublished || 0}
            icon={CheckCircle}
            isLoading={statsLoading}
          />
        </div>

        {/* Course list */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const lessonCount = (course.course_lessons as any[])?.length ?? 0;
              return (
                <Card
                  key={course.id}
                  className="group relative overflow-hidden transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight line-clamp-2">
                        {course.title}
                      </h3>
                      <Badge
                        variant={course.is_published ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {course.is_published ? 'Gepubliceerd' : 'Concept'}
                      </Badge>
                    </div>

                    {course.description && (
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        {lessonCount} {lessonCount === 1 ? 'les' : 'lessen'}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                        >
                          Bewerken
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(course.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="Maak je eerste cursus aan"
            description="Cursussen bundelen lessen in een logische volgorde. Begin met het aanmaken van je eerste cursus."
            action={{
              label: 'Nieuwe cursus',
              onClick: () => setIsCreateOpen(true),
            }}
          />
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe cursus aanmaken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-title">Titel *</Label>
              <Input
                id="new-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="bijv. AI Rijbewijs Basiscursus"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-desc">Beschrijving</Label>
              <Textarea
                id="new-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Korte omschrijving van de cursus..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !newTitle.trim()}>
              {isCreating ? 'Aanmaken...' : 'Aanmaken & bewerken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cursus verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden. De cursus en alle koppelingen met lessen worden verwijderd. De lessen zelf blijven bestaan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
