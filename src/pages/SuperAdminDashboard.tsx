import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Wrench, 
  BookOpen, 
  FileText,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch platform-wide KPIs
  const { data: platformKPIs } = useQuery({
    queryKey: ['platform-kpis'],
    queryFn: async () => {
      const [orgsRes, usersRes, toolsRes, contentRes] = await Promise.all([
        supabase.from('organizations').select('id, status', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tools_library').select('id', { count: 'exact', head: true }),
        supabase.from('lessons').select('id, is_published', { count: 'exact' })
      ]);

      return {
        totalOrganizations: orgsRes.count || 0,
        activeOrganizations: orgsRes.data?.filter(o => o.status === 'active').length || 0,
        totalUsers: usersRes.count || 0,
        totalTools: toolsRes.count || 0,
        totalContent: contentRes.count || 0,
        publishedContent: contentRes.data?.filter(l => l.is_published === true).length || 0,
      };
    }
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Super Admin Dashboard</h2>
            <p className="text-muted-foreground">
              Platform Management — Overzicht en snelle toegang tot alle modules
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            Platform Instellingen
          </Button>
        </div>

        {/* Platform Health KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organisaties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{platformKPIs?.totalOrganizations || 0}</p>
              <p className="text-xs text-muted-foreground">
                {platformKPIs?.activeOrganizations || 0} actief
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Totaal Gebruikers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{platformKPIs?.totalUsers || 0}</p>
              <p className="text-xs text-muted-foreground">Platform-breed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                AI Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{platformKPIs?.totalTools || 0}</p>
              <p className="text-xs text-muted-foreground">In tool library</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Learning Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{platformKPIs?.publishedContent || 0}</p>
              <p className="text-xs text-muted-foreground">
                van {platformKPIs?.totalContent || 0} gepubliceerd
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Modules (Widget Cards) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Organizations Widget */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/organizations')}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Organisaties Beheer</CardTitle>
                    <CardDescription>Beheer alle organisaties op het platform</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Beheer →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Actieve organisaties</span>
                  <p className="font-semibold">{platformKPIs?.activeOrganizations || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Totaal</span>
                  <p className="font-semibold">{platformKPIs?.totalOrganizations || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools Library Widget */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/tools')}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Tools Library Beheer</CardTitle>
                    <CardDescription>Platform-brede AI tools bibliotheek — GPAI = General Purpose AI (EU AI Act Art. 51)</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Beheer →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Totaal tools</span>
                  <p className="font-semibold">{platformKPIs?.totalTools || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="font-semibold text-green-600">Actief</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Library Widget */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/content')}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Learning Library Beheer</CardTitle>
                    <CardDescription>Platform-brede trainingsinhoud — Cursussen en modules voor AI-Rijbewijs</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Beheer →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Gepubliceerd</span>
                  <p className="font-semibold">{platformKPIs?.publishedContent || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Totaal content</span>
                  <p className="font-semibold">{platformKPIs?.totalContent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Management Widget */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/users')}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Cross-Org User Management</CardTitle>
                    <CardDescription>Role management over alle organisaties</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Beheer →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Totaal gebruikers</span>
                  <p className="font-semibold">{platformKPIs?.totalUsers || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="font-semibold text-green-600">Actief beheer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shadow AI Scan */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/shadow')}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Shadow AI Scan</CardTitle>
                    <CardDescription>Discovery en monitoring van Shadow AI gebruik</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Beheer →
                </Button>
              </div>
            </CardHeader>
            <ShadowScanStats />
          </Card>

          {/* Future Module: Risk Assessment Engine */}
          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Risk Assessment Engine</CardTitle>
                    <CardDescription>AI use-case routing en governance engine</CardDescription>
                  </div>
                </div>
                <Badge variant="outline">Binnenkort</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Module status</span>
                  <p className="font-semibold text-muted-foreground">In ontwikkeling</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Analytics Widget */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Platform Analytics
                </CardTitle>
                <CardDescription>Real-time platform statistieken</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/super-admin/organizations')}>
                Volledige Analytics →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">
                  {platformKPIs?.activeOrganizations || 0}
                </p>
                <p className="text-sm text-muted-foreground">Actieve Orgs</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">
                  {platformKPIs?.totalUsers || 0}
                </p>
                <p className="text-sm text-muted-foreground">Platform Users</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">
                  {platformKPIs?.publishedContent || 0}
                </p>
                <p className="text-sm text-muted-foreground">Beschikbare Content</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Recente Activiteit
            </CardTitle>
            <CardDescription>Laatste wijzigingen op het platform</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Nieuwe organisatie: {activity.name}</span>
                    <span className="text-muted-foreground ml-auto">
                      {new Date(activity.created_at!).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nog geen recente activiteit
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
