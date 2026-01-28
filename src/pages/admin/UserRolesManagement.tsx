import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, UserCog, Trash2, Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AppRole } from '@/hooks/useUserRole';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Organisatie Admin',
  content_editor: 'Content Editor',
  manager: 'Manager',
  moderator: 'Moderator',
  user: 'Gebruiker',
};

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  super_admin: 'Platform-breed beheer',
  org_admin: 'Organisatie beheer',
  content_editor: 'Content creatie en beheer',
  manager: 'Team oversight',
  moderator: 'Community moderatie',
  user: 'Basis leerrechten',
};

const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  org_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  content_editor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderator: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export default function UserRolesManagement() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');

  const orgId = profile?.org_id;

  // Fetch all users in organization
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['org-users-for-roles', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('org_id', orgId)
        .order('email');
      
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Fetch all user roles in organization
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles-management', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role, org_id')
        .eq('org_id', orgId)
        .order('user_id');
      
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Assign role mutation
  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      if (!orgId) throw new Error('Geen organisatie gevonden');

      // Check if role already exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .maybeSingle();

      if (existing) {
        throw new Error('Gebruiker heeft deze rol al');
      }

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          org_id: orgId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles-management'] });
      queryClient.invalidateQueries({ queryKey: ['org-users'] });
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
      queryClient.invalidateQueries({ queryKey: ['user-roles-management'] });
      queryClient.invalidateQueries({ queryKey: ['org-users'] });
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

  const isLoading = usersLoading || rolesLoading;

  return (
    <AdminPageLayout
      title="Gebruikersrollen Beheer"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/lessons' },
        { label: 'Gebruikersrollen' }
      ]}
    >
      <p className="text-muted-foreground mb-6">
        Wijs rollen toe aan gebruikers binnen je organisatie
      </p>
      
      <div className="space-y-6">
        {/* Assign New Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Rol Toewijzen
            </CardTitle>
            <CardDescription>
              Selecteer een gebruiker en wijs een nieuwe rol toe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Gebruiker</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer gebruiker..." />
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

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Rol</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as AppRole[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex flex-col">
                          <span>{ROLE_LABELS[role]}</span>
                          <span className="text-xs text-muted-foreground">
                            {ROLE_DESCRIPTIONS[role]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleAssignRole} 
                  disabled={assignRole.isPending || !selectedUserId}
                >
                  {assignRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {assignRole.isPending ? 'Bezig...' : 'Toewijzen'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Role Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Huidige Roltoewijzingen
            </CardTitle>
            <CardDescription>
              Overzicht van alle gebruikers en hun rollen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {users?.map((user) => {
                  const roles = userRolesMap.get(user.id) || [];
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{user.full_name || 'Onbekend'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        {roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground italic">Geen rollen</span>
                        ) : (
                          roles.map((roleAssignment) => (
                            <div key={roleAssignment.id} className="flex items-center gap-1">
                              <Badge className={ROLE_COLORS[roleAssignment.role as AppRole]}>
                                {ROLE_LABELS[roleAssignment.role as AppRole]}
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => removeRole.mutate(roleAssignment.id)}
                                disabled={removeRole.isPending}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}

                {users?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Geen gebruikers gevonden in deze organisatie
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Rol Referentie</CardTitle>
            <CardDescription>Wat elke rol betekent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.entries(ROLE_LABELS) as [AppRole, string][]).map(([role, label]) => (
                <div key={role} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Badge className={ROLE_COLORS[role]}>{label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {ROLE_DESCRIPTIONS[role]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
