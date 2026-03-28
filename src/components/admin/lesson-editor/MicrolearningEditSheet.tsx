import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const ARCHETYPE_OPTIONS = [
  { value: 'O-01', label: 'O-01 — Evaluatief (personeelsselectie, prestatiebeoordeling)' },
  { value: 'O-02', label: 'O-02 — Beslissingsondersteunend (financieel, juridisch, HR)' },
  { value: 'O-03', label: 'O-03 — Autonoom (agents, automated workflows)' },
  { value: 'O-04', label: 'O-04 — Biometrie & emotieherkenning' },
];

const CLUSTER_OPTIONS = [
  { value: 'CL-1', label: 'CL-1 — Verification Gatekeeper' },
  { value: 'CL-2', label: 'CL-2 — Risk Monitor & Escalator' },
  { value: 'CL-3', label: 'CL-3 — Data Steward' },
  { value: 'CL-4', label: 'CL-4 — Transparency Communicator' },
];

interface MLRecord {
  id: string;
  title: string;
  description: string | null;
  status: string;
  cluster_id?: string | null;
  archetype_codes?: string[];
  is_activation_req?: boolean;
  context_card?: string | null;
  lesson_id?: string | null;
  lessons?: { id: string; title: string; is_published: boolean; estimated_duration: number | null } | null;
}

interface Props {
  ml: MLRecord | null;
  onClose: () => void;
  onSave: (id: string, updates: Record<string, unknown>) => void;
  isPending: boolean;
}

export function MicrolearningEditSheet({ ml, onClose, onSave, isPending }: Props) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    cluster_id: '',
    archetype_codes: [] as string[],
    is_activation_req: false,
    context_card: '',
    status: 'draft',
  });

  useEffect(() => {
    if (ml) {
      setForm({
        title: ml.title ?? '',
        description: ml.description ?? '',
        cluster_id: ml.cluster_id ?? '',
        archetype_codes: ml.archetype_codes ?? [],
        is_activation_req: ml.is_activation_req ?? false,
        context_card: ml.context_card ?? '',
        status: ml.status ?? 'draft',
      });
    }
  }, [ml?.id]);

  if (!ml) return null;

  const toggleArchetype = (code: string) => {
    setForm(f => ({
      ...f,
      archetype_codes: f.archetype_codes.includes(code)
        ? f.archetype_codes.filter(c => c !== code)
        : [...f.archetype_codes, code],
    }));
  };

  return (
    <Sheet open={!!ml} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Micro-learning bewerken</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Basisvelden */}
          <div className="space-y-3">
            <div>
              <Label>Titel</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Beschrijving</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" rows={2} />
            </div>
          </div>

          <Separator />

          {/* Gedragscluster */}
          <div>
            <Label>Gedragscluster</Label>
            <Select value={form.cluster_id} onValueChange={v => setForm(f => ({ ...f, cluster_id: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Kies een cluster…" />
              </SelectTrigger>
              <SelectContent>
                {CLUSTER_OPTIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Archetype-codes */}
          <div>
            <Label>Archetype-codes (één of meer)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ARCHETYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleArchetype(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    form.archetype_codes.includes(opt.value)
                      ? 'bg-orange-100 border-orange-400 text-orange-800'
                      : 'bg-muted border-border text-muted-foreground hover:border-orange-300'
                  }`}
                >
                  {opt.value}
                </button>
              ))}
            </div>
            {form.archetype_codes.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {ARCHETYPE_OPTIONS.filter(o => form.archetype_codes.includes(o.value)).map(o => o.label).join(', ')}
              </p>
            )}
          </div>

          {/* Activatie-eis */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Activatie-eis bij Oranje route</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Assessment wordt pas actief na voltooiing van deze module</p>
            </div>
            <Switch
              checked={form.is_activation_req}
              onCheckedChange={v => setForm(f => ({ ...f, is_activation_req: v }))}
            />
          </div>

          {/* Contextkaart */}
          <div>
            <Label>Standaard contextkaart (max 200 tekens)</Label>
            <Textarea
              value={form.context_card}
              onChange={e => setForm(f => ({ ...f, context_card: e.target.value.slice(0, 200) }))}
              placeholder="2–4 zinnen die uitleggen waarom deze use-case in dit cluster valt…"
              className="mt-1"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{form.context_card.length}/200</p>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Gepubliceerd</SelectItem>
                <SelectItem value="deprecated">Gearchiveerd</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Opslaan */}
          <Button
            className="w-full"
            onClick={() => onSave(ml.id, form)}
            disabled={isPending || !form.title.trim()}
          >
            {isPending ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
