import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

interface ReportIncidentInput {
  description: string;
  severity: 'low' | 'medium' | 'high';
  output_used: 'yes_unchecked' | 'no_manual_check' | 'yes_after_correction';
  assessment_id?: string;
}

export function useReportIncident() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReportIncidentInput) => {
      if (!user || !profile?.org_id) throw new Error('Niet ingelogd');
      const { error } = await supabase.from('incidents' as any).insert({
        org_id: profile.org_id,
        reported_by: user.id,
        ...input,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident gemeld. Dank voor je melding — dit helpt de organisatie leren.');
    },
    onError: () => toast.error('Melden mislukt. Probeer opnieuw.'),
  });
}

export function useOrgIncidents() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ['incidents', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('incidents' as any)
        .select(`
          id, description, severity, output_used, created_at,
          dpo_notified, dpo_reviewed_at, dpo_action, dpo_notes,
          assessment_id,
          profiles!incidents_reported_by_fkey(full_name, department),
          assessments(tool_name_raw, route)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!orgId,
  });
}

export function useMarkIncidentReviewed() {
  const { profile } = useUserProfile();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId, action, notes,
    }: { incidentId: string; action: string; notes?: string }) => {
      const { error } = await supabase
        .from('incidents' as any)
        .update({
          dpo_action: action,
          dpo_notes: notes ?? null,
          dpo_reviewed_at: new Date().toISOString(),
          dpo_reviewed_by: profile?.id,
        } as any)
        .eq('id', incidentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident bijgewerkt.');
    },
    onError: () => toast.error('Opslaan mislukt.'),
  });
}
