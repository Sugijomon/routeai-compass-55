// RoleSelector.tsx - Landing page with auth options
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogIn, UserPlus, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { getDashboardPathFromRoles } from "@/hooks/useDashboardRedirect";

export default function RoleSelector() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading, isSuperAdmin, isOrgAdmin, isContentEditor, isManager } = useUserRole();

  // Combined loading state
  const isLoading = authLoading || (user && roleLoading);

  // Redirect logged in users to their appropriate dashboard
  useEffect(() => {
    if (authLoading) return; // Wait for auth
    if (!user) return; // Not logged in
    if (roleLoading) return; // Still fetching roles

    // Determine redirect path based on roles
    let path = '/dashboard'; // Default
    if (isSuperAdmin) {
      path = '/super-admin';
    } else if (isContentEditor) {
      path = '/editor/cursussen';
    } else if (isOrgAdmin || isManager) {
      path = '/admin';
    }

    navigate(path, { replace: true });
  }, [user, authLoading, roleLoading, isSuperAdmin, isOrgAdmin, isContentEditor, isManager, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-white" />
            <h1 className="text-5xl font-bold text-white">RouteAI</h1>
          </div>
          <p className="text-xl text-white/90">AI Governance voor MKB</p>
          <p className="text-sm text-white/70 mt-2">
            Verantwoord AI-gebruik volgens EU AI Act
          </p>
        </div>

        {/* Auth Card */}
        <Card className="bg-white/95 backdrop-blur shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welkom bij RouteAI
              </h2>
              <p className="text-gray-600">
                Log in of maak een account aan om te beginnen
              </p>
            </div>

            <div className="space-y-4">
              <Button
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-6 text-lg"
                onClick={() => navigate("/auth")}
              >
                <LogIn className="w-5 h-5 mr-2" />
                Inloggen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                className="w-full py-6 text-lg"
                onClick={() => navigate("/auth")}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Account aanmaken
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Door in te loggen ga je akkoord met onze{" "}
                <Link to="#" className="text-teal-600 hover:underline">
                  gebruiksvoorwaarden
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-white/80 text-sm">
          <div>
            <div className="font-semibold text-white">AI Rijbewijs</div>
            <div className="text-xs">Verplichte training</div>
          </div>
          <div>
            <div className="font-semibold text-white">Risk-Based</div>
            <div className="text-xs">Groen/Geel/Blauw/Rood</div>
          </div>
          <div>
            <div className="font-semibold text-white">EU Compliant</div>
            <div className="text-xs">AI Act ready</div>
          </div>
        </div>
      </div>
    </div>
  );
}
