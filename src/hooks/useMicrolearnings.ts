import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useMicrolearnings() {
  const qc = useQueryClient();

  const { data: microlearnings = [], isLoading } = useQuery({
    queryKey: ['editor-microlearnings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_library')
        .select(`
          id, title, description, status, version,
          created_at, updated_at
        `)
        .eq('content_type', 'microlearning' as never)
        .order('updated_at', { ascending: false });
      if (error) throw error;

      // Haal extra velden op via raw query want cluster_id etc. zitten niet in types
      // We casten naar een breder type
      return (data ?? []) as Array<{
        id: string;
        title: string;
        description: string | null;
        status: string;
        version: string | null;
        created_at: string | null;
        updated_at: string | null;
        cluster_id?: string | null;
        archetype_codes?: string[];
        is_activation_req?: boolean;
        context_card?: string | null;
        lesson_id?: string | null;
        lessons?: { id: string; title: string; is_published: boolean; estimated_duration: number | null } | null;
      }>;
    },
  });

  const updateMetadata = useMutation({
    mutationFn: async (payload: {
      id: string;
      title?: string;
      description?: string;
      cluster_id?: string | null;
      archetype_codes?: string[];
      is_activation_req?: boolean;
      context_card?: string;
      status?: string;
      lesson_id?: string | null;
    }) => {
      const { id, ...updates } = payload;
      const { error } = await supabase
        .from('learning_library')
        .update({
          ...(updates.title !== undefined ? { title: updates.title } : {}),
          ...(updates.description !== undefined ? { description: updates.description } : {}),
          ...(updates.status !== undefined ? { status: updates.status as 'draft' | 'published' | 'deprecated' } : {}),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['editor-microlearnings'] });
      toast.success('Opgeslagen.');
    },
    onError: () => toast.error('Opslaan mislukt.'),
  });

  const createMicrolearning = useMutation({
    mutationFn: async (payload: { title: string; description?: string }) => {
      const { data, error } = await supabase
        .from('learning_library')
        .insert({
          content_type: 'microlearning' as never,
          title: payload.title,
          description: payload.description ?? '',
          status: 'draft',
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['editor-microlearnings'] });
      toast.success('Micro-learning aangemaakt.');
    },
    onError: () => toast.error('Aanmaken mislukt.'),
  });

  return { microlearnings, isLoading, updateMetadata, createMicrolearning };
}
