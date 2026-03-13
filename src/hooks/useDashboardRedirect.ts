import { useUserRole } from '@/hooks/useUserRole';

/**
 * Returns the appropriate dashboard URL based on user role.
 * Routes based on highest privilege role (priority order):
 * - super_admin → /super-admin
 * - org_admin → /admin
 * - content_editor → /editor
 * - manager → /admin
 * - user → /dashboard
 */
export function useDashboardRedirect() {
  const { isSuperAdmin, isOrgAdmin, isContentEditor, isManager, isLoading } = useUserRole();
  
  // Route based on highest privilege role (priority order)
  if (isSuperAdmin) {
    return { path: '/super-admin', isLoading };
  }
  
  if (isContentEditor) {
    return { path: '/editor/cursussen', isLoading };
  }
  
  if (isOrgAdmin || isManager) {
    return { path: '/admin', isLoading };
  }
  
  // Default: user dashboard
  return { path: '/dashboard', isLoading };
}

/**
 * Get dashboard path synchronously from roles array.
 * Used in Auth.tsx where we can't use hooks.
 */
export function getDashboardPathFromRoles(roles: string[]): string {
  if (roles.includes('super_admin')) {
    return '/super-admin';
  }
  if (roles.includes('content_editor')) {
    return '/editor/cursussen';
  }
  if (roles.some(r => ['org_admin', 'manager'].includes(r))) {
    return '/admin';
  }
  return '/dashboard';
}
