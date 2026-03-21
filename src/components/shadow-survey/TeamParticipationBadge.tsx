import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

interface Props {
  orgId: string;
  currentUserId: string;
}

export default function TeamParticipationBadge({ orgId, currentUserId }: Props) {
  const { data: count } = useQuery({
    queryKey: ['team-participation-count', orgId, currentUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shadow_survey_runs')
        .select('user_id')
        .eq('org_id', orgId)
        .not('survey_completed_at', 'is', null)
        .neq('user_id', currentUserId);
      if (error) throw error;
      const unique = new Set(data?.map(r => r.user_id));
      return unique.size;
    },
  });

  if (!count || count === 0) return null;

  const text = count === 1
    ? '1 collega heeft de scan al afgerond'
    : `${count} collega's hebben de scan al afgerond`;

  return (
    <div className="flex justify-center mb-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        {text}
      </span>
    </div>
  );
}
