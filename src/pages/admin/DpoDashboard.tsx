import { useState } from 'react';
import { ComplianceExports } from '@/components/admin/ComplianceExports';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ClipboardCheck, ShieldAlert, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDpoDashboard } from '@/hooks/useDpoDashboard';
import { DpoNotificationBar } from '@/components/admin/DpoNotificationBar';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// Risico-badge kleur op basis van score
function RiskScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="outline">—</Badge>;
  if (score > 70) return <Badge className="bg-destructive text-destructive-foreground">{score}</Badge>;
  if (score >= 40) return <Badge className="bg-warning text-warning-foreground">{score}</Badge>;
  return <Badge className="bg-success text-success-foreground">{score}</Badge>;
}

// Risicoklasse badge
function RiskClassBadge({ cls }: { cls: string | null }) {
  if (!cls) return <Badge variant="outline">Onbekend</Badge>;
  const map: Record<string, { className: string; label: string }> = {
    unacceptable: { className: 'bg-destructive text-destructive-foreground', label: 'Onacceptabel' },
    high: { className: 'bg-warning text-warning-foreground', label: 'Hoog' },
    limited: { className: 'bg-primary text-primary-foreground', label: 'Beperkt' },
    minimal: { className: 'bg-success text-success-foreground', label: 'Minimaal' },
  };
  const config = map[cls] ?? { className: '', label: cls };
  return <Badge className={config.className}>{config.label}</Badge>;
}

// Kleuren voor staafdiagram
const BAR_COLORS: Record<string, string> = {
  minimal: 'hsl(142, 71%, 45%)',
  limited: 'hsl(199, 89%, 48%)',
  high: 'hsl(38, 92%, 50%)',
  unacceptable: 'hsl(0, 84%, 60%)',
};

export default function DpoDashboard() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;
  const {
    pendingReviews,
    reviewProfiles,
    highRiskCount,
    completedCount,
    toolDiscoveries,
    toolProfiles,
    riskDistribution,
    markReviewed,
    getProfileName,
    isLoading,
  } = useDpoDashboard();

  const [selectedRun, setSelectedRun] = useState<typeof pendingReviews[number] | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleOpenReview = (run: typeof pendingReviews[number]) => {
    setSelectedRun(run);
    setReviewNotes('');
  };

  const handleSaveReview = () => {
    if (!selectedRun || !reviewNotes.trim()) {
      toast.error('Vul review-notities in.');
      return;
    }
    markReviewed.mutate(
      { runId: selectedRun.id, notes: reviewNotes },
      {
        onSuccess: () => {
          toast.success('Review opgeslagen.');
          setSelectedRun(null);
        },
        onError: () => toast.error('Opslaan mislukt.'),
      }
    );
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return format(new Date(d), 'd MMM yyyy', { locale: nl });
  };

  return (
    <AdminPageLayout
      title="DPO Dashboard"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'DPO Dashboard' },
      ]}
    >
      {/* 0. NOTIFICATIEBALK */}
      {orgId && <DpoNotificationBar orgId={orgId} />}

      {/* 1. STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Openstaande reviews"
          value={isLoading ? '…' : pendingReviews.length}
          icon={ClipboardCheck}
          isLoading={isLoading}
          tooltip="Surveys die DPO-beoordeling vereisen"
        />
        <StatCard
          title="Hoog-risico tools"
          value={isLoading ? '…' : highRiskCount}
          icon={ShieldAlert}
          isLoading={isLoading}
          tooltip="Tools met classificatie 'high' of 'unacceptable'"
          valueClassName={highRiskCount > 0 ? 'text-destructive' : undefined}
        />
        <StatCard
          title="Surveys voltooid"
          value={isLoading ? '…' : completedCount}
          icon={BarChart3}
          isLoading={isLoading}
        />
      </div>

      {/* 2. OPENSTAANDE REVIEWS */}
      <section id="openstaande-reviews" className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Openstaande reviews</h2>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : pendingReviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">Geen openstaande reviews.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gebruiker</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Risicoscore</TableHead>
                  <TableHead>Dataclassificatie</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Actie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReviews.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">
                      {getProfileName(reviewProfiles, run.user_id)}
                    </TableCell>
                    <TableCell>{formatDate(run.submitted_at)}</TableCell>
                    <TableCell><RiskScoreBadge score={run.risk_score} /></TableCell>
                    <TableCell>
                      <Badge variant="outline">{run.data_classification ?? '—'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{run.assigned_tier ?? '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleOpenReview(run)}>
                        Beoordelen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* 3. TOOL INVENTARIS */}
      <section id="tool-inventaris" className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tool Inventaris</h2>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : toolDiscoveries.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nog geen tools ontdekt.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Risicoklasse</TableHead>
                  <TableHead>EU AI Act context</TableHead>
                  <TableHead>Ontdekt door</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toolDiscoveries.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell className="font-medium">{tool.tool_name}</TableCell>
                    <TableCell><RiskClassBadge cls={tool.application_risk_class} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {tool.eu_ai_act_context ?? '—'}
                    </TableCell>
                    <TableCell>{getProfileName(toolProfiles, tool.submitted_by)}</TableCell>
                    <TableCell>{formatDate(tool.submitted_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* 4. RISICO-DISTRIBUTIE */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Risico-distributie</h2>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="rounded-md border bg-card p-4" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tickFormatter={(v: string) =>
                    ({ minimal: 'Minimaal', limited: 'Beperkt', high: 'Hoog', unacceptable: 'Onacceptabel' }[v] ?? v)
                  }
                  className="text-xs"
                />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip
                  labelFormatter={(v: string) =>
                    ({ minimal: 'Minimaal', limited: 'Beperkt', high: 'Hoog', unacceptable: 'Onacceptabel' }[v] ?? v)
                  }
                  formatter={(value: number) => [value, 'Aantal tools']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDistribution.map((entry) => (
                    <Cell key={entry.name} fill={BAR_COLORS[entry.name] ?? 'hsl(215, 16%, 47%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Review Sheet */}
      <Sheet open={!!selectedRun} onOpenChange={(open) => !open && setSelectedRun(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Survey beoordelen</SheetTitle>
            <SheetDescription>
              Beoordeel de survey en voeg review-notities toe.
            </SheetDescription>
          </SheetHeader>

          {selectedRun && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Gebruiker</span>
                  <p className="font-medium">{getProfileName(reviewProfiles, selectedRun.user_id)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Risicoscore</span>
                  <p><RiskScoreBadge score={selectedRun.risk_score} /></p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dataclassificatie</span>
                  <p className="font-medium">{selectedRun.data_classification ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Primaire use-case</span>
                  <p className="font-medium">{selectedRun.primary_use_case ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Primaire zorg</span>
                  <p className="font-medium">{selectedRun.primary_concern ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tier</span>
                  <p><Badge variant="secondary">{selectedRun.assigned_tier ?? '—'}</Badge></p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Review-notities</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Voeg je beoordeling en eventuele actiepunten toe…"
                  rows={5}
                />
              </div>

              <Button
                onClick={handleSaveReview}
                disabled={markReviewed.isPending || !reviewNotes.trim()}
                className="w-full"
              >
                {markReviewed.isPending ? 'Opslaan…' : 'Opslaan en markeer als beoordeeld'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminPageLayout>
  );
}
