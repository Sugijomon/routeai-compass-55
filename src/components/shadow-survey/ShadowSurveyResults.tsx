import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowRight, CheckCircle2, Clock, XCircle, HelpCircle, ShieldAlert } from 'lucide-react';

type ToolStatus = 'green' | 'yellow' | 'red' | 'grey';

interface ToolMatchResult {
  toolName: string;
  discoveryId: string;
  status: ToolStatus;
  reason?: string;
  alternative?: string;
  matchedToolId?: string;
}

const STATUS_CONFIG: Record<ToolStatus, {
  label: string;
  icon: React.ElementType;
  badgeClass: string;
  cardBorderClass: string;
}> = {
  green: {
    label: 'Goedgekeurd',
    icon: CheckCircle2,
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cardBorderClass: 'border-green-300 dark:border-green-700',
  },
  yellow: {
    label: 'Goedkeuring vereist',
    icon: Clock,
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    cardBorderClass: 'border-yellow-300 dark:border-yellow-700',
  },
  red: {
    label: 'Niet toegestaan',
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    cardBorderClass: 'border-red-300 dark:border-red-700',
  },
  grey: {
    label: 'Wordt beoordeeld',
    icon: HelpCircle,
    badgeClass: 'bg-muted text-muted-foreground',
    cardBorderClass: 'border-muted-foreground/30',
  },
};

interface Props {
  surveyRunId: string;
  orgId: string;
  onComplete: () => void;
}

export default function ShadowSurveyResults({ surveyRunId, orgId, onComplete }: Props) {
  const [results, setResults] = useState<ToolMatchResult[]>([]);
  const [processing, setProcessing] = useState(true);

  // Haal tool_discoveries op voor deze run
  const { data: discoveries, isLoading: discoveriesLoading } = useQuery({
    queryKey: ['survey-tool-discoveries', surveyRunId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tool_discoveries')
        .select('id, tool_name')
        .eq('survey_run_id', surveyRunId);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Haal org_tools_catalog op voor deze org
  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: ['org-catalog-for-matching', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_tools_catalog')
        .select('id, tool_name, status, notes')
        .eq('org_id', orgId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: libraryData, isLoading: libraryLoading } = useQuery({
    queryKey: ['tools-library-for-matching'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tools_library')
        .select('id, name')
        .eq('status', 'published');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Match-logica: zodra alle data geladen is
  useEffect(() => {
    if (discoveriesLoading || catalogLoading || libraryLoading) return;
    if (!discoveries || !catalogData || !libraryData) return;

    const processMatches = async () => {
      setProcessing(true);

      // Bouw lookup: tool_name (lowercase) -> catalog entry
      const catalogByName = new Map(
        catalogData.map((c) => [c.tool_name.toLowerCase(), c])
      );

      const matched: ToolMatchResult[] = [];
      const updates: { discoveryId: string; toolId: string }[] = [];
      const pendingIds: string[] = [];

      for (const disc of discoveries) {
        const toolNameLower = disc.tool_name.toLowerCase();

        // Zoek match in org_tools_catalog (case-insensitive)
        const catalogEntry = catalogByName.get(toolNameLower) ??
          [...catalogByName.entries()].find(([name]) =>
            name.includes(toolNameLower) || toolNameLower.includes(name)
          )?.[1];

        // Zoek match in tools_library voor resulting_tool_id
        const libraryMatch = libraryData.find((lib) =>
          lib.name.toLowerCase().includes(toolNameLower) ||
          toolNameLower.includes(lib.name.toLowerCase())
        );

        if (libraryMatch) {
          updates.push({ discoveryId: disc.id, toolId: libraryMatch.id });
        }

        if (!catalogEntry) {
          // Niet in catalogus → grijs
          matched.push({
            toolName: disc.tool_name,
            discoveryId: disc.id,
            status: 'grey',
          });
          pendingIds.push(disc.id);
        } else if (catalogEntry.status === 'not_approved') {
          // Niet goedgekeurd → rood
          matched.push({
            toolName: disc.tool_name,
            discoveryId: disc.id,
            status: 'red',
            reason: catalogEntry.notes || 'Deze tool is niet goedgekeurd voor gebruik binnen de organisatie.',
            matchedToolId: libraryMatch?.id,
          });
        } else if (catalogEntry.status === 'under_review' || catalogEntry.status === 'known_unconfigured') {
          // Wordt beoordeeld → geel
          matched.push({
            toolName: disc.tool_name,
            discoveryId: disc.id,
            status: 'yellow',
            matchedToolId: libraryMatch?.id,
          });
        } else {
          // approved → groen
          matched.push({
            toolName: disc.tool_name,
            discoveryId: disc.id,
            status: 'green',
            matchedToolId: libraryMatch?.id,
          });
        }
      }

      // Update resulting_tool_id in tool_discoveries
      for (const u of updates) {
        await supabase
          .from('tool_discoveries')
          .update({ resulting_tool_id: u.toolId })
          .eq('id', u.discoveryId);
      }

      // Zet review_status='pending' voor niet-gevonden tools
      for (const id of pendingIds) {
        await supabase
          .from('tool_discoveries')
          .update({ review_status: 'pending' })
          .eq('id', id);
      }

      setResults(matched);
      setProcessing(false);
    };

    processMatches();
  }, [discoveries, catalogData, libraryData, discoveriesLoading, catalogLoading, libraryLoading]);

  const isLoading = discoveriesLoading || catalogLoading || libraryLoading || processing;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Stap 5 van 6 — Tool resultaten</p>
          <Progress value={75} className="h-2" />
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Je tools worden gematcht met de organisatiecatalogus…</p>
        </div>
      </div>
    );
  }

  const greenCount = results.filter((r) => r.status === 'green').length;
  const yellowCount = results.filter((r) => r.status === 'yellow').length;
  const redCount = results.filter((r) => r.status === 'red').length;
  const greyCount = results.filter((r) => r.status === 'grey').length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Stap 5 van 6 — Tool resultaten</p>
        <Progress value={75} className="h-2" />
      </div>

      {/* Samenvatting */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { count: greenCount, label: 'Goedgekeurd', color: 'text-green-600' },
          { count: yellowCount, label: 'Wacht op goedkeuring', color: 'text-yellow-600' },
          { count: redCount, label: 'Niet toegestaan', color: 'text-red-600' },
          { count: greyCount, label: 'Wordt beoordeeld', color: 'text-muted-foreground' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-tool kaartjes */}
      <div className="space-y-3">
        {results.map((r) => {
          const config = STATUS_CONFIG[r.status];
          const Icon = config.icon;

          return (
            <Card key={r.discoveryId} className={config.cardBorderClass}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{r.toolName}</span>
                      <Badge className={config.badgeClass + ' text-xs'}>
                        {config.label}
                      </Badge>
                    </div>

                    {r.status === 'green' && (
                      <p className="text-sm text-muted-foreground">
                        Direct goedgekeurd voor gebruik.
                      </p>
                    )}

                    {r.status === 'yellow' && (
                      <p className="text-sm text-muted-foreground">
                        Goedkeuring manager vereist (verwacht: 1-2 werkdagen).
                      </p>
                    )}

                    {r.status === 'red' && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Niet toegestaan{r.reason ? `: ${r.reason}` : '.'}
                        </p>
                        {r.alternative && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Aanbevolen alternatief:</span> {r.alternative}
                          </p>
                        )}
                      </div>
                    )}

                    {r.status === 'grey' && (
                      <p className="text-sm text-muted-foreground">
                        Wordt beoordeeld — nog niet in onze tool-catalogus.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {results.some((r) => r.status === 'red' || r.status === 'grey') && (
        <div className="flex items-start gap-3 rounded-lg border border-muted-foreground/20 bg-muted/50 p-4">
          <ShieldAlert className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Tools met de status 'niet toegestaan' of 'wordt beoordeeld' mag je niet gebruiken totdat ze zijn goedgekeurd.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onComplete} size="lg">
          Begrepen, volgende stap
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
