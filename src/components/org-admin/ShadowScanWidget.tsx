import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Props {
  orgId: string;
  onActivateTab?: (tab: string) => void;
}

export default function ShadowScanWidget({ orgId, onActivateTab }: Props) {
  // Org settings voor amnesty
  const { data: org } = useQuery({
    queryKey: ['shadow-widget-org', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  // Participatie
  const { data: invitedCount } = useQuery({
    queryKey: ['shadow-widget-invited', orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId);
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  const { data: completedCount } = useQuery({
    queryKey: ['shadow-widget-completed', orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from('shadow_survey_runs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .not('survey_completed_at', 'is', null);
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  // Tier verdeling
  const { data: tierCounts } = useQuery({
    queryKey: ['shadow-widget-tiers', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('shadow_survey_runs')
        .select('assigned_tier')
        .eq('org_id', orgId)
        .not('survey_completed_at', 'is', null);
      const counts = { standard: 0, advanced: 0, custom: 0 };
      (data ?? []).forEach(r => {
        const t = r.assigned_tier as keyof typeof counts;
        if (t in counts) counts[t]++;
      });
      return counts;
    },
    enabled: !!orgId,
  });

  // Openstaande reviews
  const { data: pendingCount } = useQuery({
    queryKey: ['shadow-widget-pending', orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from('shadow_survey_runs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('dpo_review_required', true)
        .is('review_notes', null);
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  // Amnesty status berekenen
  const settings = (org?.settings ?? {}) as Record<string, unknown>;
  const activatedAt = settings.amnesty_activated_at as string | undefined;
  const validDays = (settings.amnesty_valid_days as number) ?? 30;

  let amnestyBadge: React.ReactNode;
  if (!activatedAt) {
    amnestyBadge = <Badge variant="outline">Niet geconfigureerd</Badge>;
  } else {
    const expiry = addDays(new Date(activatedAt), validDays);
    const now = new Date();
    if (isBefore(now, expiry)) {
      amnestyBadge = (
        <Badge className="bg-success text-success-foreground">
          Actief tot {format(expiry, 'd MMM yyyy', { locale: nl })}
        </Badge>
      );
    } else {
      amnestyBadge = (
        <Badge variant="destructive">
          Verlopen op {format(expiry, 'd MMM yyyy', { locale: nl })}
        </Badge>
      );
    }
  }

  const invited = invitedCount ?? 0;
  const completed = completedCount ?? 0;
  const percentage = invited > 0 ? Math.round((completed / invited) * 100) : 0;
  const tiers = tierCounts ?? { standard: 0, advanced: 0, custom: 0 };
  const pending = pendingCount ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Shadow AI Scan</CardTitle>
        <CardDescription>Overzicht van de lopende inventarisatie</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Links: activatie + participatie */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Activatiestatus</p>
              {amnestyBadge}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Participatie</p>
              <p className="text-sm font-medium">
                {completed} / {invited} medewerkers ({percentage}%)
              </p>
              <Progress value={percentage} className="h-2 mt-1.5" />
            </div>
          </div>

          {/* Rechts: tiers + reviews */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Risicoverdeling</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">Standaard: {tiers.standard}</Badge>
                <Badge variant="secondary">Advanced: {tiers.advanced}</Badge>
                <Badge variant="secondary">Custom: {tiers.custom}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Openstaande reviews</p>
              {pending > 0 ? (
                <Badge variant="destructive">{pending}</Badge>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-success">
                  <CheckCircle className="h-4 w-4" /> Geen
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-4 mt-4 pt-3 border-t text-sm">
          <Link to="/admin/dpo-dashboard" className="text-primary hover:underline">
            → Volledig DPO-dashboard
          </Link>
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => onActivateTab?.('scan-config')}
          >
            → Scan heractiveren
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
