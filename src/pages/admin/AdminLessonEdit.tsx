import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import type { Tables } from '@/integrations/supabase/types';

type Lesson = Tables<'lessons'>;

export default function AdminLessonEdit() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      if (!lessonId) throw new Error('No lesson ID');
      
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      return data as Lesson;
    },
    enabled: !!lessonId,
  });

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Les bewerken"
        breadcrumbs={[
          { label: 'Admin', href: '/admin-dashboard' },
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
          { label: 'Admin', href: '/admin-dashboard' },
          { label: 'Lessen', href: '/admin/lessons' },
          { label: 'Fout' },
        ]}
      >
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Les niet gevonden of er is een fout opgetreden.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/admin/lessons')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar lessen
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={lesson.title}
      breadcrumbs={[
        { label: 'Admin', href: '/admin-dashboard' },
        { label: 'Lessen', href: '/admin/lessons' },
        { label: lesson.title },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Badge variant={lesson.is_published ? 'default' : 'secondary'}>
            {lesson.is_published ? 'Gepubliceerd' : 'Concept'}
          </Badge>
          <Button variant="outline" asChild>
            <Link to="/admin/lessons">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug
            </Link>
          </Button>
        </div>
      }
    >
      {/* Placeholder for block editor - will be built in Part 2 */}
      <div className="rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-medium text-muted-foreground">
          Block Editor komt in Part 2
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Hier kun je straks blokken toevoegen: paragrafen, vragen, video's en checkpoints.
        </p>
        
        {/* Show current lesson info */}
        <div className="mt-8 rounded-lg bg-muted/50 p-4 text-left">
          <h4 className="font-medium mb-2">Les Details:</h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">ID:</dt>
            <dd className="font-mono text-xs">{lesson.id}</dd>
            <dt className="text-muted-foreground">Type:</dt>
            <dd>{lesson.lesson_type}</dd>
            <dt className="text-muted-foreground">Duur:</dt>
            <dd>{lesson.estimated_duration ? `${lesson.estimated_duration} min` : '-'}</dd>
            <dt className="text-muted-foreground">Slaagpercentage:</dt>
            <dd>{lesson.passing_score ?? 80}%</dd>
            <dt className="text-muted-foreground">Aantal blokken:</dt>
            <dd>{Array.isArray(lesson.blocks) ? lesson.blocks.length : 0}</dd>
          </dl>
        </div>
      </div>
    </AdminPageLayout>
  );
}
