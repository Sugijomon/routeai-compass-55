import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, ArrowLeft, Loader2, Shield, Edit, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { AppRole } from '@/hooks/useUserRole';
import { AppLayout } from '@/components/layout/AppLayout';

interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  org_id: string;
  organization_name?: string;
  roles: AppRole[];
  is_active: boolean;
}

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  org_admin: 'AI Verantwoordelijke',
  dpo: 'DPO',
  content_editor: 'Content Editor',
  manager: 'Team Manager',
  user: 'Gebruiker',
};

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  super_admin: 'Platform-brede toegang, alle organisaties',
  org_admin: 'Beheert de AI tool catalogus, ziet rijbewijsstatus van medewerkers en exporteert compliance rapporten. Maximaal 2 per organisatie.',
  dpo: 'Bekijkt risicoprofielen, beoordeelt shadow-scan resultaten en beheert de tool-inventaris.',
  content_editor: 'Lessen en trainingsmateriaal maken',
  manager: 'Teambeheer en rapportages',
  user: 'Basis gebruikerstoegang',
};

const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  org_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  dpo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  content_editor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const ALL_ROLES: AppRole[] = ['super_admin', 'org_admin', 'dpo', 'content_editor', 'manager', 'user'];

export default function CrossOrgUserManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);

  // Fetch all users with their roles across all organizations
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['cross-org-users'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, org_id, is_active')
        .order('email');

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role');

      if (rolesError) throw rolesError;

      // Fetch organizations for names
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name');

      if (orgsError) throw orgsError;

      const orgMap = new Map(orgs?.map(o => [o.id, o.name]) || []);

      // Map roles to users
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
        ...profile,
        is_active: profile.is_active ?? true,
        organization_name: orgMap.get(profile.org_id) || 'Onbekend',
        roles: roles
          .filter(r => r.user_id === profile.id)
          .map(r => r.role as AppRole)
      }));

      return usersWithRoles;
    }
  });

  // Fetch organizations for filter
  const { data: organizations } = useQuery({
    queryKey: ['organizations-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Update roles mutation
  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, orgId, roles }: { userId: string; orgId: string; roles: AppRole[] }) => {
      // First, get current roles
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const currentRolesList = (currentRoles?.map(r => r.role) || []) as AppRole[];
      
      // Determine roles to add and remove
      const rolesToAdd = roles.filter(r => !currentRolesList.includes(r));
      const rolesToRemove = currentRolesList.filter(r => !roles.includes(r));

      // Remove roles
      if (rolesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .in('role', rolesToRemove);

        if (deleteError) throw deleteError;
      }

      // Add roles
      if (rolesToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(
            rolesToAdd.map(role => ({
              user_id: userId,
              role: role,
              org_id: orgId
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-org-users'] });
      toast.success('Rollen bijgewerkt');
      setEditingUser(null);
    },
    onError: () => {
      toast.error('Kon rollen niet bijwerken');
    }
  });

  // Filter users
  const filteredUsers = usersData?.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || 
      user.roles.includes(filterRole as AppRole);
    
    const matchesOrg = filterOrg === 'all' || user.org_id === filterOrg;

    return matchesSearch && matchesRole && matchesOrg;
  });

  const handleEditRoles = (user: UserWithRoles) => {
    setEditingUser(user);
    setSelectedRoles(user.roles || []);
  };

  const handleSaveRoles = () => {
    if (!editingUser) return;
    updateRolesMutation.mutate({
      userId: editingUser.id,
      orgId: editingUser.org_id,
      roles: selectedRoles
    });
  };

  const toggleRole = (role: AppRole) => {
    setSelectedRoles(prev => 
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cross-Org User Management</h1>
              <p className="text-muted-foreground">
                Role management voor alle gebruikers over organisaties heen
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek op naam, email, organisatie..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterOrg} onValueChange={setFilterOrg}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Organisatie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle organisaties</SelectItem>
                  {organizations?.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle rollen</SelectItem>
                  {ALL_ROLES.map(role => (
                    <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gebruikers ({filteredUsers?.length || 0})
            </CardTitle>
            <CardDescription>
              Overzicht van alle gebruikers en hun rollen over alle organisaties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organisatie</TableHead>
                    <TableHead>Rollen</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'Onbekend'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || '—'}
                      </TableCell>
                      <TableCell>
                        {user.organization_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <span className="text-sm text-muted-foreground italic">Geen rollen</span>
                          ) : (
                            user.roles.map((role) => (
                              <Badge key={role} className={ROLE_COLORS[role]}>
                                {ROLE_LABELS[role]}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditRoles(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen gebruikers gevonden</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Roles Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rollen Bewerken</DialogTitle>
              <DialogDescription>
                Wijzig de rollen voor {editingUser?.full_name || editingUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {ALL_ROLES.map((role) => (
                <div key={role} className="flex items-start space-x-3">
                  <Checkbox
                    id={role}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <div className="grid gap-0.5">
                    <Label htmlFor={role} className="font-medium cursor-pointer">
                      {ROLE_LABELS[role]}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_DESCRIPTIONS[role]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Annuleren
              </Button>
              <Button onClick={handleSaveRoles} disabled={updateRolesMutation.isPending}>
                {updateRolesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Opslaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
