import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Info } from 'lucide-react';
import { TeamParticipationBadge } from './TeamParticipationBadge';

type UsesAi = 'ja_regelmatig' | 'soms' | 'zelden' | 'niet_dat_ik_weet' | 'nee';
type Frequency = 'dagelijks' | 'wekelijks' | 'maandelijks' | 'af_en_toe';
type AccountType = 'bedrijfsaccount' | 'privéaccount' | 'beide' | 'gratis_versie_zonder_inloggen' | 'weet_ik_niet' | 'niet_van_toepassing';

interface Props {
  surveyRunId: string;
  onNext: (usesAi: UsesAi) => void;
  onBack: () => void;
}

const USES_AI_OPTIONS: { value: UsesAi; label: string }[] = [
  { value: 'ja_regelmatig', label: 'Ja, regelmatig' },
  { value: 'soms', label: 'Soms' },
  { value: 'zelden', label: 'Zelden' },
  { value: 'niet_dat_ik_weet', label: 'Niet dat ik weet' },
  { value: 'nee', label: 'Nee' },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'dagelijks', label: 'Dagelijks' },
  { value: 'wekelijks', label: 'Wekelijks' },
  { value: 'maandelijks', label: 'Maandelijks' },
  { value: 'af_en_toe', label: 'Af en toe' },
];

const ACCOUNT_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'bedrijfsaccount', label: 'Bedrijfsaccount' },
  { value: 'privéaccount', label: 'Privéaccount' },
  { value: 'beide', label: 'Beide' },
  { value: 'gratis_versie_zonder_inloggen', label: 'Gratis versie (zonder inloggen)' },
  { value: 'weet_ik_niet', label: 'Weet ik niet' },
  { value: 'niet_van_toepassing', label: 'Niet van toepassing' },
];

export default function OrientationStep({ surveyRunId, onNext, onBack }: Props) {
  const [usesAi, setUsesAi] = useState<UsesAi | ''>('');
  const [frequency, setFrequency] = useState<Frequency | ''>('');
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [saving, setSaving] = useState(false);

  const showFollowUp = usesAi !== '' && usesAi !== 'nee';
  const isValid = usesAi !== '' && (usesAi === 'nee' || (frequency !== '' && accountType !== ''));

  const handleNext = async () => {
    if (!isValid) return;
    setSaving(true);

    try {
      // Lees huidige extra_data op en merge
      const { data: run } = await supabase
        .from('shadow_survey_runs')
        .select('extra_data')
        .eq('id', surveyRunId)
        .maybeSingle();

      const existingData = (run?.extra_data as Record<string, unknown>) ?? {};

      const orientation = {
        uses_ai: usesAi,
        frequency: usesAi === 'nee' ? null : frequency,
        account_type: usesAi === 'nee' ? null : accountType,
      };

      const { error } = await supabase
        .from('shadow_survey_runs')
        .update({
          extra_data: { ...existingData, orientation } as any,
        })
        .eq('id', surveyRunId);

      if (error) throw error;

      onNext(usesAi as UsesAi);
    } catch {
      toast.error('Fout bij het opslaan van je antwoorden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Voortgang */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Stap 2 van 6 — Oriëntatie</p>
        <Progress value={15} className="h-2" />
      </div>

      {/* Educatief frame */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
        <Info className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          AI-tools worden steeds vaker gebruikt in dagelijks werk — soms ook via
          privéaccounts. Deze scan is er om te begrijpen hoe AI al wordt ingezet,
          zodat er duidelijke, ondersteunende afspraken gemaakt kunnen worden.
        </p>
      </div>

      <TeamParticipationBadge />

      {/* Vraag 1 */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Label className="font-medium text-base">
            Gebruik je AI-tools ter ondersteuning van je werk?
          </Label>
          <p className="text-sm text-muted-foreground -mt-1">
            Ook als je hiervoor je eigen account of gratis tools gebruikt.
          </p>
          <RadioGroup
            value={usesAi}
            onValueChange={(v) => {
              setUsesAi(v as UsesAi);
              if (v === 'nee') {
                setFrequency('');
                setAccountType('');
              }
            }}
            className="space-y-2"
          >
            {USES_AI_OPTIONS.map((o) => (
              <div
                key={o.value}
                className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={o.value} id={`uses-${o.value}`} />
                <Label htmlFor={`uses-${o.value}`} className="cursor-pointer flex-1">
                  {o.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Vraag 2 — frequentie (conditioneel) */}
      {showFollowUp && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="font-medium text-base">
              Hoe vaak gebruik je AI-tools voor werk?
            </Label>
            <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as Frequency)} className="space-y-2">
              {FREQUENCY_OPTIONS.map((o) => (
                <div
                  key={o.value}
                  className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={o.value} id={`freq-${o.value}`} />
                  <Label htmlFor={`freq-${o.value}`} className="cursor-pointer flex-1">
                    {o.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Vraag 3 — account type (conditioneel) */}
      {showFollowUp && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="font-medium text-base">
              Gebruik je hiervoor een privé- of bedrijfsaccount?
            </Label>
            <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as AccountType)} className="space-y-2">
              {ACCOUNT_OPTIONS.map((o) => (
                <div
                  key={o.value}
                  className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={o.value} id={`acc-${o.value}`} />
                  <Label htmlFor={`acc-${o.value}`} className="cursor-pointer flex-1">
                    {o.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Navigatie */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Vorige
        </Button>
        <Button onClick={handleNext} disabled={!isValid || saving} size="lg">
          {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Volgende
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
