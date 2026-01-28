import React, { useState } from "react";
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
  Award,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ToolsCatalogManager from "@/components/org-admin/ToolsCatalogManager";
import LearningCatalogManager from "@/components/org-admin/LearningCatalogManager";
import UsersManager from "@/components/org-admin/UsersManager";
import { useOrgToolsStats } from "@/hooks/useOrgToolsCatalog";
import { useOrgLearningStats } from "@/hooks/useOrgLearningCatalog";
import { useOrgUserStats } from "@/hooks/useOrgUsers";

export default function OrgAdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState("overview");

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

  // Fetch org tools stats
  const { data: toolsStats } = useOrgToolsStats();
  
  // Fetch org learning stats
  const { data: learningStats } = useOrgLearningStats();

  // Fetch org user stats
  const userStats = useOrgUserStats();

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

  // AuthRoute handles the case when user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
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
          <StatCard
            title="Actieve Gebruikers"
            value={userStats.totalUsers}
            subtitle={`${userStats.usersWithRijbewijs} met AI-Rijbewijs`}
            icon={Users}
            tooltip="Totaal aantal gebruikers in je organisatie"
          />
          <StatCard
            title="Actieve Beoordelingen"
            value="—"
            subtitle="Coming soon"
            icon={ClipboardCheck}
            valueClassName="text-muted-foreground/50"
            tooltip="AI Check beoordelingen die actief worden gebruikt"
          />
          <StatCard
            title="Tools Ingeschakeld"
            value={toolsStats?.enabledCount || 0}
            subtitle={`€${toolsStats?.totalCost?.toFixed(2) || "0.00"}/maand`}
            icon={Wrench}
            tooltip="AI tools die beschikbaar zijn voor je organisatie"
          />
          <StatCard
            title="Trainingen Ingeschakeld"
            value={learningStats?.enabledCount || 0}
            subtitle={`${learningStats?.mandatoryCount || 0} verplicht`}
            icon={GraduationCap}
            tooltip="Trainingsmodules die beschikbaar zijn voor je team"
          />
        </div>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overzicht</TabsTrigger>
            <TabsTrigger value="tools">Tools Catalogus</TabsTrigger>
            <TabsTrigger value="learning">Learning Catalogus</TabsTrigger>
            <TabsTrigger value="users">Gebruikers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Organization Sections */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tools Catalog Summary */}
              <Card 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setActiveTab("tools")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Tools Catalogus
                  </CardTitle>
                  <CardDescription>Beheer goedgekeurde AI tools voor je organisatie</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold">{toolsStats?.enabledCount || 0}</span>
                      <span className="text-muted-foreground ml-2">tools actief</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Beheren →
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Catalog */}
              <Card 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setActiveTab("learning")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Learning Catalogus
                  </CardTitle>
                  <CardDescription>Trainingsmateriaal voor je organisatie</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold">{learningStats?.enabledCount || 0}</span>
                      <span className="text-muted-foreground ml-2">trainingen actief</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Beheren →
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Users & Roles */}
              <Card 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setActiveTab("users")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    Gebruikers & Rollen
                  </CardTitle>
                  <CardDescription>Beheer teamleden en hun toegangsrechten</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold">{userStats.totalUsers}</span>
                      <span className="text-muted-foreground ml-2">gebruikers</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Beheren →
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Assessments Overview */}
              <Card className="opacity-75">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Beoordelingen Overzicht
                  </CardTitle>
                  <CardDescription>AI Check beoordelingen en status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-12 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                    <p className="text-muted-foreground text-sm">Binnenkort beschikbaar</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools">
            <ErrorBoundary>
              <ToolsCatalogManager />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="learning">
            <ErrorBoundary>
              <LearningCatalogManager />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="users">
            <ErrorBoundary>
              <UsersManager />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
