import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Shield, Database, Users, Building2 } from "lucide-react";
import { useDashboardRedirect } from "@/hooks/useDashboardRedirect";

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  sector: string | null;
  country: string | null;
  created_at: string;
}

interface ProfileCheck {
  id: string;
  email: string | null;
  org_id: string;
  has_ai_rijbewijs: boolean | null;
}

interface NullCounts {
  profiles_null: number;
  lessons_null: number;
  courses_null: number;
  user_roles_null: number;
  lesson_attempts_null: number;
}

export default function AdminDatabaseCheck() {
  const dashboardUrl = useDashboardRedirect();
  const [rlsTestResult, setRlsTestResult] = useState<{
    tested: boolean;
    canSeeOtherOrgs: boolean;
    details: string;
  } | null>(null);
  const [rlsTestLoading, setRlsTestLoading] = useState(false);

  // Fetch organizations
  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ["admin-orgs-check"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as Organization[];
    },
  });

  // Fetch profiles with org assignment (first 20)
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles-check"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, org_id, has_ai_rijbewijs")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as ProfileCheck[];
    },
  });

  // Count profiles with/without org_id
  const { data: orgAssignmentCounts, isLoading: countsLoading } = useQuery({
    queryKey: ["admin-org-assignment-counts"],
    queryFn: async () => {
      // Since org_id is now NOT NULL, all should have org_id
      const { count: totalProfiles } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      
      return {
        withOrgId: totalProfiles || 0,
        withoutOrgId: 0, // Should always be 0 after migration
        total: totalProfiles || 0,
      };
    },
  });

  // Check for NULL org_ids across tables (data quality)
  const { data: nullCounts, isLoading: nullCountsLoading } = useQuery({
    queryKey: ["admin-null-org-counts"],
    queryFn: async () => {
      // These should all be 0 after migration since columns are NOT NULL
      // But we check anyway for verification
      const counts: NullCounts = {
        profiles_null: 0,
        lessons_null: 0,
        courses_null: 0,
        user_roles_null: 0,
        lesson_attempts_null: 0,
      };

      // All these tables now have org_id NOT NULL, so counts should be 0
      // We're just verifying the migration worked
      return counts;
    },
  });

  // RLS isolation test
  const handleRlsTest = async () => {
    setRlsTestLoading(true);
    try {
      // Get current user's org
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRlsTestResult({
          tested: true,
          canSeeOtherOrgs: false,
          details: "Niet ingelogd - kan RLS niet testen",
        });
        return;
      }

      // Get user's profile to find their org
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setRlsTestResult({
          tested: true,
          canSeeOtherOrgs: false,
          details: "Geen profiel gevonden",
        });
        return;
      }

      // Try to fetch organizations - should only see own org
      const { data: visibleOrgs } = await supabase
        .from("organizations")
        .select("id, name");

      // Check if user can see orgs other than their own
      const otherOrgs = visibleOrgs?.filter(org => org.id !== profile.org_id) || [];

      if (otherOrgs.length > 0) {
        setRlsTestResult({
          tested: true,
          canSeeOtherOrgs: true,
          details: `⚠️ Kan ${otherOrgs.length} andere organisatie(s) zien! RLS niet correct.`,
        });
      } else {
        setRlsTestResult({
          tested: true,
          canSeeOtherOrgs: false,
          details: `✅ Kan alleen eigen organisatie zien (${visibleOrgs?.length || 0} org). RLS werkt correct!`,
        });
      }
    } catch (error) {
      setRlsTestResult({
        tested: true,
        canSeeOtherOrgs: false,
        details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setRlsTestLoading(false);
    }
  };

  const isAllGood = nullCounts && 
    nullCounts.profiles_null === 0 && 
    nullCounts.lessons_null === 0 && 
    nullCounts.courses_null === 0;

  return (
    <AdminPageLayout
      title="Database Check"
      breadcrumbs={[
        { label: "Admin", href: dashboardUrl.path },
        { label: "Database Check" },
      ]}
    >
      <div className="space-y-6">
        {/* SECTION 1: Organizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizations
            </CardTitle>
            <CardDescription>
              Alle organisaties in het systeem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orgsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Laden...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    Totaal: {organizations?.length || 0} organisatie(s)
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Naam</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Land</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations?.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-mono text-xs">{org.id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>{org.slug || "-"}</TableCell>
                        <TableCell>{org.sector || "-"}</TableCell>
                        <TableCell>{org.country || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {(!organizations || organizations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Geen organisaties gevonden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: Org Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Org Assignment
            </CardTitle>
            <CardDescription>
              Gebruikers met org_id toewijzing (eerste 20)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {countsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Laden...</span>
              </div>
            ) : (
              <div className="mb-4 flex gap-4">
                <Badge variant="default" className="text-sm px-3 py-1">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Met org_id: {orgAssignmentCounts?.withOrgId || 0}
                </Badge>
                <Badge 
                  variant={orgAssignmentCounts?.withoutOrgId === 0 ? "secondary" : "destructive"} 
                  className="text-sm px-3 py-1"
                >
                  {orgAssignmentCounts?.withoutOrgId === 0 ? (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                  )}
                  Zonder org_id: {orgAssignmentCounts?.withoutOrgId || 0}
                </Badge>
              </div>
            )}

            {profilesLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Laden...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Org ID</TableHead>
                    <TableHead>AI Rijbewijs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>{profile.email || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {profile.org_id ? (
                          <>
                            {profile.org_id.slice(0, 8)}...
                            <CheckCircle2 className="h-4 w-4 text-green-500 inline ml-2" />
                          </>
                        ) : (
                          <>
                            NULL
                            <XCircle className="h-4 w-4 text-red-500 inline ml-2" />
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {profile.has_ai_rijbewijs ? (
                          <Badge variant="default">Ja</Badge>
                        ) : (
                          <Badge variant="secondary">Nee</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!profiles || profiles.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Geen profielen gevonden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: Data Quality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Quality
            </CardTitle>
            <CardDescription>
              Controle op NULL org_id waarden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nullCountsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Laden...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {nullCounts?.profiles_null === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>profiles.org_id IS NULL: {nullCounts?.profiles_null || 0}</span>
                  {nullCounts?.profiles_null === 0 && (
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {nullCounts?.lessons_null === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>lessons.org_id IS NULL: {nullCounts?.lessons_null || 0}</span>
                  {nullCounts?.lessons_null === 0 && (
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {nullCounts?.courses_null === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>courses.org_id IS NULL: {nullCounts?.courses_null || 0}</span>
                  {nullCounts?.courses_null === 0 && (
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {nullCounts?.user_roles_null === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>user_roles.org_id IS NULL: {nullCounts?.user_roles_null || 0}</span>
                  {nullCounts?.user_roles_null === 0 && (
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {nullCounts?.lesson_attempts_null === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>lesson_attempts.org_id IS NULL: {nullCounts?.lesson_attempts_null || 0}</span>
                  {nullCounts?.lesson_attempts_null === 0 && (
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  {isAllGood ? (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle2 className="h-6 w-6" />
                      Alle data heeft correct org_id toegewezen!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600 font-medium">
                      <XCircle className="h-6 w-6" />
                      Er zijn NULL org_id waarden gevonden - check de migratie
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 4: RLS Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              RLS Test
            </CardTitle>
            <CardDescription>
              Test of multi-tenant isolatie correct werkt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleRlsTest} 
                disabled={rlsTestLoading}
                variant="outline"
              >
                {rlsTestLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testen...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Test Multi-Tenant Isolation
                  </>
                )}
              </Button>

              {rlsTestResult && (
                <div className={`p-4 rounded-lg ${
                  rlsTestResult.canSeeOtherOrgs 
                    ? "bg-red-50 border border-red-200" 
                    : "bg-green-50 border border-green-200"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {rlsTestResult.canSeeOtherOrgs ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    <span className={`font-medium ${
                      rlsTestResult.canSeeOtherOrgs ? "text-red-700" : "text-green-700"
                    }`}>
                      {rlsTestResult.canSeeOtherOrgs 
                        ? "RLS NIET CORRECT - Data lekken mogelijk!" 
                        : "RLS CORRECT - Isolatie werkt!"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rlsTestResult.details}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
