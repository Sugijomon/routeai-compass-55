import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicScoreboardView from '@/components/admin/PublicScoreboardView';
import { Loader2, ShieldOff } from 'lucide-react';

interface ScoreboardConfig {
  show_tool_progress: boolean;
  show_use_cases: boolean;
  show_risk_categories: boolean;
  show_department_scores: boolean;
  show_individual: boolean;
}

const DEFAULT_CONFIG: ScoreboardConfig = {
  show_tool_progress: true,
  show_use_cases: true,
  show_risk_categories: true,
  show_department_scores: true,
  show_individual: false,
};

export default function PublicScoreboardPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: org, isLoading, error } = useQuery({
    queryKey: ['public-scoreboard', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, scoreboard_enabled, scoreboard_config')
        .eq('scoreboard_slug', slug)
        .eq('scoreboard_enabled', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-6">
          <ShieldOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Scoreboard niet gevonden</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Dit scoreboard bestaat niet of is niet meer actief.
          Neem contact op met de organisatie voor meer informatie.
        </p>
      </div>
    );
  }

  const config: ScoreboardConfig = {
    ...DEFAULT_CONFIG,
    ...((org.scoreboard_config as ScoreboardConfig) || {}),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <PublicScoreboardView
          orgId={org.id}
          config={config}
          orgName={org.name}
        />

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Gegenereerd door RouteAI · AI Governance Platform
          </p>
        </div>
      </div>
    </div>
  );
}
