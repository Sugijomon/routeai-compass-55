import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Trophy, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { LessonAttempt } from '@/hooks/useLessonAttempts';

interface LessonWithAttempts {
  lesson_id: string;
  lesson_title: string;
  attempts: LessonAttempt[];
  best_score: number;
  total_attempts: number;
  passed: boolean;
  passing_attempt_number: number | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

export function MyAttemptHistory() {
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  // Fetch all attempts grouped by lesson
  const { data: lessonsWithAttempts = [], isLoading } = useQuery({
    queryKey: ['my-lesson-attempts', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get all attempts
      const { data: attempts, error } = await supabase
        .from('lesson_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) throw error;

      // Get lesson details
      const lessonIds = [...new Set(attempts?.map(a => a.lesson_id) || [])];
      if (lessonIds.length === 0) return [];

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, passing_score')
        .in('id', lessonIds);

      const lessonMap = new Map(lessons?.map(l => [l.id, l]) || []);

      // Group attempts by lesson
      const grouped = new Map<string, LessonAttempt[]>();
      attempts?.forEach(attempt => {
        const existing = grouped.get(attempt.lesson_id) || [];
        existing.push(attempt as LessonAttempt);
        grouped.set(attempt.lesson_id, existing);
      });

      // Build result
      const result: LessonWithAttempts[] = [];
      grouped.forEach((lessonAttempts, lessonId) => {
        const lesson = lessonMap.get(lessonId);
        const completedAttempts = lessonAttempts.filter(a => a.completed_at);
        const bestScore = completedAttempts.length > 0 
          ? Math.max(...completedAttempts.map(a => a.percentage ?? 0))
          : 0;
        const passingAttempt = completedAttempts.find(a => a.passed);

        result.push({
          lesson_id: lessonId,
          lesson_title: lesson?.title || 'Onbekende les',
          attempts: lessonAttempts.sort((a, b) => a.attempt_number - b.attempt_number),
          best_score: bestScore,
          total_attempts: completedAttempts.length,
          passed: !!passingAttempt,
          passing_attempt_number: passingAttempt?.attempt_number ?? null,
        });
      });

      return result.sort((a, b) => {
        const aLatest = a.attempts[0]?.started_at || '';
        const bLatest = b.attempts[0]?.started_at || '';
        return bLatest.localeCompare(aLatest);
      });
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Pogingen laden...
        </CardContent>
      </Card>
    );
  }

  if (lessonsWithAttempts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Mijn Poging Geschiedenis
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Je hebt nog geen lessen geprobeerd.
        </CardContent>
      </Card>
    );
  }

  const toggleExpand = (lessonId: string) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Mijn Poging Geschiedenis
          </CardTitle>
          <Badge variant="secondary">
            {lessonsWithAttempts.length} les{lessonsWithAttempts.length !== 1 ? 'sen' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lessonsWithAttempts.map((lesson) => (
            <div key={lesson.lesson_id} className="border rounded-lg overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(lesson.lesson_id)}
              >
                <div className="flex items-center gap-3">
                  {lesson.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{lesson.lesson_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.total_attempts} poging{lesson.total_attempts !== 1 ? 'en' : ''}
                      {lesson.passed && lesson.passing_attempt_number && (
                        <span className="text-green-600 ml-2">
                          • Geslaagd bij poging #{lesson.passing_attempt_number}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Beste score</p>
                    <p className={`font-semibold ${lesson.passed ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {lesson.best_score}%
                    </p>
                  </div>
                  {expandedLesson === lesson.lesson_id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedLesson === lesson.lesson_id && (
                <div className="border-t bg-muted/30 p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Poging</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Tijd</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lesson.attempts.filter(a => a.completed_at).map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium">
                            #{attempt.attempt_number}
                            {attempt.percentage === lesson.best_score && lesson.best_score > 0 && (
                              <Trophy className="inline h-4 w-4 ml-1 text-yellow-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {attempt.completed_at 
                              ? format(new Date(attempt.completed_at), 'd MMM yyyy, HH:mm', { locale: nl })
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-semibold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                              {attempt.percentage ?? 0}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {formatDuration(attempt.time_spent)}
                          </TableCell>
                          <TableCell className="text-center">
                            {attempt.passed ? (
                              <Badge variant="default" className="bg-green-600 text-xs">Geslaagd</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">Niet geslaagd</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
