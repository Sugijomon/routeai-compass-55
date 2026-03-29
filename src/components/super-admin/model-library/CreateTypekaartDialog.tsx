import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
}

const DEFAULT_FORM = {
  canonical_id: '', display_name: '', provider: '', model_type: 'GPAI',
  gpai_designated: false, systemic_risk: false,
  eu_license_status: 'open', hosting_region: 'US', data_storage_region: 'US',
  trains_on_input: false, dpa_available: false,
  typekaart_version: '1.0', status: 'draft',
};

export function CreateTypekaartDialog({ open, onOpenChange, editId }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(DEFAULT_FORM);
  const isEdit = !!editId;

  const { data: existing } = useQuery({
    queryKey: ['typekaart-detail', editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data } = await supabase.from('model_typekaarten').select('*').eq('id', editId).single();
      return data;
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        canonical_id: existing.canonical_id ?? '',
        display_name: existing.display_name ?? '',
        provider: existing.provider ?? '',
        model_type: existing.model_type ?? 'GPAI',
        gpai_designated: existing.gpai_designated ?? false,
        systemic_risk: existing.systemic_risk ?? false,
        eu_license_status: existing.eu_license_status ?? 'open',
        hosting_region: existing.hosting_region ?? 'US',
        data_storage_region: existing.data_storage_region ?? 'US',
        trains_on_input: existing.trains_on_input ?? false,
        dpa_available: existing.dpa_available ?? false,
        typekaart_version: existing.typekaart_version ?? '1.0',
        status: existing.status ?? 'draft',
      });
    } else if (!editId) {
      setForm(DEFAULT_FORM);
    }
  }, [existing, editId]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        last_verified_at: new Date().toISOString(),
      };
      if (isEdit) {
        const { error } = await supabase.from('model_typekaarten').update(payload).eq('id', editId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('model_typekaarten').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['typekaarten-all'] });
      qc.invalidateQueries({ queryKey: ['typekaarten-published'] });
      toast.success(isEdit ? 'Typekaart bijgewerkt.' : 'Typekaart aangemaakt.');
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(`Opslaan mislukt: ${e.message}`),
  });

  const f = (field: keyof typeof form) => (val: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const isValid = form.canonical_id.trim() && form.display_name.trim() && form.provider.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Typekaart bewerken' : 'Nieuwe typekaart'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Canonical ID *</Label>
              <Input value={form.canonical_id} onChange={e => f('canonical_id')(e.target.value)}
                placeholder="bijv. chatgpt-plus" className="mt-1" disabled={isEdit} />
            </div>
            <div>
              <Label>Versie</Label>
              <Input value={form.typekaart_version} onChange={e => f('typekaart_version')(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Weergavenaam *</Label>
            <Input value={form.display_name} onChange={e => f('display_name')(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Aanbieder *</Label>
              <Input value={form.provider} onChange={e => f('provider')(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Modeltype</Label>
              <Input value={form.model_type} onChange={e => f('model_type')(e.target.value)} className="mt-1" placeholder="GPAI" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>EU-licentiestatus</Label>
              <Select value={form.eu_license_status} onValueChange={v => f('eu_license_status')(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="restricted">Beperkt</SelectItem>
                  <SelectItem value="prohibited">Verboden</SelectItem>
                  <SelectItem value="unknown">Onbekend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => f('status')(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Gepubliceerd</SelectItem>
                  <SelectItem value="deprecated">Gearchiveerd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hosting regio</Label>
              <Input value={form.hosting_region} onChange={e => f('hosting_region')(e.target.value)}
                className="mt-1" placeholder="EU / US / Mixed" />
            </div>
            <div>
              <Label>Dataopslag regio</Label>
              <Input value={form.data_storage_region} onChange={e => f('data_storage_region')(e.target.value)}
                className="mt-1" placeholder="EU / US / Mixed" />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            {[
              { field: 'gpai_designated' as const, label: 'GPAI-aangemerkt', desc: 'Officieel als GPAI geregistreerd door EU AI Office' },
              { field: 'systemic_risk' as const, label: 'Systemisch risico', desc: 'Boven 10²⁵ FLOPs drempel (Art. 55–56 EU AI Act)' },
              { field: 'trains_on_input' as const, label: 'Traint op input', desc: 'Standaard: model leert van gebruikersinvoer' },
              { field: 'dpa_available' as const, label: 'DPA beschikbaar', desc: 'Verwerkersovereenkomst beschikbaar via vendor' },
            ].map(({ field, label, desc }) => (
              <div key={field} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={form[field] as boolean} onCheckedChange={v => f(field)(v)} />
              </div>
            ))}
          </div>

          <Button onClick={() => save.mutate()} disabled={!isValid || save.isPending} className="w-full">
            {save.isPending ? 'Opslaan...' : isEdit ? 'Wijzigingen opslaan' : 'Typekaart aanmaken'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
