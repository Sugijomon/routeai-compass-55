import { useState } from 'react';
import { classifyApplication } from '@/lib/riskEngine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  MessageSquare, PenLine, Code2, Palette,
  BarChart3, BookOpen, Layers, HardDrive,
  Check, ArrowRight, ArrowLeft, Ban, Loader2,
} from 'lucide-react';

// --- Categorie- en tool-data ---

interface ToolOption {
  name: string;
}

interface ToolCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  tools: ToolOption[];
}

const CATEGORIES: ToolCategory[] = [
  {
    id: 'conversation',
    label: 'Conversatie & assistentie',
    icon: MessageSquare,
    tools: [
      { name: 'ChatGPT' }, { name: 'Claude' }, { name: 'Gemini' },
      { name: 'Copilot' }, { name: 'Perplexity' },
    ],
  },
  {
    id: 'writing',
    label: 'Schrijven & content',
    icon: PenLine,
    tools: [
      { name: 'Grammarly' }, { name: 'Jasper' },
      { name: 'Notion AI' }, { name: 'Otter.ai' },
    ],
  },
  {
    id: 'code',
    label: 'Code & development',
    icon: Code2,
    tools: [
      { name: 'GitHub Copilot' }, { name: 'Cursor' },
      { name: 'Tabnine' }, { name: 'Codeium' },
    ],
  },
  {
    id: 'design',
    label: 'Design & visueel',
    icon: Palette,
    tools: [
      { name: 'Midjourney' }, { name: 'DALL-E' },
      { name: 'Canva AI' }, { name: 'Adobe Firefly' },
    ],
  },
  {
    id: 'data',
    label: 'Data & analyse',
    icon: BarChart3,
    tools: [{ name: 'Julius AI' }, { name: 'Excel Copilot' }],
  },
  {
    id: 'research',
    label: 'Research & leren',
    icon: BookOpen,
    tools: [
      { name: 'Elicit' }, { name: 'Consensus' }, { name: 'Perplexity' },
    ],
  },
  {
    id: 'embedded',
    label: 'Ingebed in bestaande tools',
    icon: Layers,
    tools: [
      { name: 'M365 Copilot' }, { name: 'Salesforce Einstein' },
      { name: 'Zoom AI' }, { name: 'Slack AI' },
    ],
  },
  {
    id: 'local',
    label: 'Lokale agents',
    icon: HardDrive,
    tools: [
      { name: 'Claude Desktop' }, { name: 'AutoGPT' },
      { name: 'Custom local agent' },
    ],
  },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Dagelijks' },
  { value: 'multiple_weekly', label: 'Meerdere keren per week' },
  { value: 'weekly', label: 'Wekelijks' },
  { value: 'rarely', label: 'Zelden' },
];

const USE_CASE_OPTIONS = [
  { value: 'writing', label: 'Teksten schrijven' },
  { value: 'code', label: 'Code' },
  { value: 'data_analysis', label: 'Data analyseren' },
  { value: 'research', label: 'Research' },
  { value: 'brainstorm', label: 'Brainstormen' },
  { value: 'meeting_summary', label: 'Meetings samenvatten' },
  { value: 'image_creation', label: 'Afbeeldingen maken' },
  { value: 'hr_decision', label: 'HR-besluitvorming (selectie, beoordeling, promotie)' },
  { value: 'personal_data', label: 'Verwerking van persoonsgegevens' },
  { value: 'other', label: 'Anders' },
];

const DATA_TYPE_OPTIONS = [
  { value: 'public', label: 'Alleen publieke info' },
  { value: 'internal', label: 'Interne bedrijfsdata' },
  { value: 'client', label: 'Klant- of projectdata' },
  { value: 'sensitive', label: 'Gevoelige/vertrouwelijke data' },
];

const ACCESS_OPTIONS = [
  { value: 'free', label: 'Gratis versie' },
  { value: 'paid_private', label: 'Betaald privé' },
  { value: 'paid_business', label: 'Betaald zakelijk' },
  { value: 'embedded', label: 'Embedded in andere software' },
  { value: 'local', label: 'Lokale installatie' },
];

// --- Follow-up per tool ---

interface ToolFollowUp {
  frequency: string;
  useCases: string[];
  dataType: string;
  access: string;
}

function ToolFollowUpForm({
  toolName,
  value,
  onChange,
}: {
  toolName: string;
  value: ToolFollowUp;
  onChange: (v: ToolFollowUp) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{toolName}</h3>

      {/* Q1 — frequentie */}
      <div className="space-y-2">
        <Label className="font-medium">Hoe vaak gebruik je {toolName}?</Label>
        <RadioGroup
          value={value.frequency}
          onValueChange={(v) => onChange({ ...value, frequency: v })}
          className="grid grid-cols-2 gap-2"
        >
          {FREQUENCY_OPTIONS.map((o) => (
            <div key={o.value} className="flex items-center space-x-2">
              <RadioGroupItem value={o.value} id={`freq-${toolName}-${o.value}`} />
              <Label htmlFor={`freq-${toolName}-${o.value}`} className="cursor-pointer">{o.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Q2 — use cases */}
      <div className="space-y-2">
        <Label className="font-medium">Waarvoor gebruik je {toolName}?</Label>
        <div className="grid grid-cols-2 gap-2">
          {USE_CASE_OPTIONS.map((o) => {
            const checked = value.useCases.includes(o.value);
            return (
              <div key={o.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`uc-${toolName}-${o.value}`}
                  checked={checked}
                  onCheckedChange={(c) => {
                    const next = c
                      ? [...value.useCases, o.value]
                      : value.useCases.filter((v) => v !== o.value);
                    onChange({ ...value, useCases: next });
                  }}
                />
                <Label htmlFor={`uc-${toolName}-${o.value}`} className="cursor-pointer">{o.label}</Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Q3 — data classificatie */}
      <div className="space-y-2">
        <Label className="font-medium">Met welke data gebruik je {toolName}?</Label>
        <RadioGroup
          value={value.dataType}
          onValueChange={(v) => onChange({ ...value, dataType: v })}
          className="space-y-2"
        >
          {DATA_TYPE_OPTIONS.map((o) => (
            <div key={o.value} className="flex items-center space-x-2">
              <RadioGroupItem value={o.value} id={`dt-${toolName}-${o.value}`} />
              <Label htmlFor={`dt-${toolName}-${o.value}`} className="cursor-pointer">{o.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Q4 — toegang */}
      <div className="space-y-2">
        <Label className="font-medium">Hoe heb je toegang tot {toolName}?</Label>
        <RadioGroup
          value={value.access}
          onValueChange={(v) => onChange({ ...value, access: v })}
          className="space-y-2"
        >
          {ACCESS_OPTIONS.map((o) => (
            <div key={o.value} className="flex items-center space-x-2">
              <RadioGroupItem value={o.value} id={`acc-${toolName}-${o.value}`} />
              <Label htmlFor={`acc-${toolName}-${o.value}`} className="cursor-pointer">{o.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

// --- Hoofd-component ---

interface Props {
  surveyRunId: string;
  orgId: string;
  onComplete: (selectedToolNames: string[]) => void;
}

export default function ShadowToolInventory({ surveyRunId, orgId, onComplete }: Props) {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  // Stap A: tool selectie  |  Stap B: follow-up per tool
  const [phase, setPhase] = useState<'pick' | 'followup'>('pick');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customTools, setCustomTools] = useState<Record<string, string>>({});
  const [noTools, setNoTools] = useState(false);

  // Follow-up state
  const [followUps, setFollowUps] = useState<Record<string, ToolFollowUp>>({});
  const [currentToolIndex, setCurrentToolIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // Alle geselecteerde tools incl. custom
  const allSelectedTools = (() => {
    const tools = [...selectedTools];
    Object.values(customTools).forEach((v) => {
      const trimmed = v.trim();
      if (trimmed && !tools.includes(trimmed)) tools.push(trimmed);
    });
    return tools;
  })();

  const toggleTool = (name: string) => {
    if (noTools) return;
    setSelectedTools((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const handleNoTools = () => {
    setNoTools(true);
    setSelectedTools([]);
    setCustomTools({});
  };

  const handleStartFollowUp = () => {
    if (noTools) {
      // Sla direct op — geen tools
      handleCompleteNoTools();
      return;
    }
    if (allSelectedTools.length === 0) {
      toast.error('Selecteer minstens één tool of kies "Ik gebruik geen AI tools".');
      return;
    }
    // Initialiseer follow-ups
    const initial: Record<string, ToolFollowUp> = {};
    allSelectedTools.forEach((t) => {
      initial[t] = { frequency: '', useCases: [], dataType: '', access: '' };
    });
    setFollowUps(initial);
    setCurrentToolIndex(0);
    setPhase('followup');
  };

  const handleCompleteNoTools = async () => {
    setSaving(true);
    try {
      // Update survey run als afgerond
      await supabase
        .from('shadow_survey_runs')
        .update({ survey_completed_at: new Date().toISOString() })
        .eq('id', surveyRunId);
      onComplete(allSelectedTools);
    } catch {
      toast.error('Er ging iets mis bij het opslaan.');
    } finally {
      setSaving(false);
    }
  };

  const currentTool = allSelectedTools[currentToolIndex] ?? '';
  const currentFollowUp = followUps[currentTool] ?? {
    frequency: '', useCases: [], dataType: '', access: '',
  };

  const isCurrentValid =
    currentFollowUp.frequency !== '' &&
    currentFollowUp.useCases.length > 0 &&
    currentFollowUp.dataType !== '' &&
    currentFollowUp.access !== '';

  const saveCurrentTool = async () => {
    setSaving(true);
    try {
      const fu = followUps[currentTool];
      const { error } = await supabase.from('tool_discoveries').insert({
        survey_run_id: surveyRunId,
        org_id: orgId,
        submitted_by: user!.id,
        tool_name: currentTool,
        use_case: fu.useCases.join(', '),
        use_frequency: fu.frequency,
        data_types_used: [fu.dataType],
        department: profile?.department ?? null,
      });
      if (error) throw error;

      if (currentToolIndex < allSelectedTools.length - 1) {
        setCurrentToolIndex((i) => i + 1);
      } else {
        // Alle tools verwerkt
        toast.success('Tool-inventarisatie opgeslagen!');
        onComplete(allSelectedTools);
      }
    } catch {
      toast.error('Fout bij het opslaan van de tool.');
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER ---

  // Voortgangsbalk: stap 2 van 4
  const stepProgress = 50; // stap 2/4

  if (phase === 'followup') {
    const toolProgress = ((currentToolIndex + 1) / allSelectedTools.length) * 100;

    return (
      <div className="space-y-6">
        {/* Voortgang */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Stap 2 van 4 — Tool details</span>
            <span>Tool {currentToolIndex + 1} van {allSelectedTools.length}</span>
          </div>
          <Progress value={stepProgress} className="h-2" />
          <Progress value={toolProgress} className="h-1.5 mt-1" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <ToolFollowUpForm
              toolName={currentTool}
              value={currentFollowUp}
              onChange={(v) =>
                setFollowUps((prev) => ({ ...prev, [currentTool]: v }))
              }
            />
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (currentToolIndex > 0) setCurrentToolIndex((i) => i - 1);
              else setPhase('pick');
            }}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Terug
          </Button>
          <Button onClick={saveCurrentTool} disabled={!isCurrentValid || saving}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {currentToolIndex < allSelectedTools.length - 1 ? (
              <>Volgende tool <ArrowRight className="ml-1 h-4 w-4" /></>
            ) : (
              'Afronden'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // --- Phase: pick ---
  return (
    <div className="space-y-6">
      {/* Voortgang */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Stap 2 van 4 — Welke AI-tools gebruik je?</p>
        <Progress value={stepProgress} className="h-2" />
      </div>

      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <div key={cat.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{cat.label}</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {cat.tools.map((tool) => {
                const isSelected = selectedTools.includes(tool.name);
                return (
                  <button
                    key={tool.name}
                    type="button"
                    disabled={noTools}
                    onClick={() => toggleTool(tool.name)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-card text-foreground hover:bg-muted/50',
                      noTools && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    {tool.name}
                  </button>
                );
              })}
            </div>

            {/* Custom invoer */}
            <Input
              placeholder="Anders: ..."
              disabled={noTools}
              value={customTools[cat.id] ?? ''}
              onChange={(e) =>
                setCustomTools((prev) => ({ ...prev, [cat.id]: e.target.value }))
              }
              className="max-w-xs"
            />
          </div>
        );
      })}

      {/* Geen tools */}
      <button
        type="button"
        onClick={noTools ? () => setNoTools(false) : handleNoTools}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border p-4 text-sm transition-colors',
          noTools
            ? 'border-primary bg-primary/10 text-primary font-medium'
            : 'border-border text-muted-foreground hover:bg-muted/50'
        )}
      >
        <Ban className="h-4 w-4" />
        Ik gebruik geen AI tools
      </button>

      <div className="flex justify-end">
        <Button onClick={handleStartFollowUp} disabled={saving}>
          {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          {noTools ? 'Afronden' : 'Ga verder'}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
