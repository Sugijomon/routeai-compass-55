import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Users, AlertTriangle, ClipboardCheck, Download, Flag, CheckCircle2,
  Search, Target, Loader2, Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  useDpoRiskProfiles,
  type SurveyRunWithProfile,
  type ToolDiscoveryRow,
} from '@/hooks/useDpoRiskProfiles';

// --- Constanten ---

const TIER_LABELS: Record<string, string> = {
  standard: 'Standaard',
  advanced: 'Gevorderd',
  custom: 'Maatwerk',
};

const RISK_CLASS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  minimal: { label: 'Minimaal', variant: 'secondary' },
  limited: { label: 'Beperkt', variant: 'outline' },
  high: { label: 'Hoog', variant: 'default' },
  unacceptable: { label: 'Onaanvaardbaar', variant: 'destructive' },
};

const BADGE_LABELS: Record<string, { icon: React.ElementType; label: string }> = {
  ai_scout: { icon: Search, label: 'AI Scout' },
  early_adopter: { icon: Target, label: 'Early Adopter' },
};

type Filter = 'all' | 'custom' | 'review';

// --- CSV export helper ---
function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const bom = '\uFEFF';
  const csv = bom + [headers.join(';'), ...rows.map((r) => r.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Component ---

export default function DpoRiskProfilesTab() {
  const {
    participationStats,
    tierDistribution,
    pendingReviewCount,
    surveyRuns,
    toolAggregation,
    allBadges,
    saveReviewNotes,
    setReviewRequired,
    getBadgesForUser,
    getToolsForRun,
    isLoading,
  } = useDpoRiskProfiles();

  const [filter, setFilter] = useState<Filter>('all');
  const [selectedRun, setSelectedRun] = useState<SurveyRunWithProfile | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Filter logica
  const filteredRuns = surveyRuns.filter((r) => {
    if (filter === 'custom') return r.assigned_tier === 'custom';
    if (filter === 'review') return r.dpo_review_required && !r.review_notes;
    return true;
  });

  const openDetail = (run: SurveyRunWithProfile) => {
    setSelectedRun(run);
    setReviewNotes(run.review_notes ?? '');
  };

  const handleSaveNotes = () => {
    if (!selectedRun) return;
    saveReviewNotes.mutate(
      { runId: selectedRun.id, notes: reviewNotes },
      { onSuccess: () => toast.success('Notities opgeslagen') }
    );
  };

  const handleFlagForReview = () => {
    if (!selectedRun) return;
    setReviewRequired.mutate(
      { runId: selectedRun.id, required: true },
      {
        onSuccess: () => {
          toast.success('Gevlagd voor opvolging');
          setSelectedRun({ ...selectedRun, dpo_review_required: true });
        },
      }
    );
  };

  const handleMarkReviewed = () => {
    if (!selectedRun) return;
    // Sla notes op + markeer als beoordeeld
    saveReviewNotes.mutate({ runId: selectedRun.id, notes: reviewNotes });
    setReviewRequired.mutate(
      { runId: selectedRun.id, required: false },
      {
        onSuccess: () => {
          toast.success('Gemarkeerd als beoordeeld');
          setSelectedRun({ ...selectedRun, dpo_review_required: false });
        },
      }
    );
  };

  // --- CSV exports ---
  const exportRiskProfiles = () => {
    const headers = ['Naam', 'E-mail', 'Afdeling', 'Scan voltooid', 'Risicoscore', 'Tier', 'Review vereist', 'Notities'];
    const rows = surveyRuns.map((r) => [
      r.full_name ?? '', r.email ?? '', r.department ?? '',
      r.survey_completed_at ? format(new Date(r.survey_completed_at), 'dd-MM-yyyy') : '',
      String(r.risk_score ?? ''), r.assigned_tier ?? '',
      r.dpo_review_required ? 'Ja' : 'Nee', r.review_notes ?? '',
    ]);
    downloadCsv('risicoprofiel-rapport.csv', headers, rows);
  };

  const exportToolInventory = () => {
    const headers = ['Naam medewerker', 'Tool', 'Categorie', 'Frequentie', 'Data-gevoeligheid', 'Toegangsmethode', 'Risicoklasse'];
    const rows: string[][] = [];
    surveyRuns.forEach((run) => {
      const tools = getToolsForRun(run.id);
      tools.forEach((t) => {
        rows.push([
          run.full_name ?? '', t.tool_name, t.use_case ?? '',
          t.use_frequency ?? '', (t.data_types_used ?? []).join(', '),
          '', t.application_risk_class ?? '',
        ]);
      });
    });
    downloadCsv('tool-inventaris-rapport.csv', headers, rows);
  };

  const exportBadges = () => {
    const headers = ['Naam medewerker', 'Afdeling', 'Badge', 'Verdiend op'];
    // Join badges with profiles from surveyRuns
    const profileMap = new Map(surveyRuns.map((r) => [r.user_id, r]));
    const rows = allBadges.map((b: any) => {
      const p = profileMap.get(b.user_id);
      return [
        p?.full_name ?? '', p?.department ?? '',
        b.badge_type, b.earned_at ? format(new Date(b.earned_at), 'dd-MM-yyyy') : '',
      ];
    });
    downloadCsv('badge-overzicht.csv', headers, rows);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SECTIE 1: Overzichtskaarten */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Participatie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Participatie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {participationStats.percentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {participationStats.completed} van {participationStats.invited} medewerkers
            </p>
          </CardContent>
        </Card>

        {/* Risicoverdeling */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Risicoverdeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <div>
                <span className="text-lg font-bold tabular-nums">{tierDistribution.standard}</span>
                <span className="text-xs text-muted-foreground ml-1">std</span>
              </div>
              <div>
                <span className="text-lg font-bold tabular-nums">{tierDistribution.advanced}</span>
                <span className="text-xs text-muted-foreground ml-1">adv</span>
              </div>
              <div>
                <span className="text-lg font-bold tabular-nums">{tierDistribution.custom}</span>
                <span className="text-xs text-muted-foreground ml-1">custom</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Openstaande reviews */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              Openstaande reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">{pendingReviewCount}</span>
              {pendingReviewCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Actie vereist
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTIE 2: Medewerker-tabel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Medewerker risicoprofielen</CardTitle>
          <CardDescription>Overzicht van alle voltooide scans</CardDescription>
          <div className="flex gap-2 pt-2">
            {([
              ['all', 'Alle'],
              ['custom', 'Hoog-risico'],
              ['review', 'Review vereist'],
            ] as [Filter, string][]).map(([value, label]) => (
              <Button
                key={value}
                variant={filter === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(value)}
              >
                {label}
                {value === 'review' && pendingReviewCount > 0 && (
                  <Badge variant="destructive" className="ml-1.5 text-xs px-1.5 py-0">
                    {pendingReviewCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Afdeling</TableHead>
                  <TableHead>Scan voltooid</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Notities</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRuns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Geen resultaten gevonden
                    </TableCell>
                  </TableRow>
                )}
                {filteredRuns.map((run) => {
                  const badges = run.user_id ? getBadgesForUser(run.user_id) : [];
                  return (
                    <TableRow
                      key={run.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openDetail(run)}
                    >
                      <TableCell className="font-medium">
                        {run.full_name ?? run.email ?? '—'}
                      </TableCell>
                      <TableCell>{run.department ?? '—'}</TableCell>
                      <TableCell className="tabular-nums">
                        {run.survey_completed_at
                          ? format(new Date(run.survey_completed_at), 'd MMM yyyy', { locale: nl })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {run.assigned_tier ? (
                          <Badge variant="outline" className="text-xs">
                            {TIER_LABELS[run.assigned_tier] ?? run.assigned_tier}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {badges.map((b) => {
                            const def = BADGE_LABELS[b];
                            if (!def) return null;
                            const Icon = def.icon;
                            return (
                              <span key={b} title={def.label}>
                                <Icon className="h-4 w-4 text-primary" />
                              </span>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {run.dpo_review_required && !run.review_notes ? (
                          <Badge variant="destructive" className="text-xs">Vereist</Badge>
                        ) : run.review_notes ? (
                          <Badge variant="secondary" className="text-xs">Beoordeeld</Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {run.review_notes ?? ''}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SECTIE 3: Tool-aggregatieoverzicht */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tool-overzicht (geaggregeerd)</CardTitle>
          <CardDescription>Welke AI-tools worden het meest gebruikt in de organisatie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead className="text-right">Medewerkers</TableHead>
                  <TableHead>Data-gevoeligheid</TableHead>
                  <TableHead>Risicoklasse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toolAggregation.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nog geen tools ontdekt
                    </TableCell>
                  </TableRow>
                )}
                {toolAggregation.map((t) => {
                  const rc = t.mostCommonRiskClass ? RISK_CLASS_CONFIG[t.mostCommonRiskClass] : null;
                  return (
                    <TableRow key={t.tool_name}>
                      <TableCell className="font-medium">{t.tool_name}</TableCell>
                      <TableCell>{t.category ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.count}</TableCell>
                      <TableCell>{t.mostCommonSensitivity ?? '—'}</TableCell>
                      <TableCell>
                        {rc ? (
                          <Badge variant={rc.variant} className="text-xs">
                            {rc.label}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Export-knoppen */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={exportRiskProfiles}>
          <Download className="h-4 w-4 mr-2" />
          Risicoprofiel-rapport (CSV)
        </Button>
        <Button variant="outline" size="sm" onClick={exportToolInventory}>
          <Download className="h-4 w-4 mr-2" />
          Tool-inventaris rapport (CSV)
        </Button>
        <Button variant="outline" size="sm" onClick={exportBadges}>
          <Download className="h-4 w-4 mr-2" />
          Badge-overzicht (CSV)
        </Button>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedRun} onOpenChange={(open) => !open && setSelectedRun(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedRun && (
            <DetailPanel
              run={selectedRun}
              tools={getToolsForRun(selectedRun.id)}
              badges={selectedRun.user_id ? getBadgesForUser(selectedRun.user_id) : []}
              reviewNotes={reviewNotes}
              onNotesChange={setReviewNotes}
              onSaveNotes={handleSaveNotes}
              onFlag={handleFlagForReview}
              onMarkReviewed={handleMarkReviewed}
              isSaving={saveReviewNotes.isPending || setReviewRequired.isPending}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// --- Detail zijpaneel ---

function DetailPanel({
  run,
  tools,
  badges,
  reviewNotes,
  onNotesChange,
  onSaveNotes,
  onFlag,
  onMarkReviewed,
  isSaving,
}: {
  run: SurveyRunWithProfile;
  tools: ToolDiscoveryRow[];
  badges: string[];
  reviewNotes: string;
  onNotesChange: (v: string) => void;
  onSaveNotes: () => void;
  onFlag: () => void;
  onMarkReviewed: () => void;
  isSaving: boolean;
}) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>{run.full_name ?? run.email ?? 'Medewerker'}</SheetTitle>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* Blok 1: Profiel samenvatting */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Profiel
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Afdeling</span>
            <span>{run.department ?? '—'}</span>
            <span className="text-muted-foreground">Scan voltooid</span>
            <span>{run.survey_completed_at ? format(new Date(run.survey_completed_at), 'd MMM yyyy', { locale: nl }) : '—'}</span>
            <span className="text-muted-foreground">Tier</span>
            <span>{run.assigned_tier ? TIER_LABELS[run.assigned_tier] ?? run.assigned_tier : '—'}</span>
            <span className="text-muted-foreground">Risicoscore</span>
            <span className="tabular-nums">{run.risk_score ?? '—'}</span>
            <span className="text-muted-foreground">Review vereist</span>
            <span>{run.dpo_review_required ? 'Ja' : 'Nee'}</span>
          </div>

          {badges.length > 0 && (
            <div className="flex gap-2 pt-1">
              {badges.map((b) => {
                const def = BADGE_LABELS[b];
                if (!def) return null;
                const Icon = def.icon;
                return (
                  <div key={b} className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">{def.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Blok 2: Tool-inventaris */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tool-inventaris ({tools.length})
          </h4>
          {tools.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen tools opgegeven</p>
          ) : (
            <div className="space-y-2">
              {tools.map((t) => {
                const rc = t.application_risk_class ? RISK_CLASS_CONFIG[t.application_risk_class] : null;
                return (
                  <div key={t.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{t.tool_name}</span>
                      {rc && (
                        <Badge variant={rc.variant} className="text-xs">
                          {rc.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {t.use_case && <span>Gebruik: {t.use_case}</span>}
                      {t.use_frequency && <span>Frequentie: {t.use_frequency}</span>}
                      {t.data_types_used && t.data_types_used.length > 0 && (
                        <span>Data: {t.data_types_used.join(', ')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Blok 3: DPO-notities */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            DPO-notities
          </h4>
          <Textarea
            value={reviewNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            onBlur={onSaveNotes}
            placeholder="Voeg notities toe..."
            rows={4}
          />
          <Button variant="outline" size="sm" onClick={onSaveNotes} disabled={isSaving}>
            {isSaving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            Opslaan
          </Button>
        </div>

        <Separator />

        {/* Blok 4: Acties */}
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={onFlag} disabled={isSaving}>
            <Flag className="h-4 w-4 mr-1.5" />
            Vlag voor opvolging
          </Button>
          <Button size="sm" onClick={onMarkReviewed} disabled={isSaving}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Markeer als beoordeeld
          </Button>
        </div>
      </div>
    </>
  );
}
