import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function AuthRoute({ children, requireAdmin = false }: AuthRouteProps) {
  const { user, isLoading, isAdmin, isSigningOut } = useAuth();
  const location = useLocation();

  // CRITICAL: Don't redirect while signing out - this prevents the loop
  if (isSigningOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Uitloggen...</span>
      </div>
    );
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - redirect to auth page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Need admin but not admin - redirect to user dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/user-dashboard" replace />;
  }

  return <>{children}</>;
}
