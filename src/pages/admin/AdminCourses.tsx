import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, BookOpen, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;

interface CourseWithLessonCount extends Course {
  lesson_count: number;
}

export default function AdminCourses() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_for_onboarding: false,
    unlocks_capability: '',
    passing_threshold: 80,
  });

  const { data: courses, isLoading, refetch } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      // Get courses with lesson count
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get lesson counts for each course
      const coursesWithCounts: CourseWithLessonCount[] = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { count } = await supabase
            .from('course_lessons')
            .select('id', { count: 'exact', head: true })
            .eq('course_id', course.id);

          return {
            ...course,
            lesson_count: count ?? 0,
          };
        })
      );

      return coursesWithCounts;
    },
  });

  const handleCreateCourse = async () => {
    if (!formData.title.trim()) {
      toast.error('Titel is verplicht');
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from('courses').insert({
        title: formData.title,
        description: formData.description || null,
        required_for_onboarding: formData.required_for_onboarding,
        unlocks_capability: formData.unlocks_capability || null,
        passing_threshold: formData.passing_threshold,
        is_published: false,
      });

      if (error) throw error;

      toast.success('Cursus aangemaakt');
      setIsCreateOpen(false);
      setFormData({
        title: '',
        description: '',
        required_for_onboarding: false,
        unlocks_capability: '',
        passing_threshold: 80,
      });
      refetch();
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Kon cursus niet aanmaken');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminPageLayout
      title="Cursussen"
      breadcrumbs={[
        { label: 'Admin', href: '/admin-dashboard' },
        { label: 'Cursussen' },
      ]}
      actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Cursus
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nieuwe Cursus Aanmaken</DialogTitle>
              <DialogDescription>
                Maak een nieuwe cursus aan om lessen te bundelen.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Bijv. AI Rijbewijs Basis"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Beschrijf waar deze cursus over gaat..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required_for_onboarding"
                  checked={formData.required_for_onboarding}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      required_for_onboarding: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="required_for_onboarding">
                  Verplicht voor onboarding
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unlocks_capability">
                  Ontgrendelt Capability
                </Label>
                <Input
                  id="unlocks_capability"
                  value={formData.unlocks_capability}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      unlocks_capability: e.target.value,
                    }))
                  }
                  placeholder="Bijv. ai_rijbewijs"
                />
                <p className="text-xs text-muted-foreground">
                  Laat leeg als deze cursus geen capability ontgrendelt.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passing_threshold">
                  Slagingsdrempel (%)
                </Label>
                <Input
                  id="passing_threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.passing_threshold}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      passing_threshold: parseInt(e.target.value) || 80,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Annuleren
              </Button>
              <Button onClick={handleCreateCourse} disabled={isCreating}>
                {isCreating ? 'Aanmaken...' : 'Cursus Aanmaken'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : courses && courses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Lessen</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Ontgrendelt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      {course.title}
                    </div>
                  </TableCell>
                  <TableCell>{course.lesson_count} lessen</TableCell>
                  <TableCell>
                    {course.required_for_onboarding ? (
                      <Badge variant="secondary">Verplicht</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {course.unlocks_capability ? (
                      <Badge variant="outline" className="gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {course.unlocks_capability}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={course.is_published ? 'default' : 'secondary'}
                    >
                      {course.is_published ? 'Gepubliceerd' : 'Concept'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/courses/${course.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Geen cursussen</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Maak je eerste cursus aan om lessen te bundelen.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Cursus
            </Button>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
