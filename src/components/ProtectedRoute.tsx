import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const currentUser = useAppStore((state) => state.currentUser);
  
  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  // If logged in, show the page
  return <>{children}</>;
}
