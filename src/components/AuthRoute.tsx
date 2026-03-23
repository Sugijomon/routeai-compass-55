import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useOrgPlanType } from '@/hooks/useOrgPlanType';
import { Loader2 } from 'lucide-react';

interface AuthRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  skipRijbewijsCheck?: boolean;
}

export function AuthRoute({ children, requireAdmin = false, skipRijbewijsCheck = false }: AuthRouteProps) {
  const { user, isLoading, isAdmin, isSigningOut, hasCheckedAdmin } = useAuth();
  const location = useLocation();
  const { hasAiRijbewijs, isLoading: profileLoading, isAdminLevel, isSuperAdmin, isOrgAdmin, isDpo, isContentEditor } = useUserProfile();
  const { isShadowOnly, isLoading: planLoading } = useOrgPlanType();
  // CRITICAL: Don't redirect while signing out - this prevents the loop
  if (isSigningOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Uitloggen...</span>
      </div>
    );
  }

  // Wacht ook tot de admin-check klaar is voor requireAdmin-routes
  const adminCheckPending = requireAdmin && !hasCheckedAdmin;
  if (isLoading || profileLoading || planLoading || adminCheckPending) {
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

  // shadow_only orgs: geen rijbewijs nodig
  if (isShadowOnly) {
    return <>{children}</>;
  }

  // Admin/editor roles bypass the rijbewijs exam requirement entirely
  const isAdminOrEditor = isSuperAdmin || isOrgAdmin || isDpo || isContentEditor;

  // Regular user without AI Rijbewijs → redirect to exam
  // But admin/editor roles bypass this check
  if (!hasAiRijbewijs && !isAdminOrEditor && location.pathname !== '/onboarding/examen') {
    return <Navigate to="/onboarding/examen" replace />;
  }

  return <>{children}</>;
}
