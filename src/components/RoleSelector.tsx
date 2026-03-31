import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardRedirect } from "@/hooks/useDashboardRedirect";

export default function RoleSelector() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { path, isLoading: redirectLoading } = useDashboardRedirect();

  const isLoading = authLoading || (user && redirectLoading);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (redirectLoading) return;
    navigate(path, { replace: true });
  }, [user, authLoading, redirectLoading, path, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return null;
}
