import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import {
  calculateRiskScore,
  type DataClassification,
  type AssignedTier,
} from '@/lib/riskEngine';
import { toast } from 'sonner';
import {
  ArrowRight, Loader2, ShieldCheck, ShieldAlert, Shield,
  AlertTriangle, Clock, CheckCircle2, Home,
} from 'lucide-react';

// --- Mapping van antwoorden naar riskEngine-sleutels ---

const DATA_MAP: Record<string, DataClassification> = {
  public: 'public',
  internal: 'internal',
  client: 'client',
  sensitive: 'sensitive',
};

const USE_CASE_MAP: Record<string, string> = {
  content: 'content',
  data_analysis: 'data_analysis',
  research: 'research',
  client_facing: 'client_facing',
};

const CONCERN_MAP: Record<string, string> = {
  learning_curve: 'learning_curve',
  accuracy: 'accuracy',
  cost: 'cost',
  privacy: 'privacy',
};

// --- Tier-weergave ---

const TIER_CONFIG: Record<AssignedTier, {
  label: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
}> = {
  standard: {
    label: 'Standaard',
    description: 'Je kunt direct aan de slag met de standaard AI-tools en trainingen.',
    icon: ShieldCheck,
    colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  advanced: {
    label: 'Gevorderd',
    description: 'Je werkt met gevoeligere data. Extra training en richtlijnen zijn beschikbaar.',
    icon: Shield,
    colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  },
  custom: {
    label: 'Maatwerk',
    description: 'Je situatie vereist specifieke afspraken en goedkeuring. Er wordt een passend traject voor je samengesteld.',
    icon: ShieldAlert,
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
};

// --- Component ---

interface Props {
  surveyRunId: string;
  orgId: string;
  /** Tool-namen geselecteerd in stap 2 */
  selectedToolNames: string[];
  onComplete: () => void;
}

export default function RiskProfileStep({
  surveyRunId,
  orgId: _orgId,
  selectedToolNames,
  onComplete,
}: Props) {
  const [dataClassification, setDataClassification] = useState('');
  const [primaryUseCase, setPrimaryUseCase] = useState('');
  const [primaryConcern, setPrimaryConcern] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    risk_score: number;
    assigned_tier: AssignedTier;
    dpo_review_required: boolean;
  } | null>(null);

  // Detecteer lokale agents
  const hasLocalAgent = selectedToolNames.some((name) => {
    const lower = name.toLowerCase();
    return lower.includes('desktop') || lower.includes('local') || lower.includes('autogpt');
  });

  const isFormValid = dataClassification !== '' && primaryUseCase !== '' && primaryConcern !== '';

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setSaving(true);

    try {
      const dc = DATA_MAP[dataClassification] ?? 'internal';
      const uc = USE_CASE_MAP[primaryUseCase] ?? 'content';
      const pc = CONCERN_MAP[primaryConcern] ?? 'accuracy';

      const riskResult = calculateRiskScore(dc, uc, pc, hasLocalAgent);

      const { error } = await supabase
        .from('shadow_survey_runs')
        .update({
          data_classification: dc,
          primary_use_case: uc,
          primary_concern: pc,
          risk_score: riskResult.risk_score,
          assigned_tier: riskResult.assigned_tier,
          dpo_review_required: riskResult.dpo_review_required,
          survey_completed_at: new Date().toISOString(),
        })
        .eq('id', surveyRunId);

      if (error) throw error;

      setResult(riskResult);
    } catch {
      toast.error('Fout bij het opslaan van je risicoprofiel.');
    } finally {
      setSaving(false);
    }
  };

  // --- Resultaat-scherm ---
  if (result) {
    const tier = TIER_CONFIG[result.assigned_tier];
    const TierIcon = tier.icon;
    const isCustom = result.assigned_tier === 'custom';

    return (
      <div className="space-y-6">
        {/* Visuele journey-voortgang */}
        <SurveyJourneyProgress currentStep="training" />

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <TierIcon className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl">Je risicoprofiel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Badge className={tier.colorClass + ' text-sm px-4 py-1.5'}>
              {tier.label}
            </Badge>
            <p className="text-muted-foreground">{tier.description}</p>
            <p className="text-sm text-muted-foreground">
              Risicoscore: <span className="font-semibold text-foreground">{result.risk_score}/100</span>
            </p>

            {result.dpo_review_required && (
              <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-left dark:border-yellow-700 dark:bg-yellow-950/30">
                <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-600 shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Je profiel wordt extra beoordeeld door de DPO (1-2 werkdagen).
                </p>
              </div>
            )}

            {/* Custom tier: wacht op DPO */}
            {isCustom && (
              <div className="flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 text-left dark:border-blue-700 dark:bg-blue-950/30">
                <Clock className="h-5 w-5 mt-0.5 text-blue-600 shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Je leerpad wordt samengesteld door de DPO.</p>
                  <p>Je ontvangt een notificatie zodra het klaar is.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          {isCustom ? (
            <Button onClick={onComplete} size="lg" variant="outline">
              Terug naar dashboard
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onComplete} size="lg">
              <GraduationCap className="mr-2 h-4 w-4" />
              Naar je training
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // --- Vragenformulier ---
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Stap 3 van 4 — Risicoprofiel</p>
        <Progress value={75} className="h-2" />
      </div>

      {/* V1 — Data classificatie */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Label className="font-medium text-base">
            Met welk type data werk je voornamelijk?
          </Label>
          <RadioGroup value={dataClassification} onValueChange={setDataClassification} className="space-y-2">
            {[
              { value: 'public', label: 'Publieke informatie (websites, algemene kennis)' },
              { value: 'internal', label: 'Interne bedrijfsdata (documenten, presentaties)' },
              { value: 'client', label: 'Klant- of projectdata (correspondentie, offertes)' },
              { value: 'sensitive', label: 'Gevoelige of gereguleerde data (AVG, financieel, medisch)' },
            ].map((o) => (
              <div key={o.value} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={o.value} id={`dc-${o.value}`} />
                <Label htmlFor={`dc-${o.value}`} className="cursor-pointer flex-1">{o.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* V2 — Primair gebruik */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Label className="font-medium text-base">
            Wat is je primaire gebruik van AI?
          </Label>
          <RadioGroup value={primaryUseCase} onValueChange={setPrimaryUseCase} className="space-y-2">
            {[
              { value: 'content', label: 'Content creëren (teksten, presentaties, marketing)' },
              { value: 'data_analysis', label: 'Data analyseren (spreadsheets, rapporten)' },
              { value: 'research', label: 'Research & leren (informatie verzamelen)' },
              { value: 'client_facing', label: 'Klantgerichte toepassingen (communicatie, advies)' },
            ].map((o) => (
              <div key={o.value} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={o.value} id={`uc-${o.value}`} />
                <Label htmlFor={`uc-${o.value}`} className="cursor-pointer flex-1">{o.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* V3 — Grootste zorg */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Label className="font-medium text-base">
            Wat is je grootste zorg bij AI tools?
          </Label>
          <RadioGroup value={primaryConcern} onValueChange={setPrimaryConcern} className="space-y-2">
            {[
              { value: 'learning_curve', label: 'Learning curve (is het moeilijk te leren?)' },
              { value: 'accuracy', label: 'Nauwkeurigheid (klopt de output?)' },
              { value: 'cost', label: 'Kosten en budget' },
              { value: 'privacy', label: 'Privacy en databeveiliging' },
            ].map((o) => (
              <div key={o.value} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={o.value} id={`pc-${o.value}`} />
                <Label htmlFor={`pc-${o.value}`} className="cursor-pointer flex-1">{o.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {hasLocalAgent && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950/30">
          <AlertTriangle className="h-5 w-5 mt-0.5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Je hebt een lokale AI-agent opgegeven. Dit wordt meegenomen in je risicobeoordeling.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!isFormValid || saving} size="lg">
          {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Bereken mijn profiel
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
