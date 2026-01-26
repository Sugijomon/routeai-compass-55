import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  LogOut, 
  Shield,
  Wrench,
  GraduationCap,
  BarChart3,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { profile } = useUserProfile();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">RouteAI</h1>
            <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Super Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.full_name || user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Uitloggen
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold">Super Admin Dashboard - Platform Management</h2>
          <p className="text-muted-foreground">
            Manage all organizations and platform content
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Total Organizations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Totaal Organisaties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-muted-foreground/50">—</span>
              <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Totaal Gebruikers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-muted-foreground/50">—</span>
              <p className="text-xs text-muted-foreground mt-1">All organizations</p>
            </CardContent>
          </Card>

          {/* Active Subscriptions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Actieve Abonnementen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-muted-foreground/50">—</span>
              <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
            </CardContent>
          </Card>

          {/* Platform Revenue */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Platform Omzet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-muted-foreground/50">—</span>
              <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Organizations Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Organisaties Overzicht
              </CardTitle>
              <CardDescription>Beheer alle organisaties op het platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Coming next</p>
              </div>
            </CardContent>
          </Card>

          {/* Tools Library Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Tools Library Beheer
              </CardTitle>
              <CardDescription>Platform-brede AI tools bibliotheek</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Coming next</p>
              </div>
            </CardContent>
          </Card>

          {/* Learning Library Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Learning Library Beheer
              </CardTitle>
              <CardDescription>Platform-brede trainingsinhoud</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Coming next</p>
              </div>
            </CardContent>
          </Card>

          {/* Platform Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Platform Analytics
              </CardTitle>
              <CardDescription>Inzichten en statistieken</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Coming next</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
