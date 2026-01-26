import { useUserRole } from '@/hooks/useUserRole';

/**
 * Returns the appropriate dashboard URL based on user role.
 * Routes based on highest privilege role (priority order):
 * - super_admin → /super-admin
 * - org_admin → /org-admin
 * - content_editor → /org-admin
 * - manager → /org-admin
 * - user → /user-dashboard
 */
export function useDashboardRedirect() {
  const { isSuperAdmin, isOrgAdmin, isContentEditor, isManager, isLoading } = useUserRole();
  
  // Route based on highest privilege role (priority order)
  if (isSuperAdmin) {
    return { path: '/super-admin', isLoading };
  }
  
  if (isOrgAdmin || isContentEditor || isManager) {
    return { path: '/org-admin', isLoading };
  }
  
  // Default: user dashboard
  return { path: '/user-dashboard', isLoading };
}

/**
 * Get dashboard path synchronously from roles array.
 * Used in Auth.tsx where we can't use hooks.
 */
export function getDashboardPathFromRoles(roles: string[]): string {
  if (roles.includes('super_admin')) {
    return '/super-admin';
  }
  if (roles.some(r => ['org_admin', 'content_editor', 'manager'].includes(r))) {
    return '/org-admin';
  }
  return '/user-dashboard';
}
