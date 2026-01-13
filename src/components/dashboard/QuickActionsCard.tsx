import { Link } from 'react-router-dom';
import { Wrench, FileText, HelpCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const actions = [
  {
    label: 'AI Tools Bekijken',
    description: 'Goedgekeurde tools voor jouw taken',
    href: '/tools',
    icon: Wrench,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Mijn Capabilities',
    description: 'Bekijk wat je mag doen',
    href: '/license',
    icon: FileText,
    color: 'text-accent-foreground',
    bg: 'bg-accent',
  },
  {
    label: 'Hulp & FAQ',
    description: 'Veelgestelde vragen',
    href: '/help',
    icon: HelpCircle,
    color: 'text-muted-foreground',
    bg: 'bg-secondary',
  },
];

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Snelle Acties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              to={action.href}
              className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.bg}`}>
                <Icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
