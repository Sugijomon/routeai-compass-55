import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'super_admin' | 'content_editor' | 'org_admin' | 'dpo' | 'manager' | 'user';

export interface UserRoleData {
  role: AppRole | null;
  isLoading: boolean;
  error: Error | null;
  
  // Role checks
  isSuperAdmin: boolean;
  isContentEditor: boolean;
  isOrgAdmin: boolean;
  isDpo: boolean;
  isManager: boolean;
  isUser: boolean;
  
  // Combined permission checks
  canManageOrg: boolean;       // super_admin OR org_admin
  canManageContent: boolean;   // super_admin OR content_editor
  canViewTeam: boolean;        // super_admin OR org_admin OR manager
  canManageLessons: boolean;   // super_admin OR org_admin
  canViewShadowData: boolean;  // super_admin OR org_admin OR dpo
  isAdminLevel: boolean;       // Any admin-level role (backwards compat)
}

export function useUserRole(): UserRoleData {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: rolesData, isLoading, error } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map(r => r.role as AppRole);
    },
    enabled: !!userId,
  });

  const roles = rolesData ?? [];

  // Determine highest privilege role (priority order)
  const roleHierarchy: AppRole[] = ['super_admin', 'org_admin', 'dpo', 'content_editor', 'manager', 'user'];
  const role = roleHierarchy.find(r => roles.includes(r)) ?? null;
  
  // Individual role checks (based on ALL roles user has)
  const isSuperAdmin = roles.includes('super_admin');
  const isContentEditor = roles.includes('content_editor');
  const isOrgAdmin = roles.includes('org_admin');
  const isDpo = roles.includes('dpo');
  const isManager = roles.includes('manager');
  const isUser = roles.length === 0 || (roles.length === 1 && roles.includes('user'));
  
  // Combined permission checks
  const canManageOrg = isSuperAdmin || isOrgAdmin;
  const canManageContent = isSuperAdmin || isContentEditor;
  const canViewTeam = isSuperAdmin || isOrgAdmin || isManager;
  const canManageLessons = isSuperAdmin || isOrgAdmin;
  const canViewShadowData = isSuperAdmin || isOrgAdmin || isDpo;
  const canManageScan = isSuperAdmin || isOrgAdmin || isDpo;
  
  // Backwards compatibility: any admin-level role
  const isAdminLevel = isSuperAdmin || isContentEditor || isOrgAdmin || isDpo;

  return {
    role,
    isLoading,
    error: error as Error | null,
    
    isSuperAdmin,
    isContentEditor,
    isOrgAdmin,
    isDpo,
    isManager,
    isUser,
    
    canManageOrg,
    canManageContent,
    canViewTeam,
    canManageLessons,
    canViewShadowData,
    isAdminLevel,
  };
}
