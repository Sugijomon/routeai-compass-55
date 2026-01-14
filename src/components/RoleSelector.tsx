// RoleSelector.tsx - Updated met expliciete dashboard routes
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield, UserCog } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { MOCK_USERS } from "@/data/mockUsers";

const RoleSelector = () => {
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const navigate = useNavigate();

  // Icon mapping voor verschillende roles
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "org_admin":
        return <UserCog className="w-8 h-8" />;
      default:
        return <User className="w-8 h-8" />;
    }
  };

  // Display text voor verschillende roles
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "org_admin":
        return "Beheerder";
      default:
        return "Gebruiker";
    }
  };

  // Subtitle per user
  const getSubtitle = (role: string) => {
    switch (role) {
      case "org_admin":
        return "Beheer je team en bekijk statistieken";
      default:
        return "Bekijk je dashboard en volg trainingen";
    }
  };

  // Navigate to correct dashboard based on role
  const getDashboardRoute = (role: string) => {
    if (role === "org_admin") return "/admin-dashboard";
    return "/user-dashboard";
  };

  const handleLogin = (userId: string) => {
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      // Navigate to role-specific dashboard
      navigate(getDashboardRoute(user.role));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-white" />
            <h1 className="text-5xl font-bold text-white">RouteAI</h1>
          </div>
          <p className="text-xl text-white/90">AI Governance voor MKB</p>
        </div>

        {/* User Cards Grid - 2x2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {MOCK_USERS.map((user) => (
            <Card key={user.id} className="bg-white/95 backdrop-blur hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center text-teal-600">
                    {getRoleIcon(user.role)}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-1">Inloggen als {getRoleDisplay(user.role)}</h2>

                {/* Subtitle */}
                <p className="text-gray-600 text-center mb-6 text-sm">{getSubtitle(user.role)}</p>

                {/* Login Button */}
                <Button
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-6 text-lg"
                  onClick={() => handleLogin(user.id)}
                >
                  Doorgaan als {user.name}
                </Button>

                {/* User Info Badge */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium">{user.department}</span>
                    <span className="capitalize">{user.license?.trainingLevel || "Geen training"}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {user.license?.grantedCapabilities?.length || 0} vrijgegeven werkgebied
                    {(user.license?.grantedCapabilities?.length || 0) !== 1 ? "en" : ""}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Warning */}
        <div className="text-center">
          <p className="text-sm text-white/70">Demo omgeving - Geen echte authenticatie vereist</p>
        </div>

        {/* Debug Info - Only in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 bg-black/20 backdrop-blur rounded-lg">
            <p className="text-xs text-white/80 font-mono mb-2">🔧 Debug Info - Routes:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/70 font-mono">
              {MOCK_USERS.map((user) => (
                <div key={user.id} className="bg-black/20 p-2 rounded">
                  <div className="font-bold">{user.name}</div>
                  <div>Role: {user.role}</div>
                  <div>→ {getDashboardRoute(user.role)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
