import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'super_admin' | 'content_editor' | 'org_admin' | 'manager' | 'moderator' | 'user';

export interface UserRoleData {
  role: AppRole | null;
  isLoading: boolean;
  error: Error | null;
  
  // Role checks
  isSuperAdmin: boolean;
  isContentEditor: boolean;
  isOrgAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  
  // Combined permission checks
  canManageOrg: boolean;       // super_admin OR org_admin
  canManageContent: boolean;   // super_admin OR content_editor
  canViewTeam: boolean;        // super_admin OR org_admin OR manager
  canManageLessons: boolean;   // super_admin OR org_admin
  isAdminLevel: boolean;       // Any admin-level role (backwards compat)
}

export function useUserRole(): UserRoleData {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: roleData, isLoading, error } = useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.role as AppRole | null;
    },
    enabled: !!userId,
  });

  const role = roleData ?? null;
  
  // Individual role checks
  const isSuperAdmin = role === 'super_admin';
  const isContentEditor = role === 'content_editor';
  const isOrgAdmin = role === 'org_admin';
  const isManager = role === 'manager';
  const isUser = role === 'user' || role === null;
  
  // Combined permission checks
  const canManageOrg = isSuperAdmin || isOrgAdmin;
  const canManageContent = isSuperAdmin || isContentEditor;
  const canViewTeam = isSuperAdmin || isOrgAdmin || isManager;
  const canManageLessons = isSuperAdmin || isOrgAdmin;
  
  // Backwards compatibility: any admin-level role
  const isAdminLevel = isSuperAdmin || isContentEditor || isOrgAdmin;

  return {
    role,
    isLoading,
    error: error as Error | null,
    
    isSuperAdmin,
    isContentEditor,
    isOrgAdmin,
    isManager,
    isUser,
    
    canManageOrg,
    canManageContent,
    canViewTeam,
    canManageLessons,
    isAdminLevel,
  };
}
