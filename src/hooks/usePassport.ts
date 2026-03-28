import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

export function usePassport() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  // Sectie 1+2: Identiteit + governance-principes
  const { data: identity, refetch: refetchIdentity } = useQuery({
    queryKey: ['passport-identity', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase
        .from('passport_identity')
        .select('*')
        .eq('org_id', orgId)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  const { data: orgName } = useQuery({
    queryKey: ['passport-org-name', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase
        .from('organizations')
        .select('name, created_at')
        .eq('id', orgId)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  const saveIdentity = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!orgId) throw new Error('Geen org_id');
      const { error } = await supabase
        .from('passport_identity')
        .upsert({ org_id: orgId, ...payload } as never, { onConflict: 'org_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchIdentity();
      toast.success('Opgeslagen.');
    },
    onError: () => toast.error('Opslaan mislukt.'),
  });

  // Sectie 3: Tool catalog + shadow AI discovery
  const { data: toolCatalog } = useQuery({
    queryKey: ['passport-tools', orgId],
    queryFn: async () => {
      if (!orgId) return { approved: 0, underReview: 0, notApproved: 0, tools: [] };
      const { data } = await supabase
        .from('org_tools_catalog')
        .select('tool_name, status, added_at')
        .eq('org_id', orgId)
        .order('added_at', { ascending: false });
      const tools = data ?? [];
      return {
        approved: tools.filter(t => t.status === 'approved').length,
        underReview: tools.filter(t => t.status === 'under_review').length,
        notApproved: tools.filter(t => t.status === 'not_approved').length,
        tools,
      };
    },
    enabled: !!orgId,
  });

  const { data: shadowDiscoveries } = useQuery({
    queryKey: ['passport-shadow', orgId],
    queryFn: async () => {
      if (!orgId) return { total: 0, recentTools: [] };
      const { data } = await supabase
        .from('tool_discoveries')
        .select('tool_name, submitted_at, application_risk_class')
        .eq('org_id', orgId)
        .order('submitted_at', { ascending: false })
        .limit(5);
      const { count } = await supabase
        .from('tool_discoveries')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId);
      return { total: count ?? 0, recentTools: data ?? [] };
    },
    enabled: !!orgId,
  });

  // Sectie 5: Assessment register
  const { data: assessmentRegister } = useQuery({
    queryKey: ['passport-assessments', orgId],
    queryFn: async () => {
      if (!orgId) return { total: 0, byRoute: {} as Record<string, number>, recent: [] as Array<Record<string, unknown>> };
      const { data } = await supabase
        .from('assessments')
        .select('id, tool_name_raw, route, primary_archetype, status, created_at, routing_method')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      const all = data ?? [];
      const byRoute = all.reduce((acc, a) => {
        acc[a.route] = (acc[a.route] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return { total: all.length, byRoute, recent: all.slice(0, 10) };
    },
    enabled: !!orgId,
  });

  // Sectie 6: High-risk (Annex III) index — Oranje assessments
  const { data: annexIII } = useQuery({
    queryKey: ['passport-annex3', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from('assessments')
        .select(`
          id, tool_name_raw, primary_archetype, status, created_at,
          dpia_required, fria_required, dpo_oversight_required,
          profiles!assessments_created_by_fkey(full_name, department)
        `)
        .eq('org_id', orgId)
        .eq('route', 'orange')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Sectie 12: AI Literacy dekking
  const { data: literacyCoverage } = useQuery({
    queryKey: ['passport-literacy', orgId],
    queryFn: async () => {
      if (!orgId) return { total: 0, withRijbewijs: 0, percentage: 0 };
      const { count: total } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId);
      const { count: withRijbewijs } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('has_ai_rijbewijs', true);
      const t = total ?? 0;
      const w = withRijbewijs ?? 0;
      return { total: t, withRijbewijs: w, percentage: t > 0 ? Math.round((w / t) * 100) : 0 };
    },
    enabled: !!orgId,
  });

  return { identity, orgName, saveIdentity, toolCatalog, shadowDiscoveries, assessmentRegister, annexIII, literacyCoverage };
}
