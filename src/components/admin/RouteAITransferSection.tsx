import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrgPlanType } from '@/hooks/useOrgPlanType';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';

interface OrgEmployee {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  routeai_invited_at: string | null;
  // Joined data
  surveyStatus: 'ingevuld' | 'niet_ingevuld';
  assignedTier: string | null;
}

export default function RouteAITransferSection() {
  const { user } = useAuth();
  const { planType } = useOrgPlanType();
  const queryClient = useQueryClient();

  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterSurveyStatus, setFilterSurveyStatus] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });

  // Haal org_id op
  const { data: profile } = useQuery({
    queryKey: ['own-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const orgId = profile?.org_id;

  // Haal alle medewerkers van de org op (rol=user)
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['org-employees-transfer', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Haal profielen op
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, department, routeai_invited_at')
        .eq('org_id', orgId);

      if (!profiles) return [];

      // Haal user_roles op om alleen 'user'-rollen te filteren
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('org_id', orgId);

      const userRoleSet = new Set(
        roles?.filter(r => r.role === 'user').map(r => r.user_id) ?? []
      );

      // Haal survey runs op
      const { data: surveyRuns } = await supabase
        .from('shadow_survey_runs')
        .select('user_id, submitted_at, assigned_tier')
        .eq('org_id', orgId);

      const surveyMap = new Map<string, { submitted_at: string | null; assigned_tier: string | null }>();
      surveyRuns?.forEach(run => {
        if (run.user_id) {
          surveyMap.set(run.user_id, {
            submitted_at: run.submitted_at,
            assigned_tier: run.assigned_tier,
          });
        }
      });

      // Filter op user-rol, exclusief de ingelogde admin zelf
      return profiles
        .filter(p => userRoleSet.has(p.id) && p.id !== user?.id)
        .map((p): OrgEmployee => {
          const survey = surveyMap.get(p.id);
          return {
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            department: p.department,
            routeai_invited_at: p.routeai_invited_at,
            surveyStatus: survey?.submitted_at ? 'ingevuld' : 'niet_ingevuld',
            assignedTier: survey?.assigned_tier ?? null,
          };
        });
    },
    enabled: !!orgId,
  });

  // Dynamische afdelingen
  // Niet tonen als plan_type routeai is (alleen shadow_only of both)
  if (planType !== 'shadow_only' && planType !== 'both') return null;

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department).filter(Boolean) as string[]);
    return Array.from(depts).sort();
  }, [employees]);

  // Gefilterde medewerkers
  const filtered = useMemo(() => {
    return employees.filter(e => {
      if (filterDepartment !== 'all' && e.department !== filterDepartment) return false;
      if (filterSurveyStatus !== 'all' && e.surveyStatus !== filterSurveyStatus) return false;
      if (filterTier !== 'all') {
        const tier = e.assignedTier ?? 'onbekend';
        if (filterTier === 'onbekend' && e.assignedTier) return false;
        if (filterTier !== 'onbekend' && tier !== filterTier) return false;
      }
      return true;
    });
  }, [employees, filterDepartment, filterSurveyStatus, filterTier]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selected.has(e.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const newSet = new Set(selected);
      filtered.forEach(e => newSet.delete(e.id));
      setSelected(newSet);
    } else {
      const newSet = new Set(selected);
      filtered.forEach(e => newSet.add(e.id));
      setSelected(newSet);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const selectedEmployees = employees.filter(e => selected.has(e.id));

  const handleSendInvites = async () => {
    setIsSending(true);
    setSendProgress({ sent: 0, total: selectedEmployees.length });

    let successCount = 0;

    for (const emp of selectedEmployees) {
      try {
        const { data, error } = await supabase.functions.invoke('invite-user', {
          body: {
            email: emp.email,
            role: 'user',
            orgId,
            name: emp.full_name || emp.email,
            redirect_to: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          console.error(`Uitnodiging mislukt voor ${emp.email}:`, error);
        } else {
          // Update routeai_invited_at
          await supabase
            .from('profiles')
            .update({ routeai_invited_at: new Date().toISOString() })
            .eq('id', emp.id);
          successCount++;
        }
      } catch (err) {
        console.error(`Fout bij uitnodigen ${emp.email}:`, err);
      }

      setSendProgress(prev => ({ ...prev, sent: prev.sent + 1 }));
    }

    // Update plan_type naar 'both' als nog shadow_only
    if (planType === 'shadow_only' && orgId) {
      await supabase
        .from('organizations')
        .update({ plan_type: 'both' })
        .eq('id', orgId);
    }

    queryClient.invalidateQueries({ queryKey: ['org-employees-transfer'] });
    queryClient.invalidateQueries({ queryKey: ['org-plan-type'] });

    setShowConfirmDialog(false);
    setSelected(new Set());
    setMessage('');
    setIsSending(false);

    toast({
      title: 'Uitnodigingen verstuurd',
      description: `${successCount} van ${selectedEmployees.length} medewerkers uitgenodigd voor RouteAI.`,
    });
  };

  const surveyStatusLabel = (status: string) => {
    switch (status) {
      case 'ingevuld': return <Badge variant="default">Ingevuld</Badge>;
      case 'niet_ingevuld': return <Badge variant="outline">Niet ingevuld</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const tierLabel = (tier: string | null) => {
    if (!tier) return <span className="text-muted-foreground">Nog niet bekend</span>;
    const labels: Record<string, string> = {
      standaard: 'Standaard',
      gevorderd: 'Gevorderd',
      maatwerk: 'Maatwerk',
    };
    return labels[tier] || tier;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Doorsturen naar RouteAI</h2>
      <p className="text-sm text-muted-foreground">
        Selecteer medewerkers om uit te nodigen voor het volledige RouteAI-platform.
      </p>

      {/* Filterrij */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Afdeling" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle afdelingen</SelectItem>
            {departments.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSurveyStatus} onValueChange={setFilterSurveyStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Survey-status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="ingevuld">Ingevuld</SelectItem>
            <SelectItem value="niet_ingevuld">Niet ingevuld</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="standaard">Standaard</SelectItem>
            <SelectItem value="gevorderd">Gevorderd</SelectItem>
            <SelectItem value="maatwerk">Maatwerk</SelectItem>
            <SelectItem value="onbekend">Nog niet bekend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selecteer alle */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allFilteredSelected}
          onCheckedChange={toggleSelectAll}
          id="select-all"
        />
        <label htmlFor="select-all" className="text-sm cursor-pointer">
          Selecteer alle gefilterde medewerkers ({filtered.length})
        </label>
      </div>

      {/* Tabel */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Laden...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Naam</TableHead>
              <TableHead>Afdeling</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Survey-status</TableHead>
              <TableHead>Uitgenodigd voor RouteAI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Geen medewerkers gevonden met deze filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(emp.id)}
                      onCheckedChange={() => toggleSelect(emp.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{emp.full_name || emp.email || '—'}</TableCell>
                  <TableCell>{emp.department || '—'}</TableCell>
                  <TableCell>{tierLabel(emp.assignedTier)}</TableCell>
                  <TableCell>{surveyStatusLabel(emp.surveyStatus)}</TableCell>
                  <TableCell>
                    {emp.routeai_invited_at
                      ? new Date(emp.routeai_invited_at).toLocaleDateString('nl-NL')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Actieknop */}
      <Button
        onClick={() => setShowConfirmDialog(true)}
        disabled={selected.size === 0}
        className="gap-2"
      >
        <Send className="h-4 w-4" />
        Stuur RouteAI-uitnodiging naar geselecteerde ({selected.size})
      </Button>

      {/* Bevestigingsdialoog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>RouteAI-uitnodigingen versturen</DialogTitle>
            <DialogDescription>
              {selectedEmployees.length} medewerker{selectedEmployees.length !== 1 ? 's' : ''} worden uitgenodigd voor het volledige RouteAI-platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-1">
              {selectedEmployees.map(e => (
                <div key={e.id} className="text-sm">
                  {e.full_name || e.email}
                  {e.department && <span className="text-muted-foreground"> — {e.department}</span>}
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Begeleidende boodschap (optioneel)
              </label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Voeg een persoonlijke boodschap toe voor de uitnodigingsmail..."
                rows={3}
              />
            </div>

            {isSending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {sendProgress.sent} van {sendProgress.total} uitnodigingen verstuurd...
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSending}>
              Annuleren
            </Button>
            <Button onClick={handleSendInvites} disabled={isSending} className="gap-2">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Verstuur uitnodigingen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
