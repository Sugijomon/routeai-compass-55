import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';

interface AuthRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  skipRijbewijsCheck?: boolean;
}

export function AuthRoute({ children, requireAdmin = false, skipRijbewijsCheck = false }: AuthRouteProps) {
  const { user, isLoading, isAdmin, isSigningOut } = useAuth();
  const location = useLocation();
  const { hasAiRijbewijs, isLoading: profileLoading, isAdminLevel } = useUserProfile();

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
  if (isLoading || profileLoading) {
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

  // Admins always pass through (no rijbewijs check needed)
  if (isAdminLevel || skipRijbewijsCheck) {
    return <>{children}</>;
  }

  // Regular user without AI Rijbewijs → redirect to exam
  if (!hasAiRijbewijs && location.pathname !== '/onboarding/examen') {
    return <Navigate to="/onboarding/examen" replace />;
  }

  return <>{children}</>;
}
