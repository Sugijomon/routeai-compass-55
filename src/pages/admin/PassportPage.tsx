import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePassport } from '@/hooks/usePassport';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROUTE_CONFIG } from '@/types/assessment';
import type { AssessmentRoute } from '@/types/assessment';
import { Shield, BookOpen, Wrench, AlertTriangle, GraduationCap, Info, Building2, ScrollText, Edit2, Save, Download } from 'lucide-react';
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
  const { identity, orgName, saveIdentity, toolCatalog, shadowDiscoveries, assessmentRegister, annexIII, literacyCoverage } = usePassport();

  const [editing12, setEditing12] = useState(false);
  const [identityForm, setIdentityForm] = useState({
    dpo_name: '', dpo_email: '', org_description: '',
    ai_policy_url: '', governance_scope: '', review_cycle: 'Jaarlijks',
  });

  const passportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (identity) {
      setIdentityForm({
        dpo_name: identity.dpo_name ?? '',
        dpo_email: identity.dpo_email ?? '',
        org_description: identity.org_description ?? '',
        ai_policy_url: identity.ai_policy_url ?? '',
        governance_scope: identity.governance_scope ?? '',
        review_cycle: identity.review_cycle ?? 'Jaarlijks',
      });
    }
  }, [identity]);

  const handlePdfExport = () => {
    const printContent = passportRef.current?.innerHTML ?? '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="nl">
      <head>
        <meta charset="UTF-8" />
        <title>Accountability Passport — ${orgName?.name ?? 'RouteAI'}</title>
        <style>
          body { font-family: Inter, system-ui, sans-serif; font-size: 12px; color: #111; max-width: 800px; margin: 0 auto; padding: 24px; }
          h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
          h2 { font-size: 14px; font-weight: 600; margin: 16px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          p, dd, td, li { font-size: 12px; color: #374151; }
          dt, th { font-size: 11px; color: #6b7280; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          th, td { text-align: left; padding: 6px 8px; border: 1px solid #e5e7eb; }
          th { background: #f9fafb; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
          .green { background: #dcfce7; color: #166534; }
          .yellow { background: #fef3c7; color: #92400e; }
          .orange { background: #ffedd5; color: #9a3412; }
          .red { background: #fee2e2; color: #991b1b; }
          button { display: none !important; }
          input, textarea { display: none !important; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Accountability Passport</h1>
        <p>Gegenereerd op ${format(new Date(), 'd MMMM yyyy', { locale: nl })} — ${orgName?.name ?? ''}</p>
        ${printContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 rounded-xl bg-primary/10 p-3">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Accountability Passport</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Automatisch gevuld register van AI-gebruik, assessments en AI-geletterdheid.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handlePdfExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exporteer als PDF
          </Button>
        </div>

        <div ref={passportRef} className="space-y-8">
          {/* ── SECTIE 1: Identiteit ── */}
          <Card id="passport-section-1">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <SectionHeader number="1" title="Organisatie-identiteit" icon={Building2} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editing12) {
                    saveIdentity.mutate(identityForm, { onSuccess: () => setEditing12(false) });
                  } else {
                    setEditing12(true);
                  }
                }}
                className="gap-2"
              >
                {editing12 ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                {editing12 ? 'Opslaan' : 'Bewerken'}
              </Button>
            </CardHeader>
            <CardContent>
              {editing12 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>DPO naam</Label>
                      <Input value={identityForm.dpo_name} onChange={e => setIdentityForm(f => ({ ...f, dpo_name: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label>DPO e-mail</Label>
                      <Input value={identityForm.dpo_email} onChange={e => setIdentityForm(f => ({ ...f, dpo_email: e.target.value }))} className="mt-1" type="email" />
                    </div>
                  </div>
                  <div>
                    <Label>Organisatiebeschrijving</Label>
                    <Textarea value={identityForm.org_description} onChange={e => setIdentityForm(f => ({ ...f, org_description: e.target.value }))} className="mt-1" rows={2} />
                  </div>
                  <div>
                    <Label>AI-beleid URL</Label>
                    <Input value={identityForm.ai_policy_url} onChange={e => setIdentityForm(f => ({ ...f, ai_policy_url: e.target.value }))} className="mt-1" placeholder="https://..." />
                  </div>
                  <Button
                    onClick={() => saveIdentity.mutate(identityForm, { onSuccess: () => setEditing12(false) })}
                    disabled={saveIdentity.isPending}
                    className="w-full"
                  >
                    {saveIdentity.isPending ? 'Opslaan...' : 'Opslaan'}
                  </Button>
                </div>
              ) : (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Organisatie</dt>
                    <dd className="font-medium mt-0.5">{orgName?.name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Actief sinds</dt>
                    <dd className="font-medium mt-0.5">
                      {orgName?.created_at ? format(new Date(orgName.created_at), 'd MMM yyyy', { locale: nl }) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">DPO</dt>
                    <dd className="font-medium mt-0.5">{identity?.dpo_name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">DPO e-mail</dt>
                    <dd className="font-medium mt-0.5">{identity?.dpo_email ?? '—'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Beschrijving</dt>
                    <dd className="font-medium mt-0.5">{identity?.org_description ?? 'Nog niet ingevuld.'}</dd>
                  </div>
                  {identity?.ai_policy_url && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">AI-beleid</dt>
                      <dd className="mt-0.5">
                        <a href={identity.ai_policy_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">
                          {identity.ai_policy_url}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </CardContent>
          </Card>

          {/* ── SECTIE 2: Governance-principes ── */}
          <Card id="passport-section-2">
            <CardHeader className="pb-2">
              <SectionHeader number="2" title="Governance-principes" icon={ScrollText} />
            </CardHeader>
            <CardContent>
              {editing12 ? (
                <div className="space-y-4">
                  <div>
                    <Label>Scope van dit Passport</Label>
                    <Textarea
                      value={identityForm.governance_scope}
                      onChange={e => setIdentityForm(f => ({ ...f, governance_scope: e.target.value }))}
                      placeholder="Bijv. 'Dit Passport dekt alle AI-toepassingen ingezet door medewerkers van [organisatie] binnen de EU.'"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Reviewcyclus</Label>
                    <Input value={identityForm.review_cycle} onChange={e => setIdentityForm(f => ({ ...f, review_cycle: e.target.value }))} className="mt-1" placeholder="Bijv. Jaarlijks" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Scope</p>
                    <p>{identity?.governance_scope ?? 'Nog niet ingevuld.'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Reviewcyclus</p>
                    <p>{identity?.review_cycle ?? 'Jaarlijks'}</p>
                  </div>
                  <div className="mt-4 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Vaste governance-principes (RouteAI)</p>
                    <p>• AI-rijbewijs is verplicht vóór gebruik van de Risk Engine</p>
                    <p>• Assessments worden deterministisch berekend op basis van EU AI Act</p>
                    <p>• Oranje-route assessments vereisen DPO-review vóór activatie</p>
                    <p>• Alle assessments worden onveranderlijk vastgelegd (audit trail)</p>
                    <p>• Incidenten worden gelogd en leiden terug naar leeractiviteiten</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── SECTIE 3: Tool Catalog ── */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader number="3" title="AI-tools register" icon={Wrench} />
            </CardHeader>
            <CardContent className="space-y-4">
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
                          <TableRow key={a.id as string}>
                            <TableCell className="font-medium">{a.tool_name_raw as string}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${config.bg} ${config.text} text-xs`}>
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{a.primary_archetype as string}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {a.routing_method === 'claude_assisted' ? 'Claude' : 'Deterministisch'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {a.status === 'pending_dpo' ? 'Wacht DPO' : a.status === 'pending_review' ? 'Review' : a.status as string}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(a.created_at as string)}</TableCell>
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
      </div>
    </AppLayout>
  );
}
