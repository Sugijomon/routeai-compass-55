import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const currentUser = useAppStore((state) => state.currentUser);
  
  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  // If not admin, redirect to user dashboard
  if (currentUser.role !== 'org_admin') {
    return <Navigate to="/user-dashboard" replace />;
  }
  
  // If admin, show the page
  return <>{children}</>;
}
