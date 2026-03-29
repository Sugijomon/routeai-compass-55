import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

export function useOrgNotifications() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['org-notifications', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('org_notifications')
        .select('*')
        .eq('org_id', orgId)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('org_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: profile?.id,
        } as never)
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-notifications', orgId] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('org_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: profile?.id,
        } as never)
        .eq('org_id', orgId!)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-notifications', orgId] });
      toast.success('Alle meldingen gemarkeerd als gelezen.');
    },
  });

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
}
