import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Plus,
  BarChart3,
  Eye,
  Edit,
  GraduationCap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContentEditorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lessons');

  // Fetch content statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['content-editor-stats'],
    queryFn: async () => {
      const [lessonsRes, questionsRes, libraryRes] = await Promise.all([
        supabase.from('lessons').select('id, is_published'),
        supabase.from('learning_questions').select('id'),
        supabase.from('learning_library').select('id, status')
      ]);

      const lessons = lessonsRes.data || [];
      const libraryItems = libraryRes.data || [];
      
      return {
        totalLessons: lessons.length,
        publishedLessons: lessons.filter(l => l.is_published).length,
        totalQuestions: questionsRes.data?.length || 0,
        totalLibraryItems: libraryItems.length,
        publishedLibraryItems: libraryItems.filter(i => i.status === 'published').length,
      };
    }
  });

  // Fetch lessons
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['editor-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['editor-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_questions')
        .select('*, lessons(title)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch learning library items
  const { data: libraryItems, isLoading: libraryLoading } = useQuery({
    queryKey: ['editor-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_library')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  const publishedPercentage = stats?.totalLessons 
    ? Math.round((stats.publishedLessons / stats.totalLessons) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Editor</h1>
            <p className="text-muted-foreground">
              Beheer leermodules, lessen en vragen voor het RouteAI platform
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Lessen"
            value={statsLoading ? '-' : stats?.totalLessons || 0}
            subtitle={`${stats?.publishedLessons || 0} gepubliceerd`}
            icon={BookOpen}
          />
          <StatCard
            title="Vragen"
            value={statsLoading ? '-' : stats?.totalQuestions || 0}
            subtitle="Alle vraagtypen"
            icon={HelpCircle}
          />
          <StatCard
            title="Bibliotheek"
            value={statsLoading ? '-' : stats?.totalLibraryItems || 0}
            subtitle={`${stats?.publishedLibraryItems || 0} gepubliceerd`}
            icon={GraduationCap}
          />
          <StatCard
            title="Publicatie Status"
            value={statsLoading ? '-' : `${publishedPercentage}%`}
            subtitle="Content gepubliceerd"
            icon={BarChart3}
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
            <CardDescription>Maak nieuwe content aan</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate('/admin/lessons')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nieuwe Les
            </Button>
            <Button 
              onClick={() => navigate('/editor/questions/new')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nieuwe Vraag
            </Button>
            <Button 
              onClick={() => navigate('/admin/courses')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nieuwe Cursus
            </Button>
          </CardContent>
        </Card>

        {/* Content Library */}
        <Card>
          <CardHeader>
            <CardTitle>Content Bibliotheek</CardTitle>
            <CardDescription>Bekijk en beheer alle content</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="lessons">
                  Lessen ({stats?.totalLessons || 0})
                </TabsTrigger>
                <TabsTrigger value="questions">
                  Vragen ({stats?.totalQuestions || 0})
                </TabsTrigger>
                <TabsTrigger value="library">
                  Bibliotheek ({stats?.totalLibraryItems || 0})
                </TabsTrigger>
              </TabsList>

              {/* Lessons Tab */}
              <TabsContent value="lessons" className="mt-0">
                {lessonsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : lessons && lessons.length > 0 ? (
                  <div className="space-y-3">
                    {lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
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
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={lesson.is_published ? 'default' : 'secondary'}>
                                {lesson.is_published ? 'Gepubliceerd' : 'Concept'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/learn/${lesson.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="Nog geen lessen"
                    description="Maak je eerste les aan om te beginnen."
                    action={{
                      label: 'Nieuwe Les',
                      onClick: () => navigate('/admin/lessons'),
                    }}
                  />
                )}
              </TabsContent>

              {/* Questions Tab */}
              <TabsContent value="questions" className="mt-0">
                {questionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : questions && questions.length > 0 ? (
                  <div className="space-y-3">
                    {questions.map((question) => (
                      <div
                        key={question.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-1">
                            {question.question_text}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Les: {(question as any).lessons?.title || 'Onbekend'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {question.question_type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="secondary">
                              {question.points} {question.points === 1 ? 'punt' : 'punten'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/editor/questions/${question.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={HelpCircle}
                    title="Nog geen vragen"
                    description="Voeg vragen toe aan lessen om de kennis van gebruikers te testen."
                    action={{
                      label: 'Nieuwe Vraag',
                      onClick: () => navigate('/editor/questions/new'),
                    }}
                  />
                )}
              </TabsContent>

              {/* Library Tab */}
              <TabsContent value="library" className="mt-0">
                {libraryLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : libraryItems && libraryItems.length > 0 ? (
                  <div className="space-y-3">
                    {libraryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                                {item.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                              </Badge>
                              <Badge variant="outline">
                                {item.content_type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/super-admin`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={GraduationCap}
                    title="Bibliotheek is leeg"
                    description="Voeg cursussen en modules toe aan de leerbibliotheek."
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
