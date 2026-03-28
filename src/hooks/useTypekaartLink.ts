import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Alle gepubliceerde typekaarten ophalen (voor dropdown)
export function usePublishedTypekaarten() {
  return useQuery({
    queryKey: ['typekaarten-published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_typekaarten')
        .select('id, canonical_id, display_name, provider, gpai_designated, systemic_risk, eu_license_status, data_storage_region, dpa_available, trains_on_input, contractual_restrictions')
        .eq('status', 'published')
        .order('provider', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Koppel een typekaart aan een org_tools_catalog entry
export function useLinkTypekaart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ catalogEntryId, typekaartId }: { catalogEntryId: string; typekaartId: string | null }) => {
      const { error } = await supabase
        .from('org_tools_catalog')
        .update({ typekaart_id: typekaartId })
        .eq('id', catalogEntryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-tools-catalog'] });
      toast.success('Typekaart gekoppeld.');
    },
    onError: () => toast.error('Koppelen mislukt.'),
  });
}
