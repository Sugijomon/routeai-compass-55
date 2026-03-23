import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Shield,
  Users,
  Check,
  ChevronRight,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';

// ─── Types ───────────────────────────────────────────────────────

interface ImportRow {
  voornaam: string;
  achternaam: string;
  email: string;
  afdeling: string;
  error?: string;
}

interface ImportResult {
  email: string;
  success: boolean;
  error?: string;
}

const MAX_ROWS = 250;

const SECTORS = [
  { value: 'zorg', label: 'Zorg' },
  { value: 'onderwijs', label: 'Onderwijs' },
  { value: 'overheid', label: 'Overheid' },
  { value: 'mkb-overig', label: 'MKB-overig' },
  { value: 'anders', label: 'Anders' },
];

const ORG_SIZES = [
  { value: '25-50', label: '25–50 medewerkers' },
  { value: '51-100', label: '51–100 medewerkers' },
  { value: '101-250', label: '101–250 medewerkers' },
];

// ─── Step indicator ──────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: 'Organisatie', icon: Building2 },
    { num: 2, label: 'Amnesty', icon: Shield },
    { num: 3, label: 'Medewerkers', icon: Users },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = step.num === current;
        const isDone = step.num < current;

        return (
          <React.Fragment key={step.num}>
            {i > 0 && (
              <div className={`h-px w-12 ${isDone ? 'bg-primary' : 'bg-border'}`} />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────

export default function ShadowSetupWizard() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const orgId = profile?.org_id;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  // Stap 1 state
  const [sector, setSector] = useState('');
  const [orgSize, setOrgSize] = useState('');
  const [surveyGoal, setSurveyGoal] = useState('');

  // Stap 2 state
  const [amnestyManager, setAmnestyManager] = useState('');
  const [amnestyDays, setAmnestyDays] = useState(30);
  const [amnestyText, setAmnestyText] = useState('');
  const [amnestyActivated, setAmnestyActivated] = useState(false);
  const [amnestyExpiryDate, setAmnestyExpiryDate] = useState<Date | null>(null);

  // Stap 3 state
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = importRows.filter((r) => !r.error);
  const errorRows = importRows.filter((r) => !!r.error);

  // ─── Stap 1: Organisatie-context opslaan ─────────────────────

  const handleSaveStep1 = async () => {
    if (!orgId) return;
    setSaving(true);

    try {
      // Haal huidige settings op
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .maybeSingle();

      const currentSettings = (org?.settings as Record<string, unknown>) ?? {};

      const { error } = await supabase
        .from('organizations')
        .update({
          sector,
          settings: {
            ...currentSettings,
            shadow_survey_org_size: orgSize,
            shadow_survey_goal: surveyGoal,
          },
        })
        .eq('id', orgId);

      if (error) throw error;
      toast.success('Organisatie-context opgeslagen');
      setStep(2);
    } catch (err: any) {
      toast.error(err?.message || 'Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  };

  // ─── Stap 2: Amnesty activeren ───────────────────────────────

  const handleActivateAmnesty = async () => {
    if (!orgId || !amnestyManager.trim()) return;
    setSaving(true);

    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .maybeSingle();

      const currentSettings = (org?.settings as Record<string, unknown>) ?? {};
      const now = new Date();
      const expiry = addDays(now, amnestyDays);

      const { error } = await supabase
        .from('organizations')
        .update({
          settings: {
            ...currentSettings,
            amnesty_manager_name: amnestyManager.trim(),
            amnesty_valid_days: amnestyDays,
            amnesty_text: amnestyText.trim() || null,
            amnesty_activated_at: now.toISOString(),
          },
        })
        .eq('id', orgId);

      if (error) throw error;

      setAmnestyActivated(true);
      setAmnestyExpiryDate(expiry);
      toast.success('Amnesty-window geactiveerd');
    } catch (err: any) {
      toast.error(err?.message || 'Fout bij activeren amnesty');
    } finally {
      setSaving(false);
    }
  };

  // ─── Stap 3: Bestand parsen ──────────────────────────────────

  const generateTemplate = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ['Voornaam', 'Achternaam', 'E-mail', 'Afdeling'],
      ['Jan', 'de Vries', 'jan@voorbeeld.nl', 'IT'],
      ['Maria', 'Jansen', 'maria@voorbeeld.nl', 'HR'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Medewerkers');
    XLSX.writeFile(wb, 'shadow_survey_medewerkers.xlsx');
  };

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

        if (json.length > MAX_ROWS) {
          setImportRows([{
            voornaam: '', achternaam: '', email: '', afdeling: '',
            error: `Bestand bevat ${json.length} rijen. Maximaal ${MAX_ROWS} toegestaan.`,
          }]);
          return;
        }

        const parsed: ImportRow[] = json.map((row) => {
          const voornaam = (row.Voornaam || row.voornaam || '').trim();
          const achternaam = (row.Achternaam || row.achternaam || '').trim();
          const email = (row['E-mail'] || row.email || row.Email || row['e-mail'] || '').trim();
          const afdeling = (row.Afdeling || row.afdeling || row.department || '').trim();

          const errors: string[] = [];
          if (!voornaam) errors.push('voornaam ontbreekt');
          if (!achternaam) errors.push('achternaam ontbreekt');
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('ongeldig e-mail');
          if (!afdeling) errors.push('afdeling ontbreekt');

          return {
            voornaam, achternaam, email, afdeling,
            error: errors.length > 0 ? errors.join(', ') : undefined,
          };
        });

        setImportRows(parsed);
      } catch {
        setImportRows([{
          voornaam: '', achternaam: '', email: '', afdeling: '',
          error: 'Bestand kon niet worden gelezen. Controleer het formaat.',
        }]);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // ─── Stap 3: Uitnodigingen versturen ─────────────────────────

  const handleSendInvitations = async () => {
    if (!orgId || validRows.length === 0) return;
    setImporting(true);
    setImportProgress(0);

    const results: ImportResult[] = [];
    const baseUrl = window.location.origin;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const { data, error } = await supabase.functions.invoke('invite-user', {
          body: {
            email: row.email,
            role: 'user',
            orgId,
            name: `${row.voornaam} ${row.achternaam}`.trim(),
            redirect_to: `${baseUrl}/shadow-survey`,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        // Update profiel met afdeling
        if (data?.user?.id) {
          await supabase
            .from('profiles')
            .update({ department: row.afdeling })
            .eq('id', data.user.id);
        }

        results.push({ email: row.email, success: true });
      } catch (err: any) {
        results.push({
          email: row.email,
          success: false,
          error: err?.message || 'Onbekende fout',
        });
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
      setImportResults([...results]);
    }

    setImporting(false);
    const successCount = results.filter((r) => r.success).length;
    toast.success(`${successCount} van ${validRows.length} uitnodigingen verstuurd`);
  };

  // ─── Stap 3: Wizard voltooien ────────────────────────────────

  const handleFinish = () => {
    navigate('/admin/shadow');
  };

  const successCount = importResults.filter((r) => r.success).length;
  const failCount = importResults.filter((r) => !r.success).length;

  return (
    <AdminPageLayout
      title="Shadow AI Scan — Setup"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Shadow AI', href: '/admin/shadow' },
        { label: 'Setup' },
      ]}
    >
      <StepIndicator current={step} />

      {/* ─── STAP 1: Organisatie-context ─────────────────────── */}
      {step === 1 && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organisatie-context
            </CardTitle>
            <CardDescription>
              Geef basisinformatie over je organisatie voor de Shadow AI Scan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger id="sector">
                  <SelectValue placeholder="Selecteer sector…" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {SECTORS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgSize">Organisatiegrootte</Label>
              <Select value={orgSize} onValueChange={setOrgSize}>
                <SelectTrigger id="orgSize">
                  <SelectValue placeholder="Selecteer grootte…" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {ORG_SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Doelstelling survey (optioneel)</Label>
              <Textarea
                id="goal"
                value={surveyGoal}
                onChange={(e) => setSurveyGoal(e.target.value)}
                placeholder="Beschrijf het doel van deze survey…"
                rows={3}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveStep1}
                disabled={!sector || !orgSize || saving}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Volgende
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STAP 2: Amnesty configureren ────────────────────── */}
      {step === 2 && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Amnesty-window configureren
            </CardTitle>
            <CardDescription>
              Stel het amnesty-window in. Medewerkers kunnen gedurende deze
              periode ongestraft melden welke AI-tools ze gebruiken.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!amnestyActivated ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="manager">
                    Naam verantwoordelijke <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="manager"
                    value={amnestyManager}
                    onChange={(e) => setAmnestyManager(e.target.value)}
                    placeholder="Naam van de AI Verantwoordelijke"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days">Amnesty-duur (dagen)</Label>
                  <Input
                    id="days"
                    type="number"
                    min={7}
                    max={90}
                    value={amnestyDays}
                    onChange={(e) => setAmnestyDays(Number(e.target.value) || 30)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text">Amnesty-tekst (optioneel)</Label>
                  <Textarea
                    id="text"
                    value={amnestyText}
                    onChange={(e) => setAmnestyText(e.target.value)}
                    placeholder="Optionele aangepaste amnesty-verklaring…"
                    rows={3}
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Terug
                  </Button>
                  <Button
                    onClick={handleActivateAmnesty}
                    disabled={!amnestyManager.trim() || saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Activeer amnesty-window
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                  <p className="font-semibold text-foreground">
                    Amnesty-window is geactiveerd
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Verantwoordelijke: <strong>{amnestyManager}</strong>
                  </p>
                  {amnestyExpiryDate && (
                    <p className="text-sm text-muted-foreground">
                      Geldig tot:{' '}
                      <strong>
                        {format(amnestyExpiryDate, 'd MMMM yyyy', { locale: nl })}
                      </strong>{' '}
                      ({amnestyDays} dagen)
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setStep(3)}>
                    Volgende
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── STAP 3: Medewerkers importeren ──────────────────── */}
      {step === 3 && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Medewerkers importeren & uitnodigen
            </CardTitle>
            <CardDescription>
              Upload een Excel-bestand met medewerkers. Ze ontvangen een
              uitnodiging om de Shadow AI Scan in te vullen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Upload zone (als er nog geen rijen zijn en niet aan het importeren) */}
            {importRows.length === 0 && !importing && importResults.length === 0 && (
              <>
                <div
                  className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium text-foreground">
                    Sleep een bestand hierheen of klik om te uploaden
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    .xlsx of .csv — maximaal {MAX_ROWS} rijen
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <Button variant="link" size="sm" onClick={generateTemplate} className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Download Excel-sjabloon
                </Button>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Terug
                  </Button>
                  <Button variant="outline" onClick={handleFinish}>
                    Overslaan — later importeren
                  </Button>
                </div>
              </>
            )}

            {/* Preview tabel */}
            {importRows.length > 0 && !importing && importResults.length === 0 && (
              <>
                {/* Globale fout */}
                {importRows.length === 1 && importRows[0].error && !importRows[0].email ? (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{importRows[0].error}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant="secondary">
                        {validRows.length} medewerkers gevonden
                      </Badge>
                      {errorRows.length > 0 && (
                        <Badge variant="destructive">
                          {errorRows.length} met fouten
                        </Badge>
                      )}
                    </div>

                    <div className="rounded-md border max-h-72 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Voornaam</TableHead>
                            <TableHead>Achternaam</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Afdeling</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importRows.map((row, i) => (
                            <TableRow key={i} className={row.error ? 'bg-destructive/5' : ''}>
                              <TableCell className={row.error ? 'text-destructive' : ''}>
                                {row.voornaam || '—'}
                              </TableCell>
                              <TableCell className={row.error ? 'text-destructive' : ''}>
                                {row.achternaam || '—'}
                              </TableCell>
                              <TableCell>
                                {row.error ? (
                                  <span className="flex items-center gap-1 text-destructive text-sm">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {row.error}
                                  </span>
                                ) : (
                                  row.email
                                )}
                              </TableCell>
                              <TableCell>{row.afdeling || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setImportRows([])}>
                    Opnieuw uploaden
                  </Button>
                  <Button
                    onClick={handleSendInvitations}
                    disabled={validRows.length === 0}
                  >
                    Verstuur {validRows.length} uitnodiging{validRows.length !== 1 ? 'en' : ''}
                  </Button>
                </div>
              </>
            )}

            {/* Import voortgang */}
            {(importing || importResults.length > 0) && (
              <div className="space-y-4">
                <Progress value={importProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {importing
                    ? `${importResults.length} van ${validRows.length} verwerkt…`
                    : `Import voltooid: ${successCount} geslaagd, ${failCount} mislukt`}
                </p>

                {!importing && importResults.length > 0 && (
                  <div className="rounded-md border max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResults.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{r.email}</TableCell>
                            <TableCell>
                              {r.success ? (
                                <span className="flex items-center gap-1 text-sm text-primary">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Uitgenodigd
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-destructive text-sm">
                                  <XCircle className="h-4 w-4" />
                                  {r.error || 'Mislukt'}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {!importing && (
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleFinish}>
                      Afronden — naar dashboard
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </AdminPageLayout>
  );
}
