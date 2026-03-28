import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

/**
 * Guard die uitsluitend super_admin-gebruikers doorlaat.
 * Alle andere rollen worden doorgestuurd naar hun eigen dashboard.
 */
export function RequireSuperAdmin({ children }: Props) {
  const { user, isLoading, isSigningOut, hasCheckedAdmin } = useAuth();
  const location = useLocation();
  const { isSuperAdmin, isLoading: profileLoading } = useUserProfile();

  if (isSigningOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Uitloggen...</span>
      </div>
    );
  }

  if (isLoading || profileLoading || !hasCheckedAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
