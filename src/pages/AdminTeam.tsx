import { Users, Award, AlertTriangle, CheckCircle2, XCircle, Mail, MoreHorizontal } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/stores/useAppStore';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const AdminTeam = () => {
  const { users, revokeLicense } = useAppStore();

  const getStatusBadge = (user: typeof users[0]) => {
    if (!user.license) {
      return <Badge variant="outline">Geen Licentie</Badge>;
    }
    if (user.license.status === 'expired') {
      return <Badge variant="outline" className="status-blocked">Verlopen</Badge>;
    }
    return <Badge variant="outline" className="status-approved">Actief</Badge>;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Team Overzicht</h1>
              <p className="text-muted-foreground">
                Beheer de AI licenties van je teamleden
              </p>
            </div>
          </div>
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            Uitnodiging Versturen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Totaal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.license?.status === 'active').length}
                </p>
                <p className="text-xs text-muted-foreground">Actief</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.license?.status === 'expired').length}
                </p>
                <p className="text-xs text-muted-foreground">Verlopen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => !u.license).length}
                </p>
                <p className="text-xs text-muted-foreground">Geen Licentie</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team List */}
      <Card>
        <CardHeader>
          <CardTitle>Teamleden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-secondary/50"
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{user.name}</p>
                    {user.role === 'org_admin' && (
                      <Badge variant="secondary" className="text-xs">Admin</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>

                <div className="hidden md:block text-right">
                  {user.license ? (
                    <>
                      <p className="text-sm font-medium">{user.license.assessmentScore}%</p>
                      <p className="text-xs text-muted-foreground">
                        {user.license.grantedCapabilities.length} capabilities
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>

                <div className="hidden md:block text-right min-w-[100px]">
                  {user.license ? (
                    <p className="text-xs text-muted-foreground">
                      Geldig tot {format(new Date(user.license.expiresAt), 'd MMM yyyy', { locale: nl })}
                    </p>
                  ) : null}
                </div>

                {getStatusBadge(user)}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Bekijk Details</DropdownMenuItem>
                    <DropdownMenuItem>Stuur Herinnering</DropdownMenuItem>
                    {user.license && (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => revokeLicense(user.id)}
                      >
                        Trek Licentie In
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default AdminTeam;
