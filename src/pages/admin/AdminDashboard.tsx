import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Users, 
  BookOpen, 
  Building2, 
  Shield,
  BarChart3,
  Settings,
  Trash2,
  UserCog
} from 'lucide-react';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';

type AppRole = 'super_admin' | 'org_admin' | 'content_editor' | 'manager' | 'user';

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Organisatie Admin',
  content_editor: 'Content Editor',
  manager: 'Manager',
  user: 'Gebruiker',
};

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  super_admin: 'Platform-breed beheer',
  org_admin: 'Organisatie beheer',
  content_editor: 'Content creatie en beheer',
  manager: 'Team oversight',
  user: 'Basis leerrechten',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isSuperAdmin, canManageOrg } = useUserRole();

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [usersRes, lessonsRes, orgsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        isSuperAdmin 
          ? supabase.from('organizations').select('id', { count: 'exact', head: true })
          : Promise.resolve({ count: null })
      ]);

      return {
        totalUsers: usersRes.count || 0,
        totalLessons: lessonsRes.count || 0,
        totalOrganizations: orgsRes.count || 0,
      };
    }
  });

  const quickActions = [
    {
      title: 'Gebruikers Beheren',
      description: 'Bekijk en beheer gebruikers en hun rollen',
      icon: Users,
      href: '#users',
      show: true,
    },
    {
      title: 'Organisaties',
      description: 'Beheer organisaties en instellingen',
      icon: Building2,
      href: '/super-admin',
      show: isSuperAdmin,
    },
    {
      title: 'Lessen Beheren',
      description: 'Bekijk en beheer lessen',
      icon: BookOpen,
      href: '/admin/lessons',
      show: true,
    },
    // TODO: activeer zodra /admin/reports route bestaat
    // {
    //   title: 'Rapporten',
    //   description: 'Bekijk statistieken en voortgang',
    //   icon: BarChart3,
    //   href: '/admin/reports',
    //   show: canManageOrg,
    // },
  ].filter(action => action.show);

  return (
    <AdminPageLayout
      title={isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
    >
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gebruikers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Actieve gebruikers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lessen
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalLessons || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Beschikbare lessen
            </p>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Organisaties
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalOrganizations || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Actieve organisaties
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Snelle Acties</CardTitle>
          <CardDescription>Veelgebruikte beheerfuncties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => {
                  if (action.href.startsWith('#')) {
                    document.getElementById(action.href.slice(1))?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  } else {
                    navigate(action.href);
                  }
                }}
              >
                <action.icon className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Management Section - Integrated */}
      <div id="users">
        <RoleManagementSection />
      </div>
    </AdminPageLayout>
  );
}

// Role Management Component (integrated)
function RoleManagementSection() {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all user roles
  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role, org_id')
        .order('user_id');
      
      if (error) throw error;
      return data;
    }
  });

  // Assign role mutation
  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', userId)
        .single();

      if (!userProfile?.org_id) {
        throw new Error('User heeft geen organisatie');
      }

      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .maybeSingle();

      if (existing) {
        throw new Error('Gebruiker heeft deze rol al');
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          org_id: userProfile.org_id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles-list'] });
      toast.success('Rol toegewezen');
      setSelectedUserId('');
      setSelectedRole('user');
    },
    onError: (error: Error) => {
      toast.error('Fout bij toewijzen rol', {
        description: error.message
      });
    }
  });

  // Remove role mutation
  const removeRole = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles-list'] });
      toast.success('Rol verwijderd');
    },
    onError: () => {
      toast.error('Kon rol niet verwijderen');
    }
  });

  // Group roles by user
  const userRolesMap = new Map<string, typeof userRoles>();
  userRoles?.forEach((ur) => {
    const userId = ur.user_id;
    if (!userRolesMap.has(userId)) {
      userRolesMap.set(userId, []);
    }
    userRolesMap.get(userId)!.push(ur);
  });

  const handleAssignRole = () => {
    if (!selectedUserId || !selectedRole) {
      toast.error('Selecteer een gebruiker en rol');
      return;
    }

    assignRole.mutate({ userId: selectedUserId, role: selectedRole });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gebruikersrollen Beheer
          </CardTitle>
          <CardDescription>
            Wijs rollen toe aan gebruikers binnen je organisatie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assign Role Section */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-4">Nieuwe Rol Toewijzen</h4>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Gebruiker</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecteer gebruiker" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Rol</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecteer rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as AppRole[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        <div>
                          <span className="font-medium">{ROLE_LABELS[role]}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {ROLE_DESCRIPTIONS[role]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button onClick={handleAssignRole} disabled={assignRole.isPending}>
                  <Shield className="h-4 w-4 mr-2" />
                  {assignRole.isPending ? 'Bezig...' : 'Toewijzen'}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Assignments */}
          <div>
            <h4 className="font-medium mb-4">Huidige Roltoewijzingen</h4>
            {usersLoading ? (
              <p className="text-muted-foreground">Laden...</p>
            ) : (
              <div className="space-y-3">
                {users?.map((user) => {
                  const roles = userRolesMap.get(user.id) || [];
                  
                  return (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {roles.length === 0 ? (
                          <Badge variant="secondary">Geen rollen</Badge>
                        ) : (
                          roles.map((roleAssignment) => (
                            <div 
                              key={roleAssignment.id} 
                              className="flex items-center gap-1"
                            >
                              <Badge variant="default">
                                {ROLE_LABELS[roleAssignment.role as AppRole]}
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => removeRole.mutate(roleAssignment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Reference Card */}
      <Card>
        <CardHeader>
          <CardTitle>Rol Referentie</CardTitle>
          <CardDescription>Uitleg van elke rol</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(ROLE_LABELS) as [AppRole, string][]).map(([role, label]) => (
              <div 
                key={role} 
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
