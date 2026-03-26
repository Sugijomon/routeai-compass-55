import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateTypekaart, type CreateTypekaartInput } from '@/hooks/useModelTypekaarten';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MODEL_TYPES = [
  { value: 'language_model', label: 'Language model' },
  { value: 'image_model', label: 'Image model' },
  { value: 'multimodal', label: 'Multimodal' },
  { value: 'code_model', label: 'Code model' },
  { value: 'other', label: 'Overig' },
];

const EU_LICENSE_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'prohibited', label: 'Prohibited' },
  { value: 'unknown', label: 'Unknown' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'deprecated', label: 'Deprecated' },
];

export function CreateTypekaartDialog({ open, onOpenChange }: Props) {
  const create = useCreateTypekaart();

  const [form, setForm] = useState<CreateTypekaartInput>({
    canonical_id: '',
    display_name: '',
    provider: '',
    model_type: 'language_model',
    gpai_designated: false,
    systemic_risk: false,
    eu_license_status: 'unknown',
    hosting_region: '',
    data_storage_region: '',
    trains_on_input: false,
    dpa_available: false,
    status: 'draft',
  });

  const setField = <K extends keyof CreateTypekaartInput>(k: K, v: CreateTypekaartInput[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const isValid = form.canonical_id.trim() && form.display_name.trim() && form.provider.trim();

  const handleSave = async (publishNow: boolean) => {
    if (!isValid) return;
    const input = {
      ...form,
      status: publishNow ? 'published' : 'draft',
      hosting_region: form.hosting_region || undefined,
      data_storage_region: form.data_storage_region || undefined,
    };
    await create.mutateAsync(input);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => setForm({
    canonical_id: '', display_name: '', provider: '', model_type: 'language_model',
    gpai_designated: false, systemic_risk: false, eu_license_status: 'unknown',
    hosting_region: '', data_storage_region: '', trains_on_input: false, dpa_available: false, status: 'draft',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe typekaart</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* display_name */}
          <div className="space-y-1.5">
            <Label>Weergavenaam *</Label>
            <Input value={form.display_name} onChange={e => setField('display_name', e.target.value)} placeholder="GPT-4o" />
          </div>

          {/* canonical_id */}
          <div className="space-y-1.5">
            <Label>Canonical ID *</Label>
            <Input value={form.canonical_id} onChange={e => setField('canonical_id', e.target.value)} placeholder="gpt-4o" />
          </div>

          {/* provider */}
          <div className="space-y-1.5">
            <Label>Aanbieder *</Label>
            <Input value={form.provider} onChange={e => setField('provider', e.target.value)} placeholder="OpenAI" />
          </div>

          {/* model_type */}
          <div className="space-y-1.5">
            <Label>Modeltype</Label>
            <Select value={form.model_type} onValueChange={v => setField('model_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODEL_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Toggles rij */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-sm">GPAI</Label>
              <Switch checked={form.gpai_designated} onCheckedChange={v => setField('gpai_designated', v)} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-sm">Systemisch risico</Label>
              <Switch checked={form.systemic_risk} onCheckedChange={v => setField('systemic_risk', v)} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-sm">Traint op input</Label>
              <Switch checked={form.trains_on_input} onCheckedChange={v => setField('trains_on_input', v)} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-sm">DPA beschikbaar</Label>
              <Switch checked={form.dpa_available} onCheckedChange={v => setField('dpa_available', v)} />
            </div>
          </div>

          {/* eu_license_status */}
          <div className="space-y-1.5">
            <Label>EU-licentiestatus</Label>
            <Select value={form.eu_license_status} onValueChange={v => setField('eu_license_status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EU_LICENSE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Hosting & storage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Hosting-regio</Label>
              <Input value={form.hosting_region ?? ''} onChange={e => setField('hosting_region', e.target.value)} placeholder="EU / US / Globaal" />
            </div>
            <div className="space-y-1.5">
              <Label>Data-opslagregio</Label>
              <Input value={form.data_storage_region ?? ''} onChange={e => setField('data_storage_region', e.target.value)} placeholder="EU / US / Globaal" />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Acties */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={!isValid || create.isPending}>
              Opslaan als draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={!isValid || create.isPending}>
              Publiceren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
