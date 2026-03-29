import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import AmnestyScreen from '@/components/shadow-survey/AmnestyScreen';
import OrientationStep from '@/components/shadow-survey/OrientationStep';
import ShadowToolInventory from '@/components/shadow-survey/ShadowToolInventory';
import ShadowSurveyResults from '@/components/shadow-survey/ShadowSurveyResults';
import RiskProfileStep from '@/components/shadow-survey/RiskProfileStep';
import UsageAwarenessStep from '@/components/shadow-survey/UsageAwarenessStep';
import TeamParticipationBadge from '@/components/shadow-survey/TeamParticipationBadge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SURVEY_RUN_KEY = 'shadow_survey_run_id';

type SurveyStep = 'amnesty' | 'orientation' | 'tools' | 'usage' | 'results' | 'risk';

export default function ShadowSurveyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [surveyRunId, setSurveyRunId] = useState<string | null>(() => {
    return localStorage.getItem(SURVEY_RUN_KEY);
  });
  const [step, setStep] = useState<SurveyStep>('amnesty');
  const [selectedToolNames, setSelectedToolNames] = useState<string[]>([]);

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
        .select('id, amnesty_acknowledged, survey_completed_at')
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

  // Herstel stap op basis van bestaande run
  useEffect(() => {
    if (existingRun?.id && !surveyRunId) {
      setSurveyRunId(existingRun.id);
      localStorage.setItem(SURVEY_RUN_KEY, existingRun.id);
      if (existingRun.survey_completed_at) {
        setStep('risk');
      } else {
        setStep('orientation');
      }
    }
  }, [existingRun, surveyRunId]);

  // Als surveyRunId gezet wordt via amnesty, ga naar oriëntatie
  useEffect(() => {
    if (surveyRunId && step === 'amnesty') {
      setStep('orientation');
    }
  }, [surveyRunId, step]);

  const handleAmnestyAccepted = (runId: string) => {
    setSurveyRunId(runId);
    localStorage.setItem(SURVEY_RUN_KEY, runId);
    setStep('orientation');
  };

  const handleOrientationNext = (usesAi: string) => {
    // Bij "nee" → sla tool-picker over, ga direct naar risicoprofiel
    if (usesAi === 'nee') {
      setStep('risk');
    } else {
      setStep('tools');
    }
  };

  const handleOrientationBack = () => {
    // Terug naar amnesty is conceptueel, maar run is al aangemaakt.
    // Ga terug naar amnesty-scherm (toont bevestiging dat het al gedaan is).
    setStep('amnesty');
  };

  const handleToolsComplete = (toolNames: string[]) => {
    setSelectedToolNames(toolNames);
    if (toolNames.length === 0) {
      setStep('risk');
    } else {
      setStep('usage');
    }
  };

  const handleUsageNext = () => setStep('results');
  const handleUsageBack = () => setStep('tools');

  const handleResultsComplete = () => {
    setStep('risk');
  };

  const handleRiskComplete = () => {
    toast.success('Survey afgerond!');
    localStorage.removeItem(SURVEY_RUN_KEY);
    navigate('/dashboard');
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

  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-3xl">
        <PageHeader
          title="Shadow AI Scan"
          subtitle="Inventariseer welke AI-tools er binnen je organisatie worden gebruikt."
        />

        {/* Stap 1: Amnesty */}
        {(!surveyRunId || step === 'amnesty') && !surveyRunId && (
          <AmnestyScreen
            orgId={orgId!}
            userId={user!.id}
            settings={orgSettings ?? {}}
            onAccepted={handleAmnestyAccepted}
          />
        )}

        {/* Stap 2: Oriëntatie */}
        {surveyRunId && step === 'orientation' && (
          <>
            <TeamParticipationBadge />
            <OrientationStep
              surveyRunId={surveyRunId}
              onNext={handleOrientationNext}
              onBack={handleOrientationBack}
            />
          </>
        )}

        {/* Stap 3: Tool-picker */}
        {surveyRunId && step === 'tools' && (
          <ShadowToolInventory
            surveyRunId={surveyRunId}
            orgId={orgId!}
            onComplete={handleToolsComplete}
          />
        )}

        {/* Stap 4: Gebruik & databewustzijn */}
        {surveyRunId && step === 'usage' && (
          <UsageAwarenessStep
            surveyRunId={surveyRunId}
            onNext={handleUsageNext}
            onBack={handleUsageBack}
          />
        )}

        {/* Stap 5: Tool match resultaten */}
        {surveyRunId && step === 'results' && (
          <ShadowSurveyResults
            surveyRunId={surveyRunId}
            orgId={orgId!}
            onComplete={handleResultsComplete}
          />
        )}

        {/* Stap 6: Risicoprofiel */}
        {surveyRunId && step === 'risk' && (
          <>
            <TeamParticipationBadge />
            <RiskProfileStep
              surveyRunId={surveyRunId}
              orgId={orgId!}
              selectedToolNames={selectedToolNames}
              onComplete={handleRiskComplete}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
