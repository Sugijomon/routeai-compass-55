import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Lock } from 'lucide-react';

interface ShadowScoreboardProps {
  planType: string;
}

export default function ShadowScoreboard({ planType }: ShadowScoreboardProps) {
  const hasAccess = planType === 'business' || planType === 'scale';

  if (!hasAccess) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Scoreboard beschikbaar bij upgrade</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Het Scoreboard toont een interactief overzicht van scan-prestaties,
            badges en team-participatie. Beschikbaar bij het Business- of Scale-plan.
          </p>
          <Badge variant="secondary" className="mt-4">
            Upgrade vereist
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Scoreboard
          </CardTitle>
          <CardDescription>
            Overzicht van scan-prestaties en badges binnen je organisatie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            Scoreboard wordt geladen…
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
