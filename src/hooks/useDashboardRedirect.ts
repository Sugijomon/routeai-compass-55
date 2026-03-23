import { useUserRole } from '@/hooks/useUserRole';
import { useOrgPlanType } from '@/hooks/useOrgPlanType';

/**
 * Returns the appropriate dashboard URL based on user role and org plan_type.
 * shadow_only orgs route users differently:
 * - user → /shadow-survey
 * - org_admin → /admin/shadow
 */
export function useDashboardRedirect() {
  const { isSuperAdmin, isOrgAdmin, isContentEditor, isManager, isDpo, isLoading: roleLoading } = useUserRole();
  const { planType, isLoading: planLoading } = useOrgPlanType();
  
  const isLoading = roleLoading || planLoading;

  if (isSuperAdmin) {
    return { path: '/super-admin', isLoading };
  }

  // shadow_only orgs: afwijkende routing
  if (planType === 'shadow_only') {
    if (isOrgAdmin || isDpo) {
      return { path: '/admin/shadow', isLoading };
    }
    if (!isContentEditor && !isManager) {
      return { path: '/shadow-survey', isLoading };
    }
  }
  
  if (isContentEditor) {
    return { path: '/editor/cursussen', isLoading };
  }
  
  // DPO bij 'both' of 'routeai' org → naar shadow beheer
  if (isDpo && !isOrgAdmin) {
    return { path: '/admin/shadow', isLoading };
  }
  
  if (isOrgAdmin || isManager) {
    return { path: '/admin', isLoading };
  }
  
  return { path: '/dashboard', isLoading };
}

/**
 * Get dashboard path synchronously from roles array.
 * Used in Auth.tsx where we can't use hooks.
 * planType parameter optioneel voor shadow_only routing.
 */
export function getDashboardPathFromRoles(roles: string[], planType?: string): string {
  if (roles.includes('super_admin')) {
    return '/super-admin';
  }
  
  if (planType === 'shadow_only') {
    if (roles.includes('org_admin') || roles.includes('dpo')) {
      return '/admin/shadow';
    }
    if (!roles.includes('content_editor') && !roles.includes('manager')) {
      return '/shadow-survey';
    }
  }
  
  if (roles.includes('content_editor')) {
    return '/editor/cursussen';
  }
  if (roles.includes('dpo')) {
    return '/admin?tab=risk-profiles';
  }
  if (roles.some(r => ['org_admin', 'manager'].includes(r))) {
    return '/admin';
  }
  return '/dashboard';
}
