import { useUserRole } from '@/hooks/useUserRole';

/**
 * Returns the appropriate dashboard URL based on user role.
 * Routes based on highest privilege role (priority order):
 * - super_admin → /admin-dashboard
 * - org_admin → /admin-dashboard  
 * - content_editor → /admin-dashboard
 * - manager → /admin-dashboard
 * - user → /user-dashboard
 */
export function useDashboardRedirect() {
  const { isSuperAdmin, isOrgAdmin, isContentEditor, isManager, isLoading } = useUserRole();
  
  // Route based on highest privilege role (priority order)
  if (isSuperAdmin || isOrgAdmin || isContentEditor || isManager) {
    return { path: '/admin-dashboard', isLoading };
  }
  
  // Default: user dashboard
  return { path: '/user-dashboard', isLoading };
}

/**
 * Get dashboard path synchronously from roles array.
 * Used in Auth.tsx where we can't use hooks.
 */
export function getDashboardPathFromRoles(roles: string[]): string {
  const adminRoles = ['super_admin', 'org_admin', 'content_editor', 'manager'];
  if (roles.some(r => adminRoles.includes(r))) {
    return '/admin-dashboard';
  }
  return '/user-dashboard';
}
