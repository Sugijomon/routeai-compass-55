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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ClipboardCheck, ShieldAlert, BarChart3, FileText, CheckCircle, Flag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDpoDashboard } from '@/hooks/useDpoDashboard';
import { DpoNotificationBar } from '@/components/admin/DpoNotificationBar';
import { ROUTE_CONFIG, SEVERITY_CONFIG, ASSESSMENT_STATUS_LABELS } from '@/types/assessment';
import type { AssessmentStatus } from '@/types/assessment';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAssessmentReviewQueue } from '@/hooks/useAssessmentReviewQueue';
import { AssessmentReviewSheet } from '@/components/admin/AssessmentReviewSheet';
import { toast } from 'sonner';
import { useOrgIncidents } from '@/hooks/useIncidents';
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
  limited: 'hsl(38, 92%, 50%)',
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

  const { queue, isLoading: queueLoading, decide, getNotificationId } = useAssessmentReviewQueue();
  const { data: incidents, isLoading: incidentsLoading } = useOrgIncidents();

  const [selectedRun, setSelectedRun] = useState<typeof pendingReviews[number] | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<Record<string, unknown> | null>(null);

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
      {/* Notificatiebalk */}
      {orgId && <DpoNotificationBar orgId={orgId} />}

      <Tabs defaultValue="shadow" className="mt-2">
        <TabsList>
          <TabsTrigger value="shadow">Shadow AI Scan</TabsTrigger>
          <TabsTrigger value="checks" className="gap-2">
            AI Checks
            {queue.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                {queue.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2">
            Incidenten
            {(incidents ?? []).filter((inc: any) => !inc.dpo_reviewed_at && inc.dpo_notified).length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                {(incidents ?? []).filter((inc: any) => !inc.dpo_reviewed_at && inc.dpo_notified).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB: Shadow AI Scan ═══ */}
        <TabsContent value="shadow" className="space-y-8 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {/* Openstaande reviews */}
          <section>
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

          {/* Tool inventaris */}
          <section>
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

          {/* Risico-distributie */}
          <section>
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

          {/* Compliance exports */}
          {orgId && <ComplianceExports orgId={orgId} />}
        </TabsContent>

        {/* ═══ TAB: AI Checks ═══ */}
        <TabsContent value="checks" className="space-y-8 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Wacht op DPO"
              value={queueLoading ? '…' : queue.filter(a => (a.status as string) === 'pending_dpo').length}
              icon={FileText}
              isLoading={queueLoading}
              valueClassName={queue.filter(a => (a.status as string) === 'pending_dpo').length > 0 ? 'text-orange-600' : undefined}
            />
            <StatCard
              title="Toelichting vereist"
              value={queueLoading ? '…' : queue.filter(a => a.status === 'pending_review').length}
              icon={AlertTriangle}
              isLoading={queueLoading}
            />
            <StatCard
              title="Totaal in wachtrij"
              value={queueLoading ? '…' : queue.length}
              icon={ClipboardCheck}
              isLoading={queueLoading}
            />
          </div>

          {/* Queue-tabel */}
          {queueLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Geen openstaande AI Checks.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Archetype</TableHead>
                    <TableHead>Ingediend door</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((assessment) => {
                    const route = assessment.route as string;
                    const routeConfig = ROUTE_CONFIG[route as keyof typeof ROUTE_CONFIG];
                    const creatorProfile = assessment.profiles as Record<string, string> | null;
                    return (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.tool_name_raw}</TableCell>
                        <TableCell>
                          <Badge className={`${routeConfig?.bg ?? ''} ${routeConfig?.text ?? ''}`}>
                            {routeConfig?.label ?? route}
                          </Badge>
                        </TableCell>
                        <TableCell>{assessment.primary_archetype}</TableCell>
                        <TableCell>{creatorProfile?.full_name ?? '—'}</TableCell>
                        <TableCell>{formatDate(assessment.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={assessment.status === 'pending_review' ? 'destructive' : 'secondary'}>
                            {ASSESSMENT_STATUS_LABELS[assessment.status as AssessmentStatus] ?? assessment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setSelectedAssessment(assessment as unknown as Record<string, unknown>)}>
                            Beoordelen
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB: Incidenten ═══ */}
        <TabsContent value="incidents" className="space-y-6 mt-6">
          <div>
            <h2 className="text-xl font-semibold">Incidentlog</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gemelde AI-incidenten. Medium en Hoog triggeren automatisch een DPO-notificatie.
            </p>
          </div>

          {incidentsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (incidents ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Flag className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nog geen incidenten gemeld.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beschrijving</TableHead>
                    <TableHead>Ernst</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Gemeld door</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>DPO-status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(incidents ?? []).map((inc: any) => {
                    const sev = inc.severity as keyof typeof SEVERITY_CONFIG;
                    const sevConfig = SEVERITY_CONFIG[sev];
                    const reporterProfile = inc.profiles as Record<string, string> | null;
                    const assessmentData = inc.assessments as Record<string, string> | null;
                    return (
                      <TableRow key={inc.id}>
                        <TableCell className="max-w-xs">
                          <p className="text-sm line-clamp-2">{inc.description}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${sevConfig.bg} ${sevConfig.text} border-0 text-xs`}>
                            {sevConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {assessmentData?.tool_name_raw ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {reporterProfile?.full_name ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(inc.created_at)}
                        </TableCell>
                        <TableCell>
                          {inc.dpo_reviewed_at ? (
                            <Badge className="bg-green-100 text-green-800 border-0 text-xs">Behandeld</Badge>
                          ) : inc.dpo_notified ? (
                            <Badge variant="secondary" className="text-xs">DPO geïnformeerd</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Shadow Survey Review Sheet */}
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

      {/* Assessment Review Sheet */}
      <AssessmentReviewSheet
        assessment={selectedAssessment}
        notificationId={selectedAssessment ? getNotificationId(selectedAssessment.id as string) : null}
        onClose={() => setSelectedAssessment(null)}
        onDecide={(params) => decide.mutate(params, { onSuccess: () => setSelectedAssessment(null) })}
        isPending={decide.isPending}
      />
    </AdminPageLayout>
  );
}
