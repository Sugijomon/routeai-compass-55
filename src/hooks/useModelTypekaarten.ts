import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModelTypekaart {
  id: string;
  canonical_id: string;
  display_name: string;
  provider: string;
  model_type: string;
  gpai_designated: boolean;
  systemic_risk: boolean;
  eu_license_status: string;
  hosting_region: string | null;
  data_storage_region: string | null;
  trains_on_input: boolean;
  dpa_available: boolean;
  statutory_prohibitions: unknown[];
  contractual_restrictions: unknown[];
  typekaart_version: string;
  last_verified_at: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelTypekaartUpdate {
  id: string;
  typekaart_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: string | null;
  source: string | null;
  confidence: string | null;
  approved_by: string | null;
  approved_at: string | null;
  status: string;
  created_at: string;
  // joined
  typekaart_display_name?: string;
}

export interface CreateTypekaartInput {
  canonical_id: string;
  display_name: string;
  provider: string;
  model_type: string;
  gpai_designated?: boolean;
  systemic_risk?: boolean;
  eu_license_status?: string;
  hosting_region?: string;
  data_storage_region?: string;
  trains_on_input?: boolean;
  dpa_available?: boolean;
  status?: string;
}

export function useModelTypekaarten() {
  return useQuery({
    queryKey: ['model-typekaarten'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_typekaarten' as never)
        .select('*')
        .order('display_name');
      if (error) throw error;
      return (data ?? []) as unknown as ModelTypekaart[];
    },
  });
}

export function useCreateTypekaart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTypekaartInput) => {
      const { data, error } = await supabase
        .from('model_typekaarten' as never)
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['model-typekaarten'] });
      toast.success('Typekaart aangemaakt');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTypekaartUpdates(statusFilter?: string) {
  return useQuery({
    queryKey: ['typekaart-updates', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('model_typekaart_updates' as never)
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich met typekaart naam
      const updates = (data ?? []) as unknown as ModelTypekaartUpdate[];
      if (updates.length === 0) return updates;

      const ids = [...new Set(updates.map(u => u.typekaart_id))];
      const { data: tks } = await supabase
        .from('model_typekaarten' as never)
        .select('id, display_name')
        .in('id', ids);

      const nameMap = new Map((tks ?? []).map((t: { id: string; display_name: string }) => [t.id, t.display_name]));
      return updates.map(u => ({ ...u, typekaart_display_name: nameMap.get(u.typekaart_id) ?? '—' }));
    },
  });
}

export function useActionTypekaartUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: 'approved' | 'rejected'; notes?: string }) => {
      const updateData: Record<string, unknown> = {
        status: action,
        approved_at: new Date().toISOString(),
      };
      // approved_by wordt via RLS/auth context gezet
      const { error } = await supabase
        .from('model_typekaart_updates' as never)
        .update(updateData as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['typekaart-updates'] });
      toast.success('Update verwerkt');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
