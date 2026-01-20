import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SmartDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Should generally be guarded by <AuthRoute>, but keep this safe.
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    navigate(isAdmin ? '/admin-dashboard' : '/user-dashboard', { replace: true });
  }, [user, isAdmin, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500">
      <div className="text-center text-white">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
        <p className="text-lg">Laden...</p>
      </div>
    </div>
  );
}

