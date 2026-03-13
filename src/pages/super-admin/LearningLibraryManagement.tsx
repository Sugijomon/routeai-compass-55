import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Search, ArrowLeft, Play, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  lesson_type: string;
  is_published: boolean | null;
  estimated_duration: number | null;
  passing_score: number | null;
  created_at: string | null;
}

export default function LearningLibraryManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch lessons
  const { data: lessons, isLoading } = useQuery({
    queryKey: ['super-admin-learning-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Lesson[];
    }
  });

  // Get unique lesson types
  const lessonTypes = [...new Set(lessons?.map(l => l.lesson_type).filter(Boolean))];

  const filteredLessons = lessons?.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'published' && lesson.is_published) ||
      (filterStatus === 'draft' && !lesson.is_published);
    const matchesType = filterType === 'all' || lesson.lesson_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Learning Library Beheer</h1>
                <p className="text-muted-foreground">
                  Platform-brede trainingsinhoud — Cursussen en modules voor AI-Rijbewijs
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/lessons')}>
              Naar Lesson Editor
            </Button>
            <Button onClick={() => navigate('/editor')}>
              <Plus className="h-4 w-4 mr-2" />
              Naar Content Editor
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek op titel, beschrijving..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  {lessonTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="published">Gepubliceerd</SelectItem>
                  <SelectItem value="draft">Concept</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lessons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lessen ({filteredLessons?.length || 0})</CardTitle>
            <CardDescription>
              Alle lessen in de learning library
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLessons && filteredLessons.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duur</TableHead>
                    <TableHead>Slagingspercentage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aangemaakt</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {lesson.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {lesson.lesson_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lesson.estimated_duration ? `${lesson.estimated_duration} min` : '—'}
                      </TableCell>
                      <TableCell>
                        {lesson.passing_score ? `${lesson.passing_score}%` : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={lesson.is_published ? 'default' : 'secondary'}>
                          {lesson.is_published ? 'Gepubliceerd' : 'Concept'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lesson.created_at 
                          ? new Date(lesson.created_at).toLocaleDateString('nl-NL')
                          : '—'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)}
                            title="Bewerken"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen lessen gevonden</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
