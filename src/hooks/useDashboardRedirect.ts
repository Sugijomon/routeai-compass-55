import { useUserRole } from '@/hooks/useUserRole';

/**
 * Returns the appropriate dashboard URL based on user role.
 * Routes based on highest privilege role:
 * - super_admin → /super-admin (future)
 * - org_admin → /admin-dashboard
 * - manager → /manager-dashboard (future)
 * - user → /user-dashboard
 */
export function useDashboardRedirect() {
  const { isSuperAdmin, isOrgAdmin, isManager } = useUserRole();
  
  // Route based on highest privilege role
  if (isSuperAdmin) {
    return '/admin-dashboard'; // Will become /super-admin when ready
  }
  
  if (isOrgAdmin) {
    return '/admin-dashboard';
  }
  
  if (isManager) {
    return '/admin-dashboard'; // Will become /manager-dashboard when ready
  }
  
  // Default: user dashboard
  return '/user-dashboard';
}
