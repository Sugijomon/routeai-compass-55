import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Users } from 'lucide-react';

export function TeamParticipationBadge() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const { data: count } = useQuery({
    queryKey: ['team-participation', profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id || !user) return 0;
      const { count } = await supabase
        .from('shadow_survey_runs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .not('survey_completed_at', 'is', null)
        .neq('user_id', user.id);
      return count ?? 0;
    },
    enabled: !!profile?.org_id && !!user,
  });

  if (!count || count === 0) return null;

  return (
    <div className="flex justify-center mb-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        {count}{' '}
        collega{count === 1 ? '' : "'s"} {count === 1 ? 'heeft' : 'hebben'} de scan al afgerond
      </span>
    </div>
  );
}

// Behoud default export voor backwards-compatibiliteit
export default TeamParticipationBadge;
