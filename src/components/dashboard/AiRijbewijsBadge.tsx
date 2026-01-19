import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, GraduationCap, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface AiRijbewijsBadgeProps {
  obtainedAt: string | null;
  compact?: boolean;
}

export function AiRijbewijsBadge({ obtainedAt, compact = false }: AiRijbewijsBadgeProps) {
  const formattedDate = obtainedAt
    ? format(new Date(obtainedAt), 'd MMMM yyyy', { locale: nl })
    : null;

  if (compact) {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 gap-1.5">
        <CheckCircle className="h-3 w-3" />
        AI Rijbewijs Certified
      </Badge>
    );
  }

  return (
    <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-green-700 dark:text-green-400">
                AI Rijbewijs Certified
              </span>
            </div>
            {formattedDate && (
              <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>Behaald op: {formattedDate}</span>
              </div>
            )}
          </div>
          <Award className="h-8 w-8 text-green-500/50" />
        </div>
      </CardContent>
    </Card>
  );
}
