import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;
type Lesson = Tables<'lessons'>;
type CourseLesson = Tables<'course_lessons'>;

interface CourseLessonWithDetails extends CourseLesson {
  lesson: Lesson;
}

export default function AdminCourseEdit() {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [isAddLessonsOpen, setIsAddLessonsOpen] = useState(false);
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_for_onboarding: false,
    unlocks_capability: '',
    passing_threshold: 80,
    is_published: false,
  });

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('No course ID');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });

  // Fetch course lessons with details
  const { data: courseLessons, refetch: refetchLessons } = useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*, lesson:lessons(*)')
        .eq('course_id', courseId)
        .order('sequence_order', { ascending: true });
      if (error) throw error;
      return (data || []).map((cl) => ({
        ...cl,
        lesson: cl.lesson as Lesson,
      })) as CourseLessonWithDetails[];
    },
    enabled: !!courseId,
  });

  // Fetch all lessons for selection modal
  const { data: allLessons } = useQuery({
    queryKey: ['all-lessons-for-course'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('title');
      if (error) throw error;
      return data as Lesson[];
    },
  });

  // Initialize form data from course
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description || '',
        required_for_onboarding: course.required_for_onboarding || false,
        unlocks_capability: course.unlocks_capability || '',
        passing_threshold: course.passing_threshold || 80,
        is_published: course.is_published || false,
      });
    }
  }, [course]);

  // Filter lessons not yet in course
  const lessonsNotInCourse = allLessons?.filter(
    (lesson) => !courseLessons?.some((cl) => cl.lesson_id === lesson.id)
  ) ?? [];

  // Save course metadata
  const handleSaveMetadata = async () => {
    if (!courseId || !formData.title.trim()) {
      toast.error('Titel is verplicht');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: formData.title,
          description: formData.description || null,
          required_for_onboarding: formData.required_for_onboarding,
          unlocks_capability: formData.unlocks_capability || null,
          passing_threshold: formData.passing_threshold,
          is_published: formData.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId);
      if (error) throw error;
      toast.success('Cursus opgeslagen');
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Kon cursus niet opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  // Add multiple lessons at once
  const handleAddSelectedLessons = async () => {
    if (!courseId || selectedLessonIds.size === 0) return;
    setIsAdding(true);
    const startOrder = (courseLessons?.length ?? 0) + 1;
    const ids = Array.from(selectedLessonIds);

    try {
      const inserts = ids.map((lessonId, i) => ({
        course_id: courseId,
        lesson_id: lessonId,
        sequence_order: startOrder + i,
        is_required: true,
      }));
      const { error } = await supabase.from('course_lessons').insert(inserts);
      if (error) throw error;
      toast.success(`${ids.length} ${ids.length === 1 ? 'les' : 'lessen'} toegevoegd`);
      setSelectedLessonIds(new Set());
      setIsAddLessonsOpen(false);
      refetchLessons();
    } catch (error) {
      console.error('Error adding lessons:', error);
      toast.error('Kon lessen niet toevoegen');
    } finally {
      setIsAdding(false);
    }
  };

  // Remove lesson from course
  const handleRemoveLesson = async (courseLessonId: string) => {
    try {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', courseLessonId);
      if (error) throw error;

      // Reorder remaining
      const remaining = courseLessons?.filter((cl) => cl.id !== courseLessonId) ?? [];
      for (let i = 0; i < remaining.length; i++) {
        await supabase.from('course_lessons').update({ sequence_order: i + 1 }).eq('id', remaining[i].id);
      }
      toast.success('Les verwijderd');
      refetchLessons();
    } catch (error) {
      console.error('Error removing lesson:', error);
      toast.error('Kon les niet verwijderen');
    }
  };

  // Move lesson up/down
  const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
    if (!courseLessons) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= courseLessons.length) return;

    const current = courseLessons[index];
    const swap = courseLessons[newIndex];

    try {
      await Promise.all([
        supabase.from('course_lessons').update({ sequence_order: newIndex + 1 }).eq('id', current.id),
        supabase.from('course_lessons').update({ sequence_order: index + 1 }).eq('id', swap.id),
      ]);
      refetchLessons();
    } catch (error) {
      console.error('Error moving lesson:', error);
      toast.error('Kon volgorde niet aanpassen');
    }
  };

  // Toggle lesson required
  const handleToggleRequired = async (courseLessonId: string, isRequired: boolean) => {
    try {
      const { error } = await supabase
        .from('course_lessons')
        .update({ is_required: isRequired })
        .eq('id', courseLessonId);
      if (error) throw error;
      refetchLessons();
    } catch (error) {
      console.error('Error updating lesson:', error);
    }
  };

  // Toggle lesson selection in modal
  const toggleLessonSelection = (id: string) => {
    setSelectedLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (courseLoading) {
    return (
      <AdminPageLayout
        title="Cursus bewerken"
        breadcrumbs={[
          { label: 'Content Editor', href: '/editor/cursussen' },
          { label: 'Cursussen', href: '/editor/cursussen' },
          { label: 'Laden...' },
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminPageLayout>
    );
  }

  if (!course) {
    return (
      <AdminPageLayout
        title="Cursus niet gevonden"
        breadcrumbs={[
          { label: 'Content Editor', href: '/editor/cursussen' },
          { label: 'Cursussen', href: '/editor/cursussen' },
          { label: 'Fout' },
        ]}
      >
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Cursus niet gevonden.</p>
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
      title="Cursus Bewerken"
      breadcrumbs={[
        { label: 'Content Editor', href: '/editor/cursussen' },
        { label: 'Cursussen', href: '/editor/cursussen' },
        { label: formData.title || 'Bewerken' },
      ]}
      actions={
        <Button variant="outline" asChild>
          <Link to="/editor/cursussen">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
        {/* Main Content - Lessons */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Lessen in Cursus</CardTitle>
                <CardDescription>
                  Voeg lessen toe en bepaal de volgorde. Gebruikers doorlopen de lessen in deze volgorde.
                </CardDescription>
              </div>
              <Button onClick={() => { setSelectedLessonIds(new Set()); setIsAddLessonsOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Lessen toevoegen
              </Button>
            </CardHeader>
            <CardContent>
              {courseLessons && courseLessons.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Les</TableHead>
                      <TableHead className="w-24">Verplicht</TableHead>
                      <TableHead className="w-32 text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseLessons.map((cl, index) => (
                      <TableRow key={cl.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{cl.sequence_order}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cl.lesson?.title}</p>
                            {cl.lesson?.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {cl.lesson.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={cl.is_required ?? true}
                            onCheckedChange={(checked) =>
                              handleToggleRequired(cl.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveLesson(index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveLesson(index, 'down')}
                              disabled={index === courseLessons.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveLesson(cl.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nog geen lessen toegevoegd. Klik op "Lessen toevoegen" om te beginnen.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cursus Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="required_for_onboarding">Verplicht voor onboarding</Label>
                <Checkbox
                  id="required_for_onboarding"
                  checked={formData.required_for_onboarding}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, required_for_onboarding: checked as boolean }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unlocks_capability">Ontgrendelt Capability</Label>
                <Input
                  id="unlocks_capability"
                  value={formData.unlocks_capability}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unlocks_capability: e.target.value }))}
                  placeholder="bijv. ai_rijbewijs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passing_threshold">Slagingsdrempel (%)</Label>
                <Input
                  id="passing_threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.passing_threshold}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, passing_threshold: parseInt(e.target.value) || 80 }))
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <Label htmlFor="is_published">Gepubliceerd</Label>
                  <p className="text-xs text-muted-foreground">Zichtbaar voor gebruikers</p>
                </div>
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_published: checked }))}
                />
              </div>

              <Button className="w-full" onClick={handleSaveMetadata} disabled={isSaving}>
                {isSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
              </Button>
            </CardContent>
          </Card>

          {/* Course Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistieken</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aantal lessen</span>
                <Badge variant="secondary">{courseLessons?.length ?? 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verplichte lessen</span>
                <Badge variant="secondary">
                  {courseLessons?.filter((cl) => cl.is_required).length ?? 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={formData.is_published ? 'default' : 'secondary'}>
                  {formData.is_published ? 'Gepubliceerd' : 'Concept'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Lessons Modal */}
      <Dialog open={isAddLessonsOpen} onOpenChange={setIsAddLessonsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Lessen toevoegen</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2">
            {lessonsNotInCourse.length > 0 ? (
              <div className="space-y-1">
                {lessonsNotInCourse.map((lesson) => (
                  <label
                    key={lesson.id}
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <Checkbox
                      checked={selectedLessonIds.has(lesson.id)}
                      onCheckedChange={() => toggleLessonSelection(lesson.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm leading-tight">{lesson.title}</p>
                      {lesson.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {lesson.description}
                        </p>
                      )}
                      <Badge variant={lesson.is_published ? 'default' : 'secondary'} className="mt-1 text-[10px] px-1.5 py-0">
                        {lesson.is_published ? 'Gepubliceerd' : 'Concept'}
                      </Badge>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Alle beschikbare lessen zijn al aan deze cursus toegevoegd.
              </p>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsAddLessonsOpen(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleAddSelectedLessons}
              disabled={selectedLessonIds.size === 0 || isAdding}
            >
              {isAdding
                ? 'Toevoegen...'
                : `Toevoegen (${selectedLessonIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
