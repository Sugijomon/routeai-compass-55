import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { ROUTE_CONFIG, EU_ACT_CATEGORY_LABELS } from '@/types/assessment';
import type { AssessmentRoute, EuActCategory } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle, Info, XCircle, ClipboardCheck } from 'lucide-react';

export default function Assessment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!assessment) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl text-center py-12">
          <p className="text-muted-foreground">Assessment niet gevonden.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            ← Terug naar dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  const route = assessment.route as AssessmentRoute;
  const config = ROUTE_CONFIG[route];
  const euCategory = (assessment.eu_act_category ?? 'unknown') as EuActCategory;

  const RouteIcon = route === 'green' ? CheckCircle
    : route === 'yellow' ? Info
    : route === 'orange' ? AlertTriangle
    : XCircle;

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        {/* Terugknop */}
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Terug naar dashboard
        </Button>

        {/* Header */}
        <div>
          <p className="text-sm text-muted-foreground">AI Check</p>
          <h1 className="text-2xl font-bold mt-1">{assessment.tool_name_raw}</h1>
        </div>

        {/* Route-kaart */}
        <Card className={`border-l-4`} style={{ borderLeftColor: config.hex }}>
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl"
                style={{ backgroundColor: `${config.hex}15` }}
              >
                <RouteIcon className="h-6 w-6" style={{ color: config.hex }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${config.bg} ${config.text} border-0`}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    EU AI Act: {EU_ACT_CATEGORY_LABELS[euCategory]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{assessment.plain_language}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route-specifieke melding */}
        {route === 'orange' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Jouw DPO heeft een melding ontvangen. Het gebruik van deze toepassing start nadat de DPO heeft beoordeeld en eventuele extra voorwaarden zijn vastgesteld.
            </AlertDescription>
          </Alert>
        )}
        {route === 'red' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Gebruik is geblokkeerd. Neem contact op met IT en de juridische afdeling voordat je verdere stappen zet.
            </AlertDescription>
          </Alert>
        )}

        {/* Jouw instructies */}
        {assessment.user_instructions && assessment.user_instructions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jouw instructies</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(assessment.user_instructions as string[]).map((instr: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{instr}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Compliance-vlaggen */}
        {(assessment.dpia_required || assessment.fria_required || assessment.transparency_required) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance-vereisten</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {assessment.dpia_required && <Badge variant="outline">DPIA vereist</Badge>}
              {assessment.fria_required && <Badge variant="destructive">FRIA vereist</Badge>}
              {assessment.transparency_required && <Badge variant="secondary">Transparantieplicht (Art. 50)</Badge>}
            </CardContent>
          </Card>
        )}

        {/* Technische details */}
        <Accordion type="single" collapsible>
          <AccordionItem value="details">
            <AccordionTrigger>Technische details</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Archetype</p>
                  <p className="font-medium">{assessment.primary_archetype}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Route</p>
                  <p className="font-medium">{assessment.route}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Methode</p>
                  <p className="font-medium">{assessment.routing_method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Beslislogica</p>
                  <p className="font-medium">{assessment.decision_version}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </AppLayout>
  );
}
