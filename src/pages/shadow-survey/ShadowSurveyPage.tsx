import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import AmnestyScreen from '@/components/shadow-survey/AmnestyScreen';
import { Loader2 } from 'lucide-react';

const SURVEY_RUN_KEY = 'shadow_survey_run_id';

export default function ShadowSurveyPage() {
  const { user } = useAuth();

  // Herstel survey_run_id uit localStorage bij refresh
  const [surveyRunId, setSurveyRunId] = useState<string | null>(() => {
    return localStorage.getItem(SURVEY_RUN_KEY);
  });

  // Haal org_id op
  const { data: profile } = useQuery({
    queryKey: ['own-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const orgId = profile?.org_id;

  // Haal org-settings op (amnesty config)
  const { data: orgSettings, isLoading: orgLoading } = useQuery({
    queryKey: ['org-amnesty-settings', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId!)
        .maybeSingle();
      return (data?.settings as Record<string, unknown>) ?? {};
    },
    enabled: !!orgId,
  });

  // Check of gebruiker al een run heeft met amnesty_acknowledged
  const { data: existingRun, isLoading: runLoading } = useQuery({
    queryKey: ['existing-survey-run', user?.id, orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('shadow_survey_runs')
        .select('id, amnesty_acknowledged')
        .eq('user_id', user!.id)
        .eq('org_id', orgId!)
        .eq('amnesty_acknowledged', true)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!orgId,
  });

  // Als er al een bestaande run is, stel die in
  useEffect(() => {
    if (existingRun?.id && !surveyRunId) {
      setSurveyRunId(existingRun.id);
      localStorage.setItem(SURVEY_RUN_KEY, existingRun.id);
    }
  }, [existingRun, surveyRunId]);

  const handleAmnestyAccepted = (runId: string) => {
    setSurveyRunId(runId);
    localStorage.setItem(SURVEY_RUN_KEY, runId);
  };

  const isLoading = orgLoading || runLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  // Stap 1: Amnesty-scherm (als nog geen run)
  if (!surveyRunId) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 max-w-3xl">
          <PageHeader
            title="Shadow AI Survey"
            subtitle="Inventariseer welke AI-tools er binnen je organisatie worden gebruikt."
          />
          <AmnestyScreen
            orgId={orgId!}
            userId={user!.id}
            settings={orgSettings ?? {}}
            onAccepted={handleAmnestyAccepted}
          />
        </div>
      </AppLayout>
    );
  }

  // Stap 2: Tool-picker
  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-3xl">
        <PageHeader
          title="Shadow AI Survey"
          subtitle="Inventariseer welke AI-tools er binnen je organisatie worden gebruikt."
        />
        <ShadowToolInventory
          surveyRunId={surveyRunId}
          orgId={orgId!}
          onComplete={() => {
            toast.success('Tool-inventarisatie afgerond!');
          }}
        />
      </div>
    </AppLayout>
  );
}
