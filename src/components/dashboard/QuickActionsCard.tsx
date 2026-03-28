import { Link } from 'react-router-dom';
import { Wrench, FileText, HelpCircle, ExternalLink, Sparkles, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function QuickActionsCard() {
  const { user } = useAuth();
  const { hasAiRijbewijs } = useUserProfile();

  const { data: assessmentCount } = useQuery({
    queryKey: ['quick-action-assessments', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const isFirstCheck = hasAiRijbewijs && (assessmentCount ?? 0) === 0;

  // Dynamische acties op basis van rijbewijs-status
  const actions = [
    hasAiRijbewijs
      ? {
          label: isFirstCheck ? 'Je eerste AI Check starten' : 'Start AI Check',
          description: isFirstCheck
            ? 'Laat zien wat je mag doen met AI'
            : 'Nieuwe AI-toepassing beoordelen',
          href: '/assessments/new',
          icon: Sparkles,
          color: 'text-primary',
          bg: 'bg-primary/10',
        }
      : {
          label: 'AI Literacy cursus',
          description: 'Behaal je AI-Rijbewijs',
          href: '/learn',
          icon: GraduationCap,
          color: 'text-primary',
          bg: 'bg-primary/10',
        },
    {
      label: 'AI Tools Bekijken',
      description: 'Goedgekeurde tools voor jouw taken',
      href: '/tools',
      icon: Wrench,
      color: 'text-accent-foreground',
      bg: 'bg-accent',
    },
    {
      label: 'Mijn Capabilities',
      description: 'Bekijk wat je mag doen',
      href: '/license',
      icon: FileText,
      color: 'text-muted-foreground',
      bg: 'bg-secondary',
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
