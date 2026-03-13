import { Users, Award, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminStatsCard() {
  const statItems = [
    { label: 'Totaal Medewerkers', value: '—', icon: Users, color: 'text-foreground', bg: 'bg-secondary' },
    { label: 'Actieve Licenties', value: '—', icon: Award, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Verlopen Licenties', value: '—', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Nog Geen Licentie', value: '—', icon: TrendingUp, color: 'text-muted-foreground', bg: 'bg-secondary' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Team Overzicht</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
