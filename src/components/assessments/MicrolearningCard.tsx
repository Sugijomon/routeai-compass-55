import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BookMarked, Clock, ChevronRight } from 'lucide-react';
import { useMicrolearningAssignment } from '@/hooks/useMicrolearningAssignment';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Props {
  assessmentId: string;
}

export function MicrolearningCard({ assessmentId }: Props) {
  const navigate = useNavigate();
  const { assignment, isLoading, isCompleted, lessonId } = useMicrolearningAssignment(assessmentId);

  if (isLoading || !assignment) return null;

  const library = assignment.learning_library as Record<string, unknown> | null;
  const lesson = library?.lessons as Record<string, unknown> | null;
  const title = (library?.title as string) ?? 'Micro-learning';
  const description = (library?.description as string) ?? '';
  const cluster = (library?.cluster_id as string) ?? '';
  const duration = (lesson?.estimated_duration as number) ?? 15;
  const contextCard = assignment.context_card_text;

  return (
    <Card className={`border-l-4 ${isCompleted ? 'border-l-green-600' : 'border-l-orange-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
              isCompleted ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {isCompleted
                ? <CheckCircle className="h-5 w-5 text-green-700" />
                : <BookMarked className="h-5 w-5 text-orange-700" />}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Verplichte micro-learning
              </p>
              <p className="text-sm font-semibold mt-0.5">{title}</p>
            </div>
          </div>
          {isCompleted && (
            <Badge className="bg-green-100 text-green-800 border-0">Afgerond</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Contextkaart */}
        {contextCard && !isCompleted && (
          <div className="rounded-md bg-orange-50 border border-orange-200 p-3 text-sm text-orange-900">
            {contextCard}
          </div>
        )}

        {/* Beschrijving */}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {cluster && <Badge variant="outline" className="text-xs">{cluster}</Badge>}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            ~{duration} min
          </span>
          {isCompleted && assignment.completedAt && (
            <span>
              Afgerond op {format(new Date(assignment.completedAt), 'd MMM yyyy', { locale: nl })}
            </span>
          )}
        </div>

        {/* Actie */}
        {!isCompleted && lessonId && (
          <Button
            onClick={() => navigate(`/learn/${lessonId}?assessment=${assessmentId}`)}
            className="w-full gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <BookMarked className="h-4 w-4" />
            Micro-learning starten
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        )}

        {!isCompleted && !lessonId && (
          <p className="text-sm text-muted-foreground italic">
            Neem contact op met de beheerder — geen les gekoppeld aan deze module.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
