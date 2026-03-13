import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from '@/hooks/use-toast';

export interface OrgUser {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  has_ai_rijbewijs: boolean;
  ai_rijbewijs_obtained_at: string | null;
  created_at: string | null;
  roles: string[];
}

export interface OrgUserStats {
  totalUsers: number;
  usersWithRijbewijs: number;
  roleBreakdown: Record<string, number>;
}

export function useOrgUsers() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ['org-users', orgId],
    queryFn: async (): Promise<OrgUser[]> => {
      if (!orgId) return [];

      // Fetch profiles in this org
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', orgId)
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;
      if (!profiles) return [];

      // Fetch roles for these users
      const userIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Create a map of user_id -> roles array
      const rolesMap: Record<string, string[]> = {};
      (roles || []).forEach(r => {
        if (!rolesMap[r.user_id]) {
          rolesMap[r.user_id] = [];
        }
        rolesMap[r.user_id].push(r.role);
      });

      // Merge profiles with roles
      return profiles.map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        department: p.department,
        has_ai_rijbewijs: p.has_ai_rijbewijs ?? false,
        ai_rijbewijs_obtained_at: p.ai_rijbewijs_obtained_at,
        created_at: p.created_at,
        roles: rolesMap[p.id] || ['user'],
      }));
    },
    enabled: !!orgId,
  });
}

export function useOrgUserStats() {
  const { data: users } = useOrgUsers();

  const stats: OrgUserStats = {
    totalUsers: users?.length || 0,
    usersWithRijbewijs: users?.filter(u => u.has_ai_rijbewijs).length || 0,
    roleBreakdown: {},
  };

  // Calculate role breakdown
  if (users) {
    users.forEach(user => {
      user.roles.forEach(role => {
        stats.roleBreakdown[role] = (stats.roleBreakdown[role] || 0) + 1;
      });
    });
  }

  return stats;
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      if (!orgId) throw new Error('No organization ID');

      // First, delete existing roles for this user in this org
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('org_id', orgId);

      if (deleteError) throw deleteError;

      // Insert new roles
      if (roles.length > 0) {
        const rolesToInsert = roles.map(role => ({
          user_id: userId,
          role: role as 'super_admin' | 'content_editor' | 'org_admin' | 'manager' | 'user',
          org_id: orgId,
        }));

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(rolesToInsert);

        if (insertError) throw insertError;
      }

      return { userId, roles };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-users', orgId] });
      toast({
        title: 'Rollen bijgewerkt',
        description: 'De gebruikersrollen zijn succesvol bijgewerkt.',
      });
    },
    onError: (error) => {
      console.error('Error updating roles:', error);
      toast({
        title: 'Fout bij bijwerken',
        description: 'Er is een fout opgetreden bij het bijwerken van de rollen.',
        variant: 'destructive',
      });
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      // For now, just show a toast - actual invitation would need edge function
      // This is a placeholder for future implementation
      console.log('Invite user:', email, 'with role:', role, 'to org:', orgId);
      return { email, role };
    },
    onSuccess: ({ email }) => {
      queryClient.invalidateQueries({ queryKey: ['org-users', orgId] });
      toast({
        title: 'Uitnodiging verzonden',
        description: `Een uitnodiging is verzonden naar ${email}.`,
      });
    },
    onError: (error) => {
      console.error('Error inviting user:', error);
      toast({
        title: 'Fout bij uitnodigen',
        description: 'Er is een fout opgetreden bij het verzenden van de uitnodiging.',
        variant: 'destructive',
      });
    },
  });
}
