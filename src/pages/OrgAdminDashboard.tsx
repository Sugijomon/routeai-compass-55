import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  ClipboardCheck, 
  Wrench, 
  GraduationCap, 
  LogOut, 
  Shield,
  UserCog,
  FileText,
  Loader2,
  Building2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function OrgAdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { profile } = useUserProfile();

  // Fetch organization info
  const { data: organization } = useQuery({
    queryKey: ["organization", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.org_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.org_id,
  });

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
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Org Admin</Badge>
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
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Organization Dashboard
              {organization?.name && (
                <span className="text-primary">— {organization.name}</span>
              )}
            </h2>
            <p className="text-muted-foreground">
              Governance and AI management for your organization
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Active Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Actieve Gebruikers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-muted-foreground/50">—</span>
              <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
            </CardContent>
          </Card>

          {/* Active Assessments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Actieve Beoordelingen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-muted-foreground/50">—</span>
              <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
            </CardContent>
          </Card>

          {/* Tools Enabled */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Tools Ingeschakeld
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-muted-foreground/50">—</span>
              <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
            </CardContent>
          </Card>

          {/* Training Completion Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Training Voltooiing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-muted-foreground/50">—</span>
              <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Organization Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tools Catalog */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Tools Catalogus
              </CardTitle>
              <CardDescription>Beheer goedgekeurde AI tools voor je organisatie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Coming next</p>
              </div>
            </CardContent>
          </Card>

          {/* Learning Catalog */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Learning Catalogus
              </CardTitle>
              <CardDescription>Trainingsmateriaal voor je organisatie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Coming next</p>
              </div>
            </CardContent>
          </Card>

          {/* Users & Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Gebruikers & Rollen
              </CardTitle>
              <CardDescription>Beheer teamleden en hun toegangsrechten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Coming next</p>
              </div>
            </CardContent>
          </Card>

          {/* Assessments Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Beoordelingen Overzicht
              </CardTitle>
              <CardDescription>AI Check beoordelingen en status</CardDescription>
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
