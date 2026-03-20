import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

function downloadCsv(rows: string[][], filename: string) {
  const content = rows
    .map(row =>
      row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
  const blob = new Blob(['\uFEFF' + content], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const dateSuffix = () => format(new Date(), 'yyyy-MM-dd');

interface Props {
  orgId: string;
}

export function ComplianceExports({ orgId }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const exportRiskProfiles = async () => {
    setLoading('risk');
    try {
      const { data: runs } = await supabase
        .from('shadow_survey_runs')
        .select('*')
        .eq('org_id', orgId);
      const userIds = [...new Set((runs ?? []).map(r => r.user_id).filter(Boolean) as string[])];
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, full_name, email, department').in('id', userIds)
        : { data: [] };
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      const header = ['Naam', 'E-mail', 'Afdeling', 'Scan voltooid op', 'Risicoscore', 'Tier', 'DPO-review vereist', 'Review-notities'];
      const rows = (runs ?? []).map(r => {
        const p = r.user_id ? profileMap[r.user_id] : null;
        return [
          p?.full_name ?? '',
          p?.email ?? '',
          p?.department ?? '',
          r.survey_completed_at ? format(new Date(r.survey_completed_at), 'dd-MM-yyyy') : '',
          String(r.risk_score ?? ''),
          r.assigned_tier ?? '',
          r.dpo_review_required ? 'Ja' : 'Nee',
          r.review_notes ?? '',
        ];
      });
      downloadCsv([header, ...rows], `risicoprofielen-${dateSuffix()}.csv`);
    } catch {
      toast.error('Export mislukt.');
    } finally {
      setLoading(null);
    }
  };

  const exportToolInventory = async () => {
    setLoading('tools');
    try {
      const { data: tools } = await supabase
        .from('tool_discoveries')
        .select('*')
        .eq('org_id', orgId);
      const submitterIds = [...new Set((tools ?? []).map(t => t.submitted_by).filter(Boolean) as string[])];
      const { data: profiles } = submitterIds.length
        ? await supabase.from('profiles').select('id, full_name, department').in('id', submitterIds)
        : { data: [] };
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      const header = ['Naam medewerker', 'Afdeling', 'Tool naam', 'Categorie', 'Frequentie', 'Data-gevoeligheid', 'Toegangsmethode', 'EU AI Act risicoklasse', 'Datum ontdekt'];
      const rows = (tools ?? []).map(t => {
        const p = t.submitted_by ? profileMap[t.submitted_by] : null;
        return [
          p?.full_name ?? '',
          p?.department ?? '',
          t.tool_name,
          '', // categorie zit niet in tool_discoveries
          t.use_frequency ?? '',
          (t.data_types_used ?? []).join('; '),
          '', // toegangsmethode zit niet in tool_discoveries
          t.application_risk_class ?? '',
          t.submitted_at ? format(new Date(t.submitted_at), 'dd-MM-yyyy') : '',
        ];
      });
      downloadCsv([header, ...rows], `tool-inventaris-${dateSuffix()}.csv`);
    } catch {
      toast.error('Export mislukt.');
    } finally {
      setLoading(null);
    }
  };

  const exportBadges = async () => {
    setLoading('badges');
    try {
      const { data: badges } = await supabase
        .from('user_badges')
        .select('*')
        .eq('org_id', orgId);
      const userIds = [...new Set((badges ?? []).map(b => b.user_id).filter(Boolean))];
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, full_name, department').in('id', userIds)
        : { data: [] };
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      const badgeLabels: Record<string, string> = { early_adopter: 'Early Adopter', ai_scout: 'AI Scout' };
      const header = ['Naam medewerker', 'Afdeling', 'Badge', 'Datum verdiend'];
      const rows = (badges ?? []).map(b => {
        const p = profileMap[b.user_id];
        return [
          p?.full_name ?? '',
          p?.department ?? '',
          badgeLabels[b.badge_type] ?? b.badge_type,
          format(new Date(b.earned_at), 'dd-MM-yyyy'),
        ];
      });
      downloadCsv([header, ...rows], `badges-${dateSuffix()}.csv`);
    } catch {
      toast.error('Export mislukt.');
    } finally {
      setLoading(null);
    }
  };

  const buttons = [
    { key: 'risk', label: 'Risicoprofiel-rapport (CSV)', onClick: exportRiskProfiles },
    { key: 'tools', label: 'Tool-inventaris (CSV)', onClick: exportToolInventory },
    { key: 'badges', label: 'Badge-overzicht (CSV)', onClick: exportBadges },
  ];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-1">Compliance exports</h2>
      <p className="text-sm text-muted-foreground mb-4">Download rapporten voor je audit-dossier</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {buttons.map(b => (
          <Button
            key={b.key}
            variant="outline"
            onClick={b.onClick}
            disabled={loading !== null}
          >
            {loading === b.key ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {b.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
