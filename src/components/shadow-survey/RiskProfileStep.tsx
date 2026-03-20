import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import {
  calculateRiskScore,
  type DataClassification,
  type AssignedTier,
} from '@/lib/shadowSurveyEngine';
import { toast } from 'sonner';
import {
  ArrowRight, Loader2, ShieldCheck, ShieldAlert, Shield,
  AlertTriangle, CheckCircle2, Search, Target, Info,
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

// --- Badge types ---

interface BadgeInfo {
  type: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
}

const BADGE_DEFS: Record<string, BadgeInfo> = {
  ai_scout: {
    type: 'ai_scout',
    icon: Search,
    title: 'AI Scout',
    subtitle: 'Je hebt je AI-tools in kaart gebracht',
  },
  early_adopter: {
    type: 'early_adopter',
    icon: Target,
    title: 'Early Adopter',
    subtitle: 'Je was er vroeg bij',
  },
};

// --- Component ---

interface Props {
  surveyRunId: string;
  orgId: string;
  selectedToolNames: string[];
  onComplete: () => void;
}

export default function RiskProfileStep({
  surveyRunId,
  orgId,
  selectedToolNames,
}: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const _profile = useUserProfile();
  const [dataClassification, setDataClassification] = useState('');
  const [primaryUseCase, setPrimaryUseCase] = useState('');
  const [primaryConcern, setPrimaryConcern] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    risk_score: number;
    assigned_tier: AssignedTier;
    dpo_review_required: boolean;
  } | null>(null);

  // Haal badges op na submit
  const { data: earnedBadges } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_badges' as any)
        .select('badge_type')
        .eq('user_id', user!.id);
      return (data as any[] | null)?.map((b: any) => b.badge_type as string) ?? [];
    },
    enabled: !!user?.id && !!result,
  });

  // Detecteer lokale agents
  const hasLocalAgent = selectedToolNames.some((name) => {
    const lower = name.toLowerCase();
    return lower.includes('desktop') || lower.includes('local') || lower.includes('autogpt');
  });

  const isFormValid = dataClassification !== '' && primaryUseCase !== '' && primaryConcern !== '';

  const awardBadges = async () => {
    if (!user?.id || !orgId) return;

    // Badge: ai_scout — minstens 1 tool ontdekt
    const { count: toolCount } = await supabase
      .from('tool_discoveries')
      .select('id', { count: 'exact', head: true })
      .eq('survey_run_id', surveyRunId);

    if (toolCount && toolCount >= 1) {
      await supabase
        .from('user_badges' as any)
        .upsert(
          { user_id: user.id, org_id: orgId, badge_type: 'ai_scout' },
          { onConflict: 'user_id,badge_type' }
        );
    }

    // Badge: early_adopter — binnen 7 dagen na amnesty-activatie
    const { data: orgData } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .maybeSingle();

    const settings = orgData?.settings as Record<string, any> | null;
    const amnestyActivatedAt = settings?.amnesty_activated_at;

    if (amnestyActivatedAt) {
      const activatedDate = new Date(amnestyActivatedAt);
      const sevenDaysLater = new Date(activatedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (new Date() < sevenDaysLater) {
        await supabase
          .from('user_badges' as any)
          .upsert(
            { user_id: user.id, org_id: orgId, badge_type: 'early_adopter' },
            { onConflict: 'user_id,badge_type' }
          );
      }
    }
  };

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

      // Badge-toekenning (fire-and-forget, geen blocker)
      await awardBadges().catch(() => {});

      setResult(riskResult);
    } catch {
      toast.error('Fout bij het opslaan van je risicoprofiel.');
    } finally {
      setSaving(false);
    }
  };

  // --- Afsluitscherm ---
  if (result) {
    const tier = TIER_CONFIG[result.assigned_tier];
    const TierIcon = tier.icon;
    const badges = earnedBadges ?? [];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl">Scan afgerond — bedankt voor je deelname.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Badges sectie */}
            {badges.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground text-center">Verdiende badges</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {badges.map((badgeType) => {
                    const def = BADGE_DEFS[badgeType];
                    if (!def) return null;
                    const BadgeIcon = def.icon;
                    return (
                      <div
                        key={badgeType}
                        className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <BadgeIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{def.title}</p>
                          <p className="text-xs text-muted-foreground">{def.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tier-naam en beschrijving */}
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <TierIcon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">{tier.label}</p>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>
            </div>

            {result.dpo_review_required && (
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Info className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  De DPO neemt je profiel mee in de beoordeling.
                  Je hoort hier indien nodig iets over.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => navigate('/dashboard')} size="lg">
            Naar jouw overzicht
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
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
