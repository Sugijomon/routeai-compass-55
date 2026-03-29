import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

export type DpoDecision = 'approve' | 'approve_with_conditions' | 'escalate';

export function useAssessmentReviewQueue() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;
  const qc = useQueryClient();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['dpo-assessment-queue', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id, tool_name_raw, route, primary_archetype, plain_language,
          status, created_at, survey_answers, user_instructions,
          dpo_instructions, dpia_required, fria_required,
          transparency_required, routing_method, reason_filtered,
          created_by,
          profiles!assessments_created_by_fkey(full_name, email, department)
        `)
        .eq('org_id', orgId)
        .in('status', ['pending_dpo' as never, 'pending_review'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const decide = useMutation({
    mutationFn: async ({
      assessmentId,
      notificationId,
      decision,
      notes,
    }: {
      assessmentId: string;
      notificationId: string;
      decision: DpoDecision;
      notes?: string;
    }) => {
      const newAssessmentStatus = decision === 'escalate' ? 'stopped' : 'active';

      const { error: aErr } = await supabase
        .from('assessments')
        .update({
          status: newAssessmentStatus,
          reviewer_admin_id: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', assessmentId);
      if (aErr) throw aErr;

      const { error: nErr } = await supabase
        .from('dpo_notifications')
        .update({
          status: 'actioned',
          actioned_at: new Date().toISOString(),
          actioned_by: profile?.id,
          notes: notes ?? null,
        })
        .eq('id', notificationId);
      if (nErr) throw nErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dpo-assessment-queue', orgId] });
      qc.invalidateQueries({ queryKey: ['dpo-dashboard', orgId] });
      toast.success('Beslissing opgeslagen.');
    },
    onError: () => toast.error('Opslaan mislukt.'),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['dpo-notifications-pending', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from('dpo_notifications')
        .select('id, assessment_id, status')
        .eq('org_id', orgId)
        .eq('status', 'pending');
      return data ?? [];
    },
    enabled: !!orgId,
  });

  function getNotificationId(assessmentId: string): string | null {
    return notifications.find(n => n.assessment_id === assessmentId)?.id ?? null;
  }

  return { queue, isLoading, decide, getNotificationId };
}
