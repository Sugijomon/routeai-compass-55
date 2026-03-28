import { AppLayout } from '@/components/layout/AppLayout';
import { usePassport } from '@/hooks/usePassport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROUTE_CONFIG } from '@/types/assessment';
import type { AssessmentRoute } from '@/types/assessment';
import { Shield, BookOpen, Wrench, AlertTriangle, GraduationCap, Info } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

function SectionHeader({ number, title, icon: Icon }: { number: string; title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sectie {number}</p>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
    </div>
  );
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return format(new Date(d), 'd MMM yyyy', { locale: nl });
}

export default function PassportPage() {
  const { toolCatalog, shadowDiscoveries, assessmentRegister, annexIII, literacyCoverage } = usePassport();

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-xl bg-primary/10 p-3">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Accountability Passport</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Automatisch gevuld register van AI-gebruik, assessments en AI-geletterdheid.
              Sectie 1–2 en PDF-export volgen in de volgende sprint.
            </p>
          </div>
        </div>

        {/* ── SECTIE 3: Tool Catalog ── */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader number="3" title="AI-tools register" icon={Wrench} />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stat row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Goedgekeurd', value: toolCatalog?.approved ?? 0, color: 'text-green-600' },
                { label: 'In review', value: toolCatalog?.underReview ?? 0, color: 'text-amber-600' },
                { label: 'Niet toegestaan', value: toolCatalog?.notApproved ?? 0, color: 'text-red-600' },
              ].map(s => (
                <div key={s.label} className="rounded-lg border bg-muted/30 p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Shadow AI */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Shadow AI discoveries</p>
              <p className="text-xs text-muted-foreground">
                Totaal ontdekt via Shadow AI Scan: {shadowDiscoveries?.total ?? 0}
              </p>
              {(shadowDiscoveries?.recentTools ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {shadowDiscoveries!.recentTools.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{t.tool_name}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── SECTIE 5: Assessment Register ── */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader number="5" title="Assessment register" icon={BookOpen} />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Route verdeling */}
            <div className="grid grid-cols-4 gap-3">
              {(['green', 'yellow', 'orange', 'red'] as AssessmentRoute[]).map(route => {
                const config = ROUTE_CONFIG[route];
                const count = assessmentRegister?.byRoute[route] ?? 0;
                return (
                  <div key={route} className="rounded-lg border p-3 text-center" style={{ borderColor: `${config.hex}40` }}>
                    <p className="text-2xl font-bold" style={{ color: config.hex }}>{count}</p>
                    <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Recente assessments */}
            {(assessmentRegister?.recent ?? []).length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Archetype</TableHead>
                      <TableHead>Methode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessmentRegister!.recent.map(a => {
                      const config = ROUTE_CONFIG[a.route as AssessmentRoute];
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.tool_name_raw}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${config.bg} ${config.text} text-xs`}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{a.primary_archetype}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {a.routing_method === 'claude_assisted' ? 'Claude' : 'Deterministisch'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {a.status === 'pending_dpo' ? 'Wacht DPO' : a.status === 'pending_review' ? 'Review' : a.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(a.created_at)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen assessments aangemaakt.</p>
            )}
          </CardContent>
        </Card>

        {/* ── SECTIE 6: Annex III (Oranje) ── */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader number="6" title="Hoog-risico AI index (Annex III)" icon={AlertTriangle} />
          </CardHeader>
          <CardContent>
            {(annexIII ?? []).length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">Geen Oranje assessments geregistreerd.</p>
                <p className="text-xs text-muted-foreground mt-1">Oranje route = hoog-risico AI (EU AI Act Annex III).</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Archetype</TableHead>
                      <TableHead>Ingediend door</TableHead>
                      <TableHead>DPIA</TableHead>
                      <TableHead>FRIA</TableHead>
                      <TableHead>DPO-toezicht</TableHead>
                      <TableHead>Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(annexIII ?? []).map((a) => {
                      const submitterProfile = a.profiles as Record<string, unknown> | null;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.tool_name_raw}</TableCell>
                          <TableCell className="text-muted-foreground">{a.primary_archetype}</TableCell>
                          <TableCell className="text-muted-foreground">{(submitterProfile?.full_name as string) ?? '—'}</TableCell>
                          <TableCell>
                            {a.dpia_required
                              ? <Badge variant="destructive" className="text-xs">Vereist</Badge>
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {a.fria_required
                              ? <Badge variant="destructive" className="text-xs">Vereist</Badge>
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {a.dpo_oversight_required
                              ? <Badge className="text-xs bg-amber-100 text-amber-800">Ja</Badge>
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(a.created_at)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTIE 12: AI Literacy dekking ── */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader number="12" title="AI Literacy dekking" icon={GraduationCap} />
          </CardHeader>
          <CardContent>
            {/* Coverage visual */}
            <div className="flex items-center gap-8">
              <div className="relative h-28 w-28 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-muted" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                    className="stroke-primary"
                    strokeDasharray={`${(literacyCoverage?.percentage ?? 0) * 2.64} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground">
                  {literacyCoverage?.percentage ?? 0}%
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-3xl font-bold text-foreground">
                  {literacyCoverage?.withRijbewijs ?? 0}
                  <span className="text-lg text-muted-foreground font-normal">/{literacyCoverage?.total ?? 0}</span>
                </p>
                <p className="text-sm text-muted-foreground">medewerkers met AI-rijbewijs</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <Info className="h-3 w-3" />
                  Dit veld is SYSTEM_ONLY — alleen het systeem kan het bijwerken.
                </p>
              </div>
            </div>

            {(literacyCoverage?.percentage ?? 0) < 80 && (literacyCoverage?.total ?? 0) > 0 && (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-md p-3 mt-4">
                Aanbevolen dekking: ≥80% vóór Oranje assessments actief zijn.
                Huidige dekking: {literacyCoverage?.percentage ?? 0}%.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
