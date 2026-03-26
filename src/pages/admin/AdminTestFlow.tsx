// Tijdelijke testpagina voor het verifiëren van scan-flow, tool-discoveries en transfer
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';

interface ScanRun {
  id: string;
  user_id: string | null;
  created_at: string;
  governance: string | null;
  completed_at: string | null;
}

interface ToolDiscovery {
  tool_name: string;
  use_case: string | null;
  application_risk_class: string | null;
  submitted_at: string | null;
}

export default function AdminTestFlow() {
  const navigate = useNavigate();

  // Sectie 1 — Scan-flow
  const [scanLoading, setScanLoading] = useState(false);
  const [scanRuns, setScanRuns] = useState<ScanRun[] | null>(null);

  // Sectie 2 — Tool discoveries
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolDiscoveries, setToolDiscoveries] = useState<ToolDiscovery[] | null>(null);

  // Sectie 3 — RouteAI Transfer
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferCount, setTransferCount] = useState<number | null>(null);

  const [hidden, setHidden] = useState(false);

  const checkScanData = async () => {
    setScanLoading(true);
    try {
      const { data, error } = await supabase
        .from('shadow_survey_runs')
        .select('id, user_id, submitted_at, extra_data, survey_completed_at')
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const mapped: ScanRun[] = (data ?? []).map(r => {
        const extra = r.extra_data as Record<string, unknown> | null;
        const gov = extra?.governance ? JSON.stringify(extra.governance) : null;
        return {
          id: r.id,
          user_id: r.user_id,
          created_at: r.submitted_at ?? '',
          governance: gov,
          completed_at: r.survey_completed_at ?? null,
        };
      });
      setScanRuns(mapped);
    } catch {
      setScanRuns([]);
    } finally {
      setScanLoading(false);
    }
  };

  const checkToolDiscoveries = async () => {
    setToolsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tool_discoveries')
        .select('tool_name, use_case, application_risk_class, submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setToolDiscoveries(data ?? []);
    } catch {
      setToolDiscoveries([]);
    } finally {
      setToolsLoading(false);
    }
  };

  const checkTransfer = async () => {
    setTransferLoading(true);
    try {
      // Haal organisaties op met plan_type routeai of both
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .in('plan_type', ['routeai', 'both']);

      if (orgError) throw orgError;

      const orgIds = (orgs ?? []).map(o => o.id);

      if (orgIds.length === 0) {
        setTransferCount(0);
        return;
      }

      // Tel profielen met routeai_invited_at in die organisaties
      const { count, error: pError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('org_id', orgIds)
        .not('routeai_invited_at', 'is', null);

      if (pError) throw pError;
      setTransferCount(count ?? 0);
    } catch {
      setTransferCount(0);
    } finally {
      setTransferLoading(false);
    }
  };

  if (hidden) {
    return (
      <AdminPageLayout title="Testpagina verborgen">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">
              Deze pagina is verborgen. Je kunt nog steeds direct naar <code>/admin/test-flow</code> navigeren.
            </p>
            <Button variant="outline" onClick={() => setHidden(false)}>Opnieuw tonen</Button>
            <Button variant="outline" onClick={() => navigate('/admin')}>← Terug naar admin</Button>
          </CardContent>
        </Card>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title="Test Flow Verificatie">
      <div className="space-y-6">

        {/* Sectie 1 — Scan-flow data */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Sectie 1 — Scan-flow data</CardTitle>
            <Button size="sm" onClick={checkScanData} disabled={scanLoading}>
              {scanLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Controleer
            </Button>
          </CardHeader>
          <CardContent>
            {scanRuns === null && (
              <p className="text-sm text-muted-foreground">Klik op "Controleer" om scan-data op te halen.</p>
            )}
            {scanRuns !== null && scanRuns.length === 0 && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">Geen scan-data — test-scan doorlopen</span>
              </div>
            )}
            {scanRuns !== null && scanRuns.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-green-600 mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Scan-data aanwezig ({scanRuns.length} runs)</span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Aangemaakt</TableHead>
                        <TableHead>Governance</TableHead>
                        <TableHead>Afgerond</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scanRuns.map(run => (
                        <TableRow key={run.id}>
                          <TableCell className="font-mono text-xs">{run.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-mono text-xs">{run.user_id?.slice(0, 8) ?? '—'}</TableCell>
                          <TableCell className="text-xs">{new Date(run.created_at).toLocaleString('nl-NL')}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={run.governance ?? ''}>
                            {run.governance ? (
                              <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{run.governance.slice(0, 60)}{run.governance.length > 60 ? '…' : ''}</code>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {run.completed_at ? new Date(run.completed_at).toLocaleString('nl-NL') : <Badge variant="outline" className="text-xs">Open</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sectie 2 — Tool-discoveries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Sectie 2 — Tool-discoveries</CardTitle>
            <Button size="sm" onClick={checkToolDiscoveries} disabled={toolsLoading}>
              {toolsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Controleer
            </Button>
          </CardHeader>
          <CardContent>
            {toolDiscoveries === null && (
              <p className="text-sm text-muted-foreground">Klik op "Controleer" om tool-discoveries op te halen.</p>
            )}
            {toolDiscoveries !== null && toolDiscoveries.length === 0 && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">Geen tool-discoveries</span>
              </div>
            )}
            {toolDiscoveries !== null && toolDiscoveries.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-green-600 mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">{toolDiscoveries.length} tool-discoveries gevonden</span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tool</TableHead>
                        <TableHead>Use case</TableHead>
                        <TableHead>Risicoklasse</TableHead>
                        <TableHead>Ingediend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {toolDiscoveries.map((td, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{td.tool_name}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{td.use_case ?? '—'}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{td.application_risk_class ?? '—'}</Badge></TableCell>
                          <TableCell className="text-xs">{td.submitted_at ? new Date(td.submitted_at).toLocaleString('nl-NL') : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sectie 3 — RouteAI Transfer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Sectie 3 — RouteAI Transfer</CardTitle>
            <Button size="sm" onClick={checkTransfer} disabled={transferLoading}>
              {transferLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Controleer
            </Button>
          </CardHeader>
          <CardContent>
            {transferCount === null && (
              <p className="text-sm text-muted-foreground">Klik op "Controleer" om transfer-status op te halen.</p>
            )}
            {transferCount !== null && transferCount === 0 && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">Geen medewerkers uitgenodigd voor RouteAI</span>
              </div>
            )}
            {transferCount !== null && transferCount > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Transfer-mechanisme werkt — {transferCount} medewerker(s) uitgenodigd</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verberg-knop */}
        <div className="flex justify-end pt-4">
          <Button variant="destructive" size="sm" onClick={() => setHidden(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Verwijder testpagina uit navigatie
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  );
}
