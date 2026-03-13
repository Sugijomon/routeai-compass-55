import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, HelpCircle, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const questionTypeLabels: Record<string, string> = {
  multiple_choice: 'Meerkeuze',
  multiple_select: 'Multi-select',
  true_false: 'Waar/Onwaar',
  fill_in: 'Invulvraag',
  essay: 'Open vraag',
};

export default function VragenBank() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [lessonFilter, setLessonFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch all questions with lesson info
  const { data: questions, isLoading } = useQuery({
    queryKey: ['vragenbank-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_questions')
        .select('*, lessons(id, title)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch lessons for filter dropdown
  const { data: lessons } = useQuery({
    queryKey: ['vragenbank-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from('learning_questions')
        .delete()
        .eq('id', deleteId);
      if (error) throw error;
      toast.success('Vraag verwijderd');
      queryClient.invalidateQueries({ queryKey: ['vragenbank-questions'] });
    } catch (err) {
      console.error(err);
      toast.error('Kon vraag niet verwijderen');
    } finally {
      setDeleteId(null);
    }
  };

  // Filter questions
  const filtered = questions?.filter((q) => {
    const matchesSearch = !search || q.question_text.toLowerCase().includes(search.toLowerCase());
    const matchesLesson = lessonFilter === 'all' || q.lesson_id === lessonFilter;
    return matchesSearch && matchesLesson;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Vragenbank</h1>
          <Button onClick={() => navigate('/editor/questions/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe vraag
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op vraagtekst..."
              className="pl-9"
            />
          </div>
          <Select value={lessonFilter} onValueChange={setLessonFilter}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Alle lessen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle lessen</SelectItem>
              {lessons?.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vraag</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead className="w-40">Les</TableHead>
                  <TableHead className="w-20 text-right">Punten</TableHead>
                  <TableHead className="w-24 text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <p className="line-clamp-1 text-sm font-medium">
                        {q.question_text}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {questionTypeLabels[q.question_type] || q.question_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {(q as any).lessons?.title || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {q.points}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/editor/questions/${q.id}/edit`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeleteId(q.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={HelpCircle}
            title={search || lessonFilter !== 'all' ? 'Geen resultaten' : 'Nog geen vragen'}
            description={
              search || lessonFilter !== 'all'
                ? 'Probeer andere zoektermen of filters.'
                : 'Maak je eerste vraag aan om de vragenbank te vullen.'
            }
            action={
              !search && lessonFilter === 'all'
                ? { label: 'Nieuwe vraag', onClick: () => navigate('/editor/questions/new') }
                : undefined
            }
          />
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vraag verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden. De vraag en bijbehorende antwoorden worden permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
