import { useAuth } from '@/hooks/useAuth';

/**
 * Returns the appropriate dashboard URL based on user role.
 * Admins go to /admin-dashboard, regular users go to /dashboard.
 */
export function useDashboardRedirect() {
  const { isAdmin } = useAuth();
  
  return isAdmin ? '/admin-dashboard' : '/dashboard';
}
