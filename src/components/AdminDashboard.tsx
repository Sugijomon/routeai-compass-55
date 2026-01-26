import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Award, AlertTriangle, LogOut, Shield, Wrench, GraduationCap, Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  // Fetch current user's profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

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

  // Fetch user stats for this org
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-user-stats", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return { total: 0, licensed: 0, pending: 0 };
      
      // Get all profiles in this org
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, has_ai_rijbewijs")
        .eq("org_id", profile.org_id);
      
      if (error) throw error;
      
      const total = profiles?.length || 0;
      const licensed = profiles?.filter(p => p.has_ai_rijbewijs).length || 0;
      const pending = total - licensed;
      
      return { total, licensed, pending };
    },
    enabled: !!profile?.org_id,
  });

  // Fetch team members
  const { data: teamMembers, isLoading: teamLoading } = useQuery({
    queryKey: ["admin-team", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, has_ai_rijbewijs")
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (profilesError) throw profilesError;
      
      // Get roles for these users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", profiles?.map(p => p.id) || []);
      
      if (rolesError) throw rolesError;
      
      // Merge roles into profiles
      return profiles?.map(p => ({
        ...p,
        role: roles?.find(r => r.user_id === p.id)?.role || "user"
      })) || [];
    },
    enabled: !!profile?.org_id,
  });

  const { signOut } = useAuth();

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
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Beheerder</Badge>
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
          <h2 className="text-2xl font-bold">Beheerder Dashboard</h2>
          <p className="text-muted-foreground">
            {organization?.name || "Je organisatie"} • Bekijk team statistieken en beheer AI-rijbewijzen
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Organization */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organisatie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-lg font-bold">{organization?.name || "Laden..."}</span>
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
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className="text-3xl font-bold">{userStats?.total || 0}</span>
              )}
            </CardContent>
          </Card>

          {/* Licensed Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Met Rijbewijs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <span className="text-3xl font-bold text-primary">{userStats?.licensed || 0}</span>
                  <span className="text-sm text-muted-foreground ml-2">/ {userStats?.total || 0}</span>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pending Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Wachtend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <span className="text-3xl font-bold text-amber-500">{userStats?.pending || 0}</span>
                  <span className="text-sm text-muted-foreground ml-2">zonder rijbewijs</span>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
            <CardDescription>Belangrijke functies direct beschikbaar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 justify-start" onClick={() => navigate("/tools")}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Tool Catalogus</div>
                    <div className="text-sm text-muted-foreground">Bekijk goedgekeurde AI tools</div>
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="h-20 justify-start" onClick={() => navigate("/training")}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Training Platform</div>
                    <div className="text-sm text-muted-foreground">Beheer trainingsmodules</div>
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="h-20 justify-start" onClick={() => navigate("/admin/lessons")}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Content Beheer</div>
                    <div className="text-sm text-muted-foreground">Lessen en cursussen</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Overzicht</CardTitle>
            <CardDescription>Recente gebruikers in je organisatie</CardDescription>
          </CardHeader>
          <CardContent>
            {teamLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : teamMembers && teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {(member.full_name || member.email || "?")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.full_name || "Naamloos"}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {member.role === "admin" && <Badge variant="outline">Beheerder</Badge>}
                      {member.has_ai_rijbewijs ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <Award className="h-3 w-3 mr-1" />
                          Rijbewijs Actief
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Geen Rijbewijs</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Geen teamleden gevonden in deze organisatie.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
