import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench, BarChart3, ShieldCheck, Users } from 'lucide-react';

// --- Types ---

interface ScoreboardConfig {
  show_tool_progress: boolean;
  show_use_cases: boolean;
  show_risk_categories: boolean;
  show_department_scores: boolean;
  show_individual: boolean;
}

interface Props {
  orgId: string;
  config: ScoreboardConfig;
  orgName: string;
}

// --- Progress Ring SVG ---

function ProgressRing({ value, label, size = 80 }: { value: number; label: string; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="text-center">
        <span className="text-lg font-bold tabular-nums">{value}%</span>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-[100px] leading-tight">{label}</p>
      </div>
    </div>
  );
}

// --- Component ---

export default function PublicScoreboardView({ orgId, config, orgName }: Props) {
  // Tool-progressie
  const { data: toolProgress } = useQuery({
    queryKey: ['scoreboard-tools', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_tools_catalog')
        .select('status')
        .eq('org_id', orgId);
      if (error) throw error;
      const approved = (data ?? []).filter(t => t.status === 'approved').length;
      const shadow = (data ?? []).filter(t => t.status === 'known_unconfigured').length;
      const total = (data ?? []).length;
      return { approved, shadow, total };
    },
    enabled: config.show_tool_progress,
  });

  // Use-cases (top 5 via tool_discoveries.use_case)
  const { data: useCases } = useQuery({
    queryKey: ['scoreboard-usecases', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tool_discoveries')
        .select('use_case')
        .eq('org_id', orgId)
        .not('use_case', 'is', null);
      if (error) throw error;
      // Aggregeer in JS
      const counts: Record<string, number> = {};
      (data ?? []).forEach(d => {
        const uc = d.use_case?.trim();
        if (uc) counts[uc] = (counts[uc] || 0) + 1;
      });
      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
    },
    enabled: config.show_use_cases,
  });

  // Risicocategorieën
  const { data: riskCategories } = useQuery({
    queryKey: ['scoreboard-risk', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tool_discoveries')
        .select('application_risk_class')
        .eq('org_id', orgId)
        .not('application_risk_class', 'is', null);
      if (error) throw error;
      const counts: Record<string, number> = { minimal: 0, limited: 0, high: 0, unacceptable: 0 };
      (data ?? []).forEach(d => {
        const rc = d.application_risk_class as string;
        if (rc in counts) counts[rc]++;
      });
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return { counts, total };
    },
    enabled: config.show_risk_categories,
  });

  // Participatie per afdeling
  const { data: departmentScores } = useQuery({
    queryKey: ['scoreboard-departments', orgId],
    queryFn: async () => {
      const [profilesRes, runsRes] = await Promise.all([
        supabase.from('profiles').select('id, department').eq('org_id', orgId),
        supabase.from('shadow_survey_runs').select('user_id').eq('org_id', orgId).not('survey_completed_at', 'is', null),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (runsRes.error) throw runsRes.error;

      const completedSet = new Set((runsRes.data ?? []).map(r => r.user_id));
      const deptMap: Record<string, { invited: number; completed: number }> = {};

      (profilesRes.data ?? []).forEach(p => {
        const dept = p.department || 'Onbekend';
        if (!deptMap[dept]) deptMap[dept] = { invited: 0, completed: 0 };
        deptMap[dept].invited++;
        if (completedSet.has(p.id)) deptMap[dept].completed++;
      });

      return Object.entries(deptMap)
        .map(([name, stats]) => ({
          name,
          ...stats,
          pct: stats.invited > 0 ? Math.round((stats.completed / stats.invited) * 100) : 0,
        }))
        .sort((a, b) => b.pct - a.pct);
    },
    enabled: config.show_department_scores,
  });

  const hasAnyEnabled = config.show_tool_progress || config.show_use_cases
    || config.show_risk_categories || config.show_department_scores;

  if (!hasAnyEnabled) {
    return (
      <p className="text-center text-sm text-muted-foreground py-12">
        Geen elementen geselecteerd. Schakel minimaal één element in.
      </p>
    );
  }

  const RISK_LABELS: Record<string, { label: string; color: string }> = {
    minimal: { label: 'Minimaal', color: 'bg-emerald-500' },
    limited: { label: 'Beperkt', color: 'bg-amber-400' },
    high: { label: 'Hoog', color: 'bg-orange-500' },
    unacceptable: { label: 'Onaanvaardbaar', color: 'bg-red-500' },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">{orgName}</h2>
        <p className="text-sm text-muted-foreground mt-1">AI Governance Scoreboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tool-progressie */}
        {config.show_tool_progress && toolProgress && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              Tool-inventaris
            </div>
            <div className="flex items-center gap-6">
              <ProgressRing
                value={toolProgress.total > 0
                  ? Math.round((toolProgress.approved / toolProgress.total) * 100)
                  : 0}
                label="goedgekeurd"
              />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span>{toolProgress.approved} goedgekeurd</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                  <span>{toolProgress.shadow} in beoordeling</span>
                </div>
                {toolProgress.shadow > 0 && toolProgress.approved > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Van {toolProgress.approved + toolProgress.shadow} tools naar {toolProgress.shadow} in beoordeling
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Use-cases */}
        {config.show_use_cases && useCases && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Waarvoor wordt AI ingezet
            </div>
            {useCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen use-cases geregistreerd.</p>
            ) : (
              <div className="space-y-2">
                {useCases.map(uc => {
                  const maxCount = useCases[0]?.count ?? 1;
                  const widthPct = Math.max(10, Math.round((uc.count / maxCount) * 100));
                  return (
                    <div key={uc.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="truncate max-w-[200px]">{uc.name}</span>
                        <span className="text-muted-foreground tabular-nums">{uc.count}×</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all duration-500"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Risicocategorieën */}
        {config.show_risk_categories && riskCategories && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Risicocategorieën
            </div>
            {riskCategories.total === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen risicoklassen bepaald.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(RISK_LABELS).map(([key, { label, color }]) => {
                  const count = riskCategories.counts[key] ?? 0;
                  const pct = riskCategories.total > 0 ? Math.round((count / riskCategories.total) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${color}`} />
                      <span className="text-sm flex-1">{label}</span>
                      <span className="text-sm tabular-nums font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Participatie per afdeling */}
        {config.show_department_scores && departmentScores && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Participatie per afdeling
            </div>
            {departmentScores.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen afdelingsdata beschikbaar.</p>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center py-2">
                {departmentScores.slice(0, 6).map(dept => (
                  <ProgressRing
                    key={dept.name}
                    value={dept.pct}
                    label={dept.name}
                    size={72}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
