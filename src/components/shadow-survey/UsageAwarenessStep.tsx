// Stap 4: Gebruik & databewustzijn — brede vragen over AI-werkpatronen
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Info } from 'lucide-react';
import { toast } from 'sonner';

interface UsageAwarenessStepProps {
  surveyRunId: string;
  onNext: () => void;
  onBack: () => void;
}

const TASK_OPTIONS = [
  { value: 'writing', label: 'Teksten schrijven of herschrijven (e-mails, rapporten, notities)' },
  { value: 'summarize', label: 'Documenten of teksten samenvatten' },
  { value: 'translate', label: 'Vertalen' },
  { value: 'research', label: 'Informatie opzoeken of onderzoek doen' },
  { value: 'brainstorm', label: 'Brainstormen of ideeën genereren' },
  { value: 'data', label: 'Data analyseren of visualiseren' },
  { value: 'design', label: 'Afbeeldingen of ontwerpen maken' },
  { value: 'code', label: 'Code schrijven of debuggen' },
  { value: 'meetings', label: 'Vergaderingen samenvatten of notuleren' },
  { value: 'customer', label: 'Klantvragen beantwoorden of support' },
  { value: 'hr', label: 'HR of recruitment' },
  { value: 'legal', label: 'Juridische teksten of contracten' },
  { value: 'other', label: 'Anders' },
] as const;

const REASON_OPTIONS = [
  { value: 'faster', label: 'Ik werk er sneller mee' },
  { value: 'quality', label: 'Betere kwaliteit van mijn werk' },
  { value: 'no_alt', label: 'Geen goed alternatief beschikbaar binnen de organisatie' },
  { value: 'colleagues', label: 'Collega\'s gebruiken het ook' },
  { value: 'curiosity', label: 'Uit nieuwsgierigheid of om te experimenteren' },
  { value: 'preference', label: 'Persoonlijke voorkeur' },
  { value: 'other', label: 'Anders' },
] as const;

const DATA_TYPE_OPTIONS = [
  { value: 'public', label: 'Openbare informatie' },
  { value: 'colleague_names', label: 'Namen van klanten of collega\'s' },
  { value: 'internal_email', label: 'Interne e-mails' },
  { value: 'internal_docs', label: 'Interne documenten (rapporten, notities)' },
  { value: 'meeting_notes', label: 'Notulen van overleggen' },
  { value: 'financial', label: 'Financiële cijfers of begrotingen' },
  { value: 'strategy', label: 'Strategische plannen of concepten' },
  { value: 'client_data', label: 'Klantgegevens (contactinfo, orders)' },
  { value: 'sensitive_personal', label: 'Gevoelige persoonsgegevens (medisch, financieel persoonlijk)' },
  { value: 'code_specs', label: 'Code of technische specificaties' },
  { value: 'contracts', label: 'Contracten of juridische documenten' },
  { value: 'none', label: 'Ik voer geen informatie in (gebruik AI alleen voor ideeën)' },
  { value: 'unsure', label: 'Weet ik niet zeker' },
] as const;

const AWARENESS_OPTIONS = [
  { value: 'aware', label: 'Ja, ik weet waar de data wordt opgeslagen' },
  { value: 'partly', label: 'Deels, maar niet alles' },
  { value: 'not_aware', label: 'Nee, daar heb ik niet over nagedacht' },
  { value: 'unsure', label: 'Weet ik niet' },
] as const;

const TOOL_SUPPORT_OPTIONS = [
  { value: 'prefer_approved_list', label: 'Ik werk liever met een goedgekeurde lijst van tools' },
  { value: 'prefer_guidance', label: 'Ik wil guidance maar wil zelf kunnen kiezen' },
  { value: 'prefer_freedom', label: 'Ik wil vrijheid om zelf tools te kiezen zonder restricties' },
  { value: 'no_preference', label: 'Geen voorkeur' },
] as const;

const GUIDELINES_READINESS_OPTIONS = [
  { value: 'already_following', label: 'Ik volg al richtlijnen — die zijn er al in onze organisatie' },
  { value: 'open_to_guidelines', label: 'Ik sta open voor duidelijke richtlijnen als die er komen' },
  { value: 'depends_on_workload', label: 'Hangt ervan af — als het me niet vertraagt, prima' },
  { value: 'prefer_minimal_rules', label: 'Ik werk liever met zo min mogelijk regels' },
] as const;

export default function UsageAwarenessStep({ surveyRunId, onNext, onBack }: UsageAwarenessStepProps) {
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskOtherText, setTaskOtherText] = useState('');
  const [primaryReason, setPrimaryReason] = useState('');
  const [reasonOtherText, setReasonOtherText] = useState('');
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const [dataAwareness, setDataAwareness] = useState('');
  const [automationWish, setAutomationWish] = useState('');
  const [toolSupportPreference, setToolSupportPreference] = useState('');
  const [guidelinesReadiness, setGuidelinesReadiness] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleTask = (value: string) => {
    setTasks(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const toggleDataType = (value: string) => {
    setDataTypes(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const isValid = tasks.length > 0 && primaryReason && dataTypes.length > 0 && dataAwareness;

  const handleNext = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      // Haal bestaande extra_data op
      const { data: current } = await supabase
        .from('shadow_survey_runs')
        .select('extra_data')
        .eq('id', surveyRunId)
        .single();

      const existing = (current?.extra_data as Record<string, unknown>) ?? {};

      const finalTasks = tasks.includes('other') && taskOtherText.trim()
        ? [...tasks.filter(t => t !== 'other'), `other:${taskOtherText.trim()}`]
        : tasks;

      const finalReason = primaryReason === 'other' && reasonOtherText.trim()
        ? `other:${reasonOtherText.trim()}`
        : primaryReason;

      const merged = {
        ...existing,
        context: {
          tasks: finalTasks,
          primary_reason: finalReason,
          data_types_entered: dataTypes,
          data_awareness: dataAwareness,
        },
        governance: {
          ...((existing as Record<string, unknown>).governance as Record<string, unknown> ?? {}),
          automation_wish: automationWish.trim() || null,
          tool_support_preference: toolSupportPreference || null,
          guidelines_readiness: guidelinesReadiness || null,
        },
      };

      const { error } = await supabase
        .from('shadow_survey_runs')
        .update({ extra_data: merged })
        .eq('id', surveyRunId);

      if (error) throw error;
      onNext();
    } catch {
      toast.error('Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
        <span>Stap 4 van 6</span>
      </div>
      <Progress value={60} className="h-2" />

      <Card className="bg-muted/50 border-0">
        <CardContent className="pt-5 pb-4 text-sm text-muted-foreground">
          Een paar bredere vragen over hoe je met AI werkt.
          Dit helpt de organisatie begrijpen waar AI de meeste
          waarde toevoegt en waar ondersteuning nodig is.
        </CardContent>
      </Card>

      {/* Vraag 1: Taken */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Voor welke taken gebruik je AI-tools?
        </Label>
        <p className="text-sm text-muted-foreground">(meerdere opties mogelijk)</p>
        <div className="space-y-2">
          {TASK_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-start gap-2">
              <Checkbox
                id={`task-${opt.value}`}
                checked={tasks.includes(opt.value)}
                onCheckedChange={() => toggleTask(opt.value)}
              />
              <Label htmlFor={`task-${opt.value}`} className="text-sm font-normal leading-snug cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
          {tasks.includes('other') && (
            <Textarea
              value={taskOtherText}
              onChange={e => setTaskOtherText(e.target.value)}
              placeholder="Beschrijf je taak..."
              rows={2}
              className="ml-6 max-w-md"
            />
          )}
        </div>
      </div>

      {/* Vraag 2: Reden */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Wat is de belangrijkste reden dat je deze tools gebruikt?
        </Label>
        <RadioGroup value={primaryReason} onValueChange={setPrimaryReason}>
          {REASON_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-start gap-2">
              <RadioGroupItem value={opt.value} id={`reason-${opt.value}`} />
              <Label htmlFor={`reason-${opt.value}`} className="text-sm font-normal leading-snug cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {primaryReason === 'other' && (
          <Textarea
            value={reasonOtherText}
            onChange={e => setReasonOtherText(e.target.value)}
            placeholder="Beschrijf je reden..."
            rows={2}
            className="ml-6 max-w-md"
          />
        )}
      </div>

      {/* Vraag 3: Data-invoer */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Wat voor soort informatie voer je soms in AI-tools in?
        </Label>
        <p className="text-sm text-muted-foreground">(meerdere opties mogelijk)</p>
        <div className="space-y-2">
          {DATA_TYPE_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-start gap-2">
              <Checkbox
                id={`data-${opt.value}`}
                checked={dataTypes.includes(opt.value)}
                onCheckedChange={() => toggleDataType(opt.value)}
              />
              <Label htmlFor={`data-${opt.value}`} className="text-sm font-normal leading-snug cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Vraag 4: Databewustzijn */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Ben je je bewust van waar de data naartoe gaat die je in AI-tools invoert?
        </Label>
        <RadioGroup value={dataAwareness} onValueChange={setDataAwareness}>
          {AWARENESS_OPTIONS.map(opt => (
            <div key={opt.value}>
              <div className="flex items-start gap-2">
                <RadioGroupItem value={opt.value} id={`awareness-${opt.value}`} />
                <Label htmlFor={`awareness-${opt.value}`} className="text-sm font-normal leading-snug cursor-pointer">
                  {opt.label}
                </Label>
              </div>
              {dataAwareness === opt.value && (opt.value === 'not_aware' || opt.value === 'unsure') && (
                <div className="ml-6 mt-2 p-3 rounded-md bg-primary/10 border border-primary/20 flex gap-2 text-sm">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Veel AI-tools verwerken ingevoerde data op externe servers.
                    Gratis versies gebruiken invoer soms voor modeltraining.
                    Organisatieversies (enterprise) hebben doorgaans een
                    verwerkersovereenkomst. De scan helpt in kaart te brengen
                    welke situatie voor welke tool geldt.
                  </span>
                </div>
              )}
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Vraag 5: Automatiseringswens */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">
          Welke taak die je nu handmatig doet, zou je het liefst aan een veilige AI willen overlaten?
        </Label>
        <p className="text-sm text-muted-foreground">
          (Optioneel — helpt ons prioriteiten te bepalen.)
        </p>
        <Textarea
          value={automationWish}
          onChange={e => setAutomationWish(e.target.value)}
          placeholder="Bijv. wekelijkse rapportages samenvatten..."
          rows={3}
        />
      </div>

      {/* Vraag 5: Voorkeur toolondersteuning */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Hoe sta je tegenover ondersteuning bij het kiezen van goede AI-tools?
        </Label>
        <RadioGroup value={toolSupportPreference} onValueChange={setToolSupportPreference}>
          {TOOL_SUPPORT_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-start gap-2">
              <RadioGroupItem value={opt.value} id={`toolsupport-${opt.value}`} />
              <Label htmlFor={`toolsupport-${opt.value}`} className="text-sm font-normal leading-snug cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Vraag 6: Bereidheid richtlijnen */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Hoe reageer je op AI-richtlijnen in je werk?
        </Label>
        <RadioGroup value={guidelinesReadiness} onValueChange={setGuidelinesReadiness}>
          {GUIDELINES_READINESS_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-start gap-2">
              <RadioGroupItem value={opt.value} id={`guidelines-${opt.value}`} />
              <Label htmlFor={`guidelines-${opt.value}`} className="text-sm font-normal leading-snug cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Navigatie */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Vorige
        </Button>
        <Button onClick={handleNext} disabled={!isValid || saving}>
          {saving ? 'Opslaan…' : 'Volgende →'}
        </Button>
      </div>
    </div>
  );
}
