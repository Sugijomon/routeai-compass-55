import { Award, CheckCircle2, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AILicense } from '@/types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface LicenseStatusCardProps {
  license: AILicense | null;
}

export function LicenseStatusCard({ license }: LicenseStatusCardProps) {
  if (!license) {
    return (
      <Card className="border-warning/30 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Geen AI Licentie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Je hebt nog geen AI Licentie. Voltooi de training en toets om toegang te krijgen tot AI tools.
          </p>
          <Button asChild>
            <Link to="/training">
              Start Training
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isExpired = license.status === 'expired';
  const expiresAt = new Date(license.expiresAt);
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  return (
    <Card className={`${
      isExpired 
        ? 'border-destructive/30 bg-destructive/5' 
        : isExpiringSoon
        ? 'border-warning/30 bg-warning/5'
        : 'border-primary/30 bg-primary/5'
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isExpired ? (
            <>
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">Licentie Verlopen</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-primary">AI Licentie Actief</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Certificaatnummer</p>
            <p className="font-mono font-medium">{license.certificateNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Score</p>
            <p className="font-medium">{license.assessmentScore}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Uitgegeven</p>
            <p className="font-medium">
              {format(new Date(license.issuedAt), 'd MMM yyyy', { locale: nl })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Geldig tot</p>
            <p className={`font-medium ${isExpired || isExpiringSoon ? 'text-warning' : ''}`}>
              {format(expiresAt, 'd MMM yyyy', { locale: nl })}
              {isExpiringSoon && ` (${daysUntilExpiry} dagen)`}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-muted-foreground">
            Toegekende Capabilities ({license.grantedCapabilities.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {license.grantedCapabilities.slice(0, 4).map((cap) => (
              <span
                key={cap}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {cap.replace('cap-', '').replace(/-/g, ' ')}
              </span>
            ))}
            {license.grantedCapabilities.length > 4 && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                +{license.grantedCapabilities.length - 4} meer
              </span>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link to="/license">
            Bekijk Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
