import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useMicrolearningAssignment(assessmentId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Haal toewijzing + voltooiingsstatus op
  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['ml-assignment', assessmentId, user?.id],
    queryFn: async () => {
      if (!assessmentId || !user) return null;

      const { data: assign } = await supabase
        .from('assessment_ml_assignments')
        .select(`
          id, is_required, context_card_text, library_item_id,
          learning_library!assessment_ml_assignments_library_item_id_fkey(
            id, title, description, cluster_id,
            lessons!learning_library_lesson_id_fkey(id, title, estimated_duration)
          )
        `)
        .eq('assessment_id', assessmentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!assign) return null;

      const libraryItem = assign.learning_library as Record<string, unknown> | null;
      const libraryItemId = libraryItem?.id as string | undefined;

      // Check of al voltooid
      let completion = null;
      if (libraryItemId) {
        const { data: comp } = await supabase
          .from('assessment_ml_completions')
          .select('id, completed_at')
          .eq('assessment_id', assessmentId)
          .eq('user_id', user.id)
          .eq('library_item_id', libraryItemId)
          .maybeSingle();
        completion = comp;
      }

      return {
        ...assign,
        isCompleted: !!completion,
        completedAt: completion?.completed_at ?? null,
      };
    },
    enabled: !!assessmentId && !!user,
  });

  // Markeer micro-learning als voltooid
  const markCompleted = useMutation({
    mutationFn: async (libraryItemId: string) => {
      if (!assessmentId || !user) throw new Error('Ontbrekende context');

      const { error } = await supabase
        .from('assessment_ml_completions')
        .insert({
          assessment_id: assessmentId,
          user_id: user.id,
          library_item_id: libraryItemId,
          module_version: '1.0',
        });
      if (error && error.code !== '23505') throw error; // 23505 = duplicate, skip
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ml-assignment', assessmentId] });
      qc.invalidateQueries({ queryKey: ['assessment', assessmentId] });
      toast.success('Micro-learning afgerond. Je DPO wordt geïnformeerd.');
    },
    onError: () => toast.error('Opslaan mislukt.'),
  });

  const libraryItem = assignment?.learning_library as Record<string, unknown> | null;
  const lesson = libraryItem?.lessons as Record<string, unknown> | null;

  return {
    assignment,
    isLoading: assignmentLoading,
    markCompleted,
    hasAssignment: !!assignment,
    isCompleted: assignment?.isCompleted ?? false,
    lessonId: (lesson?.id as string) ?? null,
  };
}
