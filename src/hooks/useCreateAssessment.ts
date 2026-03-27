import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { buildEngineOutput } from '@/lib/riskEngine';
import type { SurveyAnswers } from '@/types/assessment';
import { toast } from 'sonner';

export function useCreateAssessment() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ answers, toolNameRaw }: { answers: SurveyAnswers; toolNameRaw: string }) => {
      if (!user || !profile?.org_id) throw new Error('Niet ingelogd of geen organisatie');

      const output = buildEngineOutput(answers, toolNameRaw);

      const { data, error } = await supabase
        .from('assessments')
        .insert([{
          org_id: profile.org_id,
          created_by: user.id,
          tool_name_raw: toolNameRaw,
          survey_answers: answers as unknown as Record<string, never>,
          route: output.route,
          primary_archetype: output.primary_archetype,
          secondary_archetypes: output.secondary_archetypes,
          archetype_refs: output.archetype_refs,
          escalation_refs: output.escalation_refs,
          plain_language: output.plain_language,
          routing_method: output.routing_method,
          decision_version: output.decision_version,
          claude_input_hash: output.claude_input_hash ?? null,
          reason_filtered: output.reason_filtered ?? null,
          dpia_required: output.dpia_required,
          fria_required: output.fria_required,
          transparency_required: output.transparency_required,
          transparency_template: output.transparency_template ?? null,
          dpo_oversight_required: output.dpo_oversight_required,
          user_instructions: output.user_instructions,
          dpo_instructions: output.dpo_instructions,
          status: 'active',
        }])
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => navigate(`/assessment/${id}`),
    onError: () => toast.error('Opslaan mislukt. Controleer je verbinding en probeer opnieuw.'),
  });
}
