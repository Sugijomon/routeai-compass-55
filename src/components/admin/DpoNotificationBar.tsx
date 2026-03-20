// Notificatiebalk voor DPO Dashboard — toont contextuele meldingen
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TriangleAlert, Clock, ClipboardCheck, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface DpoNotificationBarProps {
  orgId: string;
}

interface Notification {
  id: string;
  severity: 'destructive' | 'warning' | 'info';
  icon: React.ReactNode;
  text: string;
  buttonLabel: string;
  onAction: () => void;
}

export function DpoNotificationBar({ orgId }: DpoNotificationBarProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Melding 1: Nieuw ontdekte tools die niet in org_tools_catalog staan
  const { data: newToolsCount } = useQuery({
    queryKey: ['dpo-notif-new-tools', orgId],
    queryFn: async () => {
      const [discoveriesRes, catalogRes] = await Promise.all([
        supabase
          .from('tool_discoveries')
          .select('tool_name')
          .eq('org_id', orgId),
        supabase
          .from('org_tools_catalog')
          .select('tool_name')
          .eq('org_id', orgId),
      ]);
      if (discoveriesRes.error) throw discoveriesRes.error;
      if (catalogRes.error) throw catalogRes.error;

      const catalogNames = new Set(
        (catalogRes.data ?? []).map(t => t.tool_name.toLowerCase())
      );
      const discoveredUnique = new Set(
        (discoveriesRes.data ?? []).map(t => t.tool_name.toLowerCase())
      );
      let count = 0;
      discoveredUnique.forEach(name => {
        if (!catalogNames.has(name)) count++;
      });
      return count;
    },
    enabled: !!orgId,
  });

  // Melding 2: Verlopend amnestievenster
  const { data: amnestyData } = useQuery({
    queryKey: ['dpo-notif-amnesty', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();
      if (error) throw error;
      const settings = (data?.settings ?? {}) as Record<string, unknown>;
      const activatedAt = settings.amnesty_activated_at as string | undefined;
      const validDays = (settings.amnesty_valid_days as number) ?? 30;
      if (!activatedAt) return null;

      const expiry = addDays(new Date(activatedAt), validDays);
      const remaining = differenceInCalendarDays(expiry, new Date());
      if (remaining < 0 || remaining > 5) return null;

      return {
        expiryDate: format(expiry, 'd MMMM yyyy', { locale: nl }),
        remaining,
      };
    },
    enabled: !!orgId,
  });

  // Melding 3: Openstaande reviews
  const { data: pendingReviewCount } = useQuery({
    queryKey: ['dpo-notif-pending-reviews', orgId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('shadow_survey_runs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('dpo_review_required', true)
        .or('review_notes.is.null,review_notes.eq.');
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  // Melding 4: Lage participatiegraad
  const { data: participationData } = useQuery({
    queryKey: ['dpo-notif-participation', orgId],
    queryFn: async () => {
      const [invitedRes, completedRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId),
        supabase
          .from('shadow_survey_runs')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .not('survey_completed_at', 'is', null),
      ]);
      if (invitedRes.error) throw invitedRes.error;
      if (completedRes.error) throw completedRes.error;

      const invited = invitedRes.count ?? 0;
      const completed = completedRes.count ?? 0;
      if (invited === 0) return null;
      const ratio = completed / invited;
      if (ratio >= 0.5) return null;
      return {
        invited,
        completed,
        percentage: Math.round(ratio * 100),
      };
    },
    enabled: !!orgId,
  });

  // Stel notificaties samen
  const notifications: Notification[] = [];

  if ((newToolsCount ?? 0) > 0) {
    notifications.push({
      id: 'new-tools',
      severity: 'warning',
      icon: <TriangleAlert className="h-4 w-4" />,
      text: `${newToolsCount} tool(s) ontdekt die nog niet in je catalogus staan`,
      buttonLabel: 'Beoordelen →',
      onAction: () => {
        document.getElementById('tool-inventaris')?.scrollIntoView({ behavior: 'smooth' });
      },
    });
  }

  if (amnestyData) {
    notifications.push({
      id: 'amnesty-expiring',
      severity: 'warning',
      icon: <Clock className="h-4 w-4" />,
      text: `Amnestievenster verloopt op ${amnestyData.expiryDate} (nog ${amnestyData.remaining} dagen)`,
      buttonLabel: 'Heractiveren →',
      onAction: () => navigate('/admin/org'),
    });
  }

  if ((pendingReviewCount ?? 0) > 0) {
    notifications.push({
      id: 'pending-reviews',
      severity: 'destructive',
      icon: <ClipboardCheck className="h-4 w-4" />,
      text: `${pendingReviewCount} risicoprofiel(en) wachten op jouw beoordeling`,
      buttonLabel: 'Bekijken →',
      onAction: () => {
        document.getElementById('openstaande-reviews')?.scrollIntoView({ behavior: 'smooth' });
      },
    });
  }

  if (participationData) {
    notifications.push({
      id: 'low-participation',
      severity: 'info',
      icon: <Users className="h-4 w-4" />,
      text: `${participationData.completed} van ${participationData.invited} medewerkers heeft de scan voltooid (${participationData.percentage}%)`,
      buttonLabel: 'Bekijken →',
      onAction: () => {
        toast.info('Stuur een herinnering via de Scan configuratie');
      },
    });
  }

  const visible = notifications.filter(n => !dismissed.includes(n.id));
  if (visible.length === 0) return null;

  const severityClasses: Record<string, string> = {
    warning: 'border-warning/50 text-warning-foreground bg-warning/10 [&>svg]:text-warning',
    info: 'border-primary/50 text-primary bg-primary/10 [&>svg]:text-primary',
  };

  return (
    <div className="space-y-2 mb-6">
      {visible.map(n => (
        <Alert
          key={n.id}
          variant={n.severity === 'destructive' ? 'destructive' : 'default'}
          className={n.severity !== 'destructive' ? severityClasses[n.severity] : undefined}
        >
          {n.icon}
          <AlertDescription className="flex items-center justify-between gap-2">
            <span className="text-sm">{n.text}</span>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={n.onAction}>
                {n.buttonLabel}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setDismissed(prev => [...prev, n.id])}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
