import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, CheckCircle, Plus, Trash2, BookMarked } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
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
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useMicrolearnings } from '@/hooks/useMicrolearnings';
import { MicrolearningEditSheet } from '@/components/admin/lesson-editor/MicrolearningEditSheet';

export default function ContentEditorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Micro-learning state
  const { microlearnings, isLoading: mlLoading, updateMetadata, createMicrolearning } = useMicrolearnings();
  const [editingML, setEditingML] = useState<typeof microlearnings[number] | null>(null);
  const [newMLTitle, setNewMLTitle] = useState('');
  const [showNewML, setShowNewML] = useState(false);

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
    if (!newTitle.trim()) { toast.error('Titel is verplicht'); return; }
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({ title: newTitle.trim(), description: newDescription.trim() || null, org_id: profile?.org_id })
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
        <h1 className="text-3xl font-bold tracking-tight">Content Editor</h1>

        <Tabs defaultValue="courses">
          <TabsList>
            <TabsTrigger value="courses">Cursussen</TabsTrigger>
            <TabsTrigger value="microlearnings" className="gap-2">
              <BookMarked className="h-4 w-4" />
              Micro-learnings
              {microlearnings.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                  {microlearnings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB: Cursussen ═══ */}
          <TabsContent value="courses" className="mt-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div />
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe cursus
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title="Cursussen" value={statsLoading ? '-' : stats?.totalCourses || 0} icon={GraduationCap} isLoading={statsLoading} />
              <StatCard title="Lessen" value={statsLoading ? '-' : stats?.totalLessons || 0} icon={BookOpen} isLoading={statsLoading} />
              <StatCard title="Gepubliceerd" value={statsLoading ? '-' : stats?.totalPublished || 0} icon={CheckCircle} isLoading={statsLoading} />
            </div>

            {/* Course list */}
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : courses && courses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => {
                  const lessonCount = (course.course_lessons as unknown[])?.length ?? 0;
                  return (
                    <Card key={course.id} className="group relative overflow-hidden transition-shadow hover:shadow-md">
                      <CardContent className="flex h-full flex-col p-5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <h3 className="font-semibold leading-tight line-clamp-2">{course.title}</h3>
                          <Badge variant={course.is_published ? 'default' : 'secondary'} className="shrink-0">
                            {course.is_published ? 'Gepubliceerd' : 'Concept'}
                          </Badge>
                        </div>
                        {course.description && (
                          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            {lessonCount} {lessonCount === 1 ? 'les' : 'lessen'}
                          </span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>
                              Bewerken
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteId(course.id)}>
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
                action={{ label: 'Nieuwe cursus', onClick: () => setIsCreateOpen(true) }}
              />
            )}
          </TabsContent>

          {/* ═══ TAB: Micro-learnings ═══ */}
          <TabsContent value="microlearnings" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Micro-learnings</h2>
                <p className="text-sm text-muted-foreground">Standalone modules voor de Oranje route (activatie-vereiste)</p>
              </div>
              <Button onClick={() => setShowNewML(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Nieuwe micro-learning
              </Button>
            </div>

            {/* Aanmaak-formulier */}
            {showNewML && (
              <Card>
                <CardContent className="p-4 flex items-end gap-3">
                  <div className="flex-1">
                    <Label>Titel</Label>
                    <Input
                      value={newMLTitle}
                      onChange={e => setNewMLTitle(e.target.value)}
                      placeholder="Bijv. ML-O01: Verification Gatekeeper"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (newMLTitle.trim()) {
                        createMicrolearning.mutate({ title: newMLTitle.trim() }, {
                          onSuccess: () => { setNewMLTitle(''); setShowNewML(false); },
                        });
                      }
                    }}
                    disabled={!newMLTitle.trim() || createMicrolearning.isPending}
                  >
                    Aanmaken
                  </Button>
                  <Button variant="ghost" onClick={() => setShowNewML(false)}>Annuleren</Button>
                </CardContent>
              </Card>
            )}

            {/* Lijst */}
            {mlLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : microlearnings.length === 0 ? (
              <EmptyState
                icon={BookMarked}
                title="Nog geen micro-learnings"
                description="Micro-learnings zijn verplichte activatiemodules voor de Oranje route. Maak je eerste aan."
                action={{ label: 'Nieuwe micro-learning', onClick: () => setShowNewML(true) }}
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Cluster</TableHead>
                      <TableHead>Archetypen</TableHead>
                      <TableHead>Activatie-eis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {microlearnings.map(ml => (
                      <TableRow key={ml.id}>
                        <TableCell className="font-medium">{ml.title}</TableCell>
                        <TableCell>
                          {ml.cluster_id
                            ? <Badge variant="outline">{ml.cluster_id}</Badge>
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(ml.archetype_codes ?? []).map(c => (
                              <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                            ))}
                            {(ml.archetype_codes ?? []).length === 0 && <span className="text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ml.is_activation_req
                            ? <Badge className="bg-orange-100 text-orange-800 border-orange-300">Vereist</Badge>
                            : <span className="text-muted-foreground">Nee</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ml.status === 'published' ? 'default' : 'secondary'}>
                            {ml.status === 'published' ? 'Gepubliceerd' : ml.status === 'deprecated' ? 'Gearchiveerd' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setEditingML(ml)}>Bewerken</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create course dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe cursus aanmaken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-title">Titel *</Label>
              <Input id="new-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="bijv. AI Rijbewijs Basiscursus" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-desc">Beschrijving</Label>
              <Textarea id="new-desc" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Korte omschrijving van de cursus..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuleren</Button>
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

      {/* Micro-learning edit sheet */}
      <MicrolearningEditSheet
        ml={editingML}
        onClose={() => setEditingML(null)}
        onSave={(id, updates) => updateMetadata.mutate({ id, ...updates } as never)}
        isPending={updateMetadata.isPending}
      />
    </AppLayout>
  );
}
