import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, CheckCircle, HelpCircle, Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const LESSON_TYPE_LABELS: Record<string, string> = {
  course_module: 'Cursusles',
  standalone: 'Losse les',
  ai_literacy_exam: 'Examen',
};

export default function EditorDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['editor-dashboard-stats'],
    queryFn: async () => {
      const [coursesRes, lessonsRes, publishedRes, questionsRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('learning_questions').select('id', { count: 'exact', head: true }),
      ]);
      return {
        courses: coursesRes.count ?? 0,
        lessons: lessonsRes.count ?? 0,
        published: publishedRes.count ?? 0,
        questions: questionsRes.count ?? 0,
      };
    },
  });

  const { data: recentLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['editor-dashboard-recent-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, lesson_type, is_published, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Content Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Cursussen" value={statsLoading ? '-' : stats?.courses ?? 0} icon={GraduationCap} isLoading={statsLoading} />
          <StatCard title="Lessen" value={statsLoading ? '-' : stats?.lessons ?? 0} icon={BookOpen} isLoading={statsLoading} />
          <StatCard title="Gepubliceerd" value={statsLoading ? '-' : stats?.published ?? 0} icon={CheckCircle} isLoading={statsLoading} />
          <StatCard title="Vragen" value={statsLoading ? '-' : stats?.questions ?? 0} icon={HelpCircle} isLoading={statsLoading} />
        </div>

        {/* Recent Lessons */}
        <Card>
          <CardHeader>
            <CardTitle>Recente Lessen</CardTitle>
          </CardHeader>
          <CardContent>
            {lessonsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : recentLessons && recentLessons.length > 0 ? (
              <div className="divide-y">
                {recentLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium truncate">{lesson.title}</span>
                      <Badge variant="outline" className="shrink-0">
                        {LESSON_TYPE_LABELS[lesson.lesson_type] ?? lesson.lesson_type}
                      </Badge>
                      <Badge variant={lesson.is_published ? 'default' : 'secondary'} className="shrink-0">
                        {lesson.is_published ? 'Gepubliceerd' : 'Concept'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Bewerken
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen lessen aangemaakt.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
