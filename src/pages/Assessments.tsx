import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTE_CONFIG, ASSESSMENT_STATUS_LABELS } from '@/types/assessment';
import type { AssessmentRoute, AssessmentStatus } from '@/types/assessment';
import { Plus, CheckCircle, AlertTriangle, Info, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const ROUTE_ICONS = {
  green: CheckCircle,
  yellow: Info,
  orange: AlertTriangle,
  red: XCircle,
} as const;


export default function Assessments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['my-assessments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('assessments')
        .select('id, tool_name_raw, route, primary_archetype, status, created_at, plain_language')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mijn AI Checks</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overzicht van al jouw AI-beoordelingen
            </p>
          </div>
          <Button onClick={() => navigate('/assessments/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nieuwe AI Check
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : assessments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Info className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">Nog geen AI Checks</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Start je eerste beoordeling om een AI-toepassing te registreren.
                </p>
              </div>
              <Button onClick={() => navigate('/assessments/new')} className="mt-6">
                Eerste AI Check starten
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {assessments.map((assessment) => {
              const route = assessment.route as AssessmentRoute;
              const config = ROUTE_CONFIG[route];
              const Icon = ROUTE_ICONS[route] ?? Info;
              const status = assessment.status as string;
              const isPending = status === 'pending_dpo' || status === 'pending_review';

              return (
                <button
                  key={assessment.id}
                  onClick={() => navigate(`/assessment/${assessment.id}`)}
                  className="w-full text-left"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Route-kleur indicator */}
                        <div
                          className="flex-shrink-0 rounded-full p-2"
                          style={{ backgroundColor: `${config.hex}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: config.hex }} />
                        </div>

                        {/* Inhoud */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground truncate">
                              {assessment.tool_name_raw}
                            </span>
                            <Badge variant="outline" className={`${config.bg} ${config.text} text-xs`}>
                              {config.label}
                            </Badge>
                            {isPending && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Clock className="h-3 w-3" />
                                {ASSESSMENT_STATUS_LABELS[status as AssessmentStatus] ?? status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {assessment.plain_language}
                          </p>
                        </div>

                        {/* Datum */}
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {format(new Date(assessment.created_at), 'd MMM yyyy', { locale: nl })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
