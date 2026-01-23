import { LessonAttempt } from '@/hooks/useLessonAttempts';
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
import { CheckCircle, XCircle, Clock, Trophy, Target } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface AttemptHistoryCardProps {
  attempts: LessonAttempt[];
  passingScore: number;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

export function AttemptHistoryCard({ attempts, passingScore }: AttemptHistoryCardProps) {
  const completedAttempts = attempts.filter(a => a.completed_at);
  
  if (completedAttempts.length === 0) {
    return null;
  }

  // Find best and passing attempt
  const bestAttempt = completedAttempts.reduce((best, current) => 
    (current.percentage ?? 0) > (best.percentage ?? 0) ? current : best
  );
  const passingAttempt = completedAttempts.find(a => a.passed);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Poging Geschiedenis
          </CardTitle>
          <Badge variant="secondary">
            {completedAttempts.length} poging{completedAttempts.length !== 1 ? 'en' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Beste score</p>
              <p className="font-semibold">{bestAttempt?.percentage ?? 0}%</p>
            </div>
          </div>
          {passingAttempt && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Geslaagd bij</p>
                <p className="font-semibold">Poging #{passingAttempt.attempt_number}</p>
              </div>
            </div>
          )}
        </div>

        {/* Attempts table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Tijd</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedAttempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell className="font-medium">
                    {attempt.attempt_number}
                    {attempt.id === bestAttempt?.id && (
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
                    <span className={`font-semibold ${
                      (attempt.percentage ?? 0) >= passingScore 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {attempt.percentage ?? 0}%
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({attempt.score ?? 0}/{attempt.max_score ?? 0})
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {formatDuration(attempt.time_spent)}
                  </TableCell>
                  <TableCell className="text-center">
                    {attempt.passed ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Geslaagd
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Niet geslaagd
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
