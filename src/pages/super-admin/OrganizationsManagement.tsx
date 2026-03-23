import { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, Edit, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';

type OrganizationStatus = 'active' | 'inactive' | 'trial' | 'expired' | 'test' | 'suspended';

interface Organization {
  id: string;
  name: string;
  status: OrganizationStatus | null;
  plan_type?: string | null;
  subscription_type?: string | null;
  contact_email?: string | null;
  contact_person?: string | null;
  sector?: string | null;
  country?: string | null;
  created_at: string | null;
}

const PLAN_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  shadow_only: { label: 'Shadow AI Scan', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  routeai: { label: 'RouteAI', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  both: { label: 'Scan + RouteAI', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  test: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Actief',
  trial: 'Trial',
  test: 'Test',
  inactive: 'Inactief',
  expired: 'Verlopen',
  suspended: 'Geschorst',
};

export default function OrganizationsManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgEmail, setNewOrgEmail] = useState('');

  // Fetch organizations
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['super-admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Organization[];
    }
  });

  // Create organization mutation
  const createOrg = useMutation({
    mutationFn: async (orgData: { name: string; contact_email: string }) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: orgData.name,
          contact_email: orgData.contact_email,
          status: 'trial',
          subscription_type: 'basic'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['platform-kpis'] });
      toast.success('Organisatie aangemaakt');
      setIsCreateDialogOpen(false);
      setNewOrgName('');
      setNewOrgEmail('');
    },
    onError: (error: Error) => {
      toast.error('Kon organisatie niet aanmaken', {
        description: error.message
      });
    }
  });

  // Filter organizations
  const filteredOrgs = organizations?.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || org.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrg = () => {
    if (!newOrgName.trim()) {
      toast.error('Vul een organisatienaam in');
      return;
    }
    createOrg.mutate({ name: newOrgName, contact_email: newOrgEmail });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Organisaties Beheer</h1>
                <p className="text-muted-foreground">
                  Beheer alle organisaties op het RouteAI platform
                </p>
              </div>
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Organisatie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe Organisatie Aanmaken</DialogTitle>
                <DialogDescription>
                  Maak een nieuwe organisatie aan op het platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organisatie Naam</Label>
                  <Input
                    id="org-name"
                    placeholder="Bedrijfsnaam B.V."
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Contact Email</Label>
                  <Input
                    id="org-email"
                    type="email"
                    placeholder="contact@bedrijf.nl"
                    value={newOrgEmail}
                    onChange={(e) => setNewOrgEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleCreateOrg} disabled={createOrg.isPending}>
                  {createOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {createOrg.isPending ? 'Bezig...' : 'Aanmaken'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek op naam, email..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="active">Actief</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="inactive">Inactief</SelectItem>
                  <SelectItem value="expired">Verlopen</SelectItem>
                  <SelectItem value="suspended">Geschorst</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organisaties ({filteredOrgs?.length || 0})</CardTitle>
            <CardDescription>
              Overzicht van alle organisaties op het platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOrgs && filteredOrgs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Abonnement</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Aangemaakt</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[org.status || 'inactive']}>
                          {STATUS_LABELS[org.status || 'inactive'] || org.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{org.subscription_type || 'Basic'}</TableCell>
                      <TableCell>{org.sector || '—'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {org.contact_person && <div>{org.contact_person}</div>}
                          {org.contact_email && (
                            <div className="text-muted-foreground">{org.contact_email}</div>
                          )}
                          {!org.contact_person && !org.contact_email && '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.created_at 
                          ? new Date(org.created_at).toLocaleDateString('nl-NL')
                          : '—'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
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
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen organisaties gevonden</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
