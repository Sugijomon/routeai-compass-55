import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Loader2 } from 'lucide-react';

export default function SmartDashboard() {
  const currentUser = useAppStore(state => state.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/', { replace: true });
      return;
    }

    if (currentUser.role === 'org_admin') {
      navigate('/admin-dashboard', { replace: true });
    } else {
      navigate('/user-dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500">
      <div className="text-center text-white">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
        <p className="text-lg">Laden...</p>
      </div>
    </div>
  );
}
