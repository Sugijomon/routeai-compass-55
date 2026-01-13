import { Award, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Clock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/useAppStore';
import { baseCapabilities, categoryLabels, getCapabilityById } from '@/data/capabilities';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const License = () => {
  const { getCurrentUser } = useAppStore();
  const user = getCurrentUser();
  const license = user?.license;

  if (!license) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl text-center py-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/10 mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-warning" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Geen AI Licentie</h1>
          <p className="text-muted-foreground mb-8">
            Je hebt nog geen AI Licentie. Voltooi de AI Literacy training en leg de toets af om je licentie te behalen.
          </p>
          <Button asChild size="lg">
            <Link to="/training">
              Start Training
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isExpired = license.status === 'expired';
  const grantedCapabilities = license.grantedCapabilities
    .map(id => getCapabilityById(id))
    .filter(Boolean);

  // Group capabilities by category
  const capabilitiesByCategory = grantedCapabilities.reduce((acc, cap) => {
    if (!cap) return acc;
    if (!acc[cap.category]) acc[cap.category] = [];
    acc[cap.category].push(cap);
    return acc;
  }, {} as Record<string, typeof grantedCapabilities>);

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isExpired ? 'bg-destructive/10' : 'bg-primary/10'
          }`}>
            <Award className={`h-6 w-6 ${isExpired ? 'text-destructive' : 'text-primary'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mijn AI Licentie</h1>
            <p className="text-muted-foreground">
              {isExpired 
                ? 'Je licentie is verlopen'
                : 'Overzicht van je AI authority en capabilities'}
            </p>
          </div>
        </div>
      </div>

      {/* License Certificate */}
      <Card className={`mb-8 ${isExpired ? 'border-destructive/30' : 'border-primary/30'}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${
                isExpired ? 'bg-destructive/10' : 'bg-primary/10'
              }`}>
                {isExpired ? (
                  <XCircle className="h-8 w-8 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isExpired ? 'Licentie Verlopen' : 'AI Licentie Actief'}
                </h2>
                <p className="font-mono text-muted-foreground">{license.certificateNumber}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-right">
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold">{license.assessmentScore}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capabilities</p>
                <p className="text-xl font-bold">{license.grantedCapabilities.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uitgegeven</p>
                <p className="font-medium">{format(new Date(license.issuedAt), 'd MMM yyyy', { locale: nl })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Geldig tot</p>
                <p className={`font-medium ${isExpired ? 'text-destructive' : ''}`}>
                  {format(new Date(license.expiresAt), 'd MMM yyyy', { locale: nl })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Toegekende Capabilities</h2>
        <p className="text-muted-foreground">
          Dit zijn de AI-activiteiten die je mag uitvoeren binnen de gestelde grenzen.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(capabilitiesByCategory).map(([category, caps]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                {categoryLabels[category as keyof typeof categoryLabels]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {caps.map((cap) => (
                <div key={cap?.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{cap?.name}</h3>
                    <Badge variant="outline" className="status-approved">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Toegekend
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{cap?.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Allowed */}
                    <div className="rounded-lg bg-primary/5 p-3">
                      <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">
                        ✓ Toegestaan
                      </p>
                      <ul className="space-y-1">
                        {cap?.examples.allowed.slice(0, 2).map((example, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Not Allowed */}
                    <div className="rounded-lg bg-destructive/5 p-3">
                      <p className="text-xs font-semibold text-destructive mb-2 uppercase tracking-wide">
                        ✗ Niet Toegestaan
                      </p>
                      <ul className="space-y-1">
                        {cap?.examples.notAllowed.slice(0, 2).map((example, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <XCircle className="h-3 w-3 text-destructive mt-1 flex-shrink-0" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Not Granted Capabilities */}
      <Card className="mt-8 border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
            Niet Toegekende Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Deze capabilities heb je nog niet. Verhoog je score of vraag uitbreiding aan bij je administrator.
          </p>
          <div className="flex flex-wrap gap-2">
            {baseCapabilities
              .filter(cap => !license.grantedCapabilities.includes(cap.id))
              .map(cap => (
                <Badge key={cap.id} variant="outline" className="text-muted-foreground">
                  {cap.name}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default License;
