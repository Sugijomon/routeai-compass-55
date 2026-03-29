import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

interface HealthCheck {
  label: string;
  status: 'ok' | 'warning' | 'error' | 'loading';
  detail?: string;
}

export function usePlatformHealthCheck() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  const checks = useQuery({
    queryKey: ['platform-health', orgId],
    queryFn: async (): Promise<HealthCheck[]> => {
      if (!orgId) return [];
      const results: HealthCheck[] = [];

      // 1. AI Literacy cursus aanwezig en gepubliceerd
      try {
        const { data: course } = await supabase
          .from('courses')
          .select('id, title, is_published')
          .eq('required_for_onboarding', true)
          .eq('org_id', orgId)
          .maybeSingle();
        results.push({
          label: 'AI Literacy cursus aanwezig en gepubliceerd',
          status: course?.is_published ? 'ok' : 'error',
          detail: course ? `"${course.title}"` : 'Geen cursus gevonden met required_for_onboarding = true',
        });
      } catch { results.push({ label: 'AI Literacy cursus', status: 'error', detail: 'Query mislukt' }); }

      // 2. Examen aanwezig en gepubliceerd
      try {
        const { data: exam } = await supabase
          .from('lessons')
          .select('id, title, is_published, passing_score')
          .eq('lesson_type', 'ai_literacy_exam')
          .eq('is_published', true)
          .maybeSingle();
        results.push({
          label: 'AI Literacy examen gepubliceerd',
          status: exam ? 'ok' : 'error',
          detail: exam ? `Slagingsdrempel: ${exam.passing_score ?? '?'}%` : 'Geen gepubliceerd examen gevonden',
        });
      } catch { results.push({ label: 'AI Literacy examen', status: 'error', detail: 'Query mislukt' }); }

      // 3. archetype_ml_map heeft entries voor O-01, O-02, O-03
      try {
        const { data: mlMap } = await supabase
          .from('archetype_ml_map')
          .select('archetype_code')
          .in('archetype_code', ['O-01', 'O-02', 'O-03'])
          .eq('is_active', true);
        const codes = (mlMap ?? []).map(m => m.archetype_code);
        const missing = ['O-01', 'O-02', 'O-03'].filter(c => !codes.includes(c));
        results.push({
          label: 'Micro-learning archetype-map (O-01, O-02, O-03)',
          status: missing.length === 0 ? 'ok' : 'error',
          detail: missing.length === 0 ? '3/3 actief' : `Ontbreekt: ${missing.join(', ')}`,
        });
      } catch { results.push({ label: 'Micro-learning archetype-map', status: 'error', detail: 'Query mislukt' }); }

      // 4. Micro-learning lessen aanwezig
      try {
        const { count } = await supabase
          .from('learning_library')
          .select('id', { count: 'exact', head: true })
          .eq('content_type', 'microlearning')
          .eq('status', 'published');
        results.push({
          label: 'Micro-learning modules gepubliceerd',
          status: (count ?? 0) >= 3 ? 'ok' : 'warning',
          detail: `${count ?? 0} gepubliceerd (minimum 3 voor MVP)`,
        });
      } catch { results.push({ label: 'Micro-learning modules', status: 'error', detail: 'Query mislukt' }); }

      // 5. dpo_notifications tabel bereikbaar
      try {
        const { error } = await supabase
          .from('dpo_notifications')
          .select('id', { count: 'exact', head: true });
        results.push({
          label: 'DPO-notificaties tabel bereikbaar',
          status: error ? 'error' : 'ok',
          detail: error ? error.message : 'Tabel toegankelijk',
        });
      } catch { results.push({ label: 'DPO-notificaties tabel', status: 'error', detail: 'Query mislukt' }); }

      // 6. incidents tabel bereikbaar
      try {
        const { error } = await supabase
          .from('incidents')
          .select('id', { count: 'exact', head: true });
        results.push({
          label: 'Incidents tabel bereikbaar',
          status: error ? 'error' : 'ok',
          detail: error ? error.message : 'Tabel toegankelijk',
        });
      } catch { results.push({ label: 'Incidents tabel', status: 'error', detail: 'Query mislukt' }); }

      // 7. assessment_ml_completions tabel bereikbaar
      try {
        const { error } = await supabase
          .from('assessment_ml_completions')
          .select('id', { count: 'exact', head: true });
        results.push({
          label: 'assessment_ml_completions tabel bereikbaar',
          status: error ? 'error' : 'ok',
          detail: error ? error.message : 'Tabel toegankelijk',
        });
      } catch { results.push({ label: 'assessment_ml_completions tabel', status: 'error', detail: 'Query mislukt' }); }

      // 8. Claude Edge Function bereikbaar (probe)
      try {
        const { error } = await supabase.functions.invoke('claude-archetype-assist', {
          body: { tool_name_raw: 'test', v2_freetext: 'health check', deterministic_route: 'green' },
        });
        results.push({
          label: 'Claude Edge Function bereikbaar',
          status: error ? 'warning' : 'ok',
          detail: error ? `Fout: ${error.message} (ANTHROPIC_API_KEY geconfigureerd?)` : 'Reageert',
        });
      } catch { results.push({ label: 'Claude Edge Function', status: 'warning', detail: 'Niet bereikbaar of key ontbreekt' }); }

      // 9. passport_identity tabel bereikbaar
      try {
        const { error } = await supabase
          .from('passport_identity')
          .select('id', { count: 'exact', head: true });
        results.push({
          label: 'passport_identity tabel bereikbaar',
          status: error ? 'error' : 'ok',
          detail: error ? error.message : 'Tabel toegankelijk',
        });
      } catch { results.push({ label: 'passport_identity tabel', status: 'error', detail: 'Query mislukt' }); }

      return results;
    },
    enabled: !!orgId,
    refetchInterval: false,
    staleTime: 0,
  });

  return checks;
}
