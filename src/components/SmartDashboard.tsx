import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SmartDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, isSigningOut } = useAuth();

  useEffect(() => {
    // Don't redirect while loading or signing out
    if (isLoading || isSigningOut) return;

    // Not authenticated - let AuthRoute handle redirect
    if (!user) {
      return;
    }

    // Navigate to appropriate dashboard
    navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
  }, [user, isAdmin, isLoading, isSigningOut, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500">
      <div className="text-center text-white">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
        <p className="text-lg">Laden...</p>
      </div>
    </div>
  );
}

