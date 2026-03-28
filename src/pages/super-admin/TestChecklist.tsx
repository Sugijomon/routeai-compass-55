import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatformHealthCheck } from '@/hooks/usePlatformHealthCheck';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Rocket } from 'lucide-react';

export default function TestChecklist() {
  const { data: checks = [], isLoading, refetch, isFetching } = usePlatformHealthCheck();

  const errorCount = checks.filter(c => c.status === 'error').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const okCount = checks.filter(c => c.status === 'ok').length;
  const launchReady = errorCount === 0 && !isLoading;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pre-launch checklist</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Platform-status voor launch op 24 april
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Hercheck
          </Button>
        </div>

        {/* Launch-status banner */}
        {!isLoading && (
          <div className={`flex items-center gap-4 rounded-lg border p-4 ${launchReady ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex-shrink-0">
              {launchReady
                ? <Rocket className="h-8 w-8 text-green-600" />
                : <XCircle className="h-8 w-8 text-red-600" />}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {launchReady ? 'Klaar voor launch' : `${errorCount} kritieke fout${errorCount > 1 ? 'en' : ''}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {okCount} checks geslaagd · {warningCount} waarschuwingen · {errorCount} fouten
              </p>
            </div>
          </div>
        )}

        {/* Check-items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform checks ({checks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5,6,7,8,9].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {checks.map((check, i) => {
                  const Icon = check.status === 'ok' ? CheckCircle
                    : check.status === 'warning' ? AlertTriangle
                    : XCircle;
                  const iconColor = check.status === 'ok' ? 'text-green-500'
                    : check.status === 'warning' ? 'text-amber-500'
                    : 'text-red-500';
                  const bgColor = check.status === 'ok' ? 'bg-green-50 border-green-100'
                    : check.status === 'warning' ? 'bg-amber-50 border-amber-100'
                    : 'bg-red-50 border-red-100';

                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${bgColor}`}>
                      <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{check.label}</p>
                        {check.detail && (
                          <p className="text-xs text-muted-foreground mt-0.5">{check.detail}</p>
                        )}
                      </div>
                      <Badge variant={check.status === 'ok' ? 'default' : check.status === 'warning' ? 'secondary' : 'destructive'} className="text-xs">
                        {check.status === 'ok' ? 'OK' : check.status === 'warning' ? 'Waarschuwing' : 'Fout'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Handmatige checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Handmatig te testen vóór launch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                'Shadow AI Scan doorlopen als medewerker (< 30 minuten)',
                'AI Literacy cursus les 1-6 bekijken in LMS-speler',
                'Examen doorlopen en zakken — ziet medewerker juiste feedback?',
                'Examen slagen — wordt rijbewijs toegekend?',
                'AI Check aanmaken (Groen) — klopt de resultaatpagina?',
                'AI Check aanmaken (Oranje) — verschijnt DPO-notificatie in queue?',
                'DPO akkoord geven op Oranje assessment — status → actief?',
                'Incident melden via assessment-pagina — verschijnt in DPO incidentlog?',
                'Passport-pagina openen — zijn secties 3, 5, 6, 12 gevuld?',
                'Passport sectie 1-2 invullen en opslaan',
                'PDF-export genereren — kan je hem openen en printen?',
                '≥ 10 typekaarten aanmaken in Model Library',
              ].map((item, i) => (
                <label key={i} className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input accent-primary" />
                  <span className="text-sm text-foreground">
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
