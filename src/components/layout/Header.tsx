import { Shield, User, ChevronDown, LogOut, Check, Eye } from 'lucide-react';
import { NotificationsBell } from '@/components/layout/NotificationsBell';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrgPlanType } from '@/hooks/useOrgPlanType';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/hooks/useUserRole';

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  org_admin: 'AI Verantwoordelijke',
  dpo: 'DPO',
  content_editor: 'Content Editor',
  manager: 'Team Manager',
  user: 'Gebruiker',
};

const PRIVILEGED_ROLES: AppRole[] = ['super_admin', 'org_admin', 'content_editor'];

function getRoleDisplayLabel(roles: AppRole[]): string {
  if (!roles || roles.length === 0) return 'Gebruiker';
  const meaningfulRoles = roles.filter(role => role !== 'user');
  if (meaningfulRoles.length === 0) return 'Gebruiker';
  return meaningfulRoles.map(role => ROLE_LABELS[role] || role).join(' / ');
}

function getAdminPath(roles: AppRole[]): string {
  if (roles.includes('super_admin')) return '/super-admin';
  if (roles.includes('content_editor')) return '/editor/dashboard';
  if (roles.includes('org_admin')) return '/admin';
  return '/admin';
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/editor') || pathname.startsWith('/super-admin');
}

export function Header() {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch actual roles from database
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles-display', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data || []).map(r => r.role as AppRole);
    },
    enabled: !!user?.id,
  });

  const roles = userRoles || [];
  const roleLabel = getRoleDisplayLabel(roles);
  const { planType } = useOrgPlanType();

  // Hide "Mijn Profiel" for shadow_only users with only 'user' role
  const isShadowOnlyUser = planType === 'shadow_only' && roles.length > 0 && roles.every(r => r === 'user');

  // Determine if user can switch views
  const hasPrivilegedRole = roles.some(r => PRIVILEGED_ROLES.includes(r));
  const hasUserRole = roles.includes('user');
  const canSwitchView = hasPrivilegedRole && hasUserRole;

  // Current active view based on URL
  const isInAdminView = isAdminRoute(location.pathname);
  const isInEmployeeView = !isInAdminView;

  const handleSwitchToAdmin = () => {
    navigate(getAdminPath(roles));
  };

  const handleSwitchToEmployee = () => {
    navigate('/dashboard');
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">RouteAI</h1>
            <p className="text-xs text-muted-foreground">AI Governance Platform</p>
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <NotificationsBell />
          {/* Employee view indicator */}
          {canSwitchView && isInEmployeeView && (
            <Badge variant="outline" className="hidden gap-1.5 border-primary/30 bg-primary/5 text-primary md:flex">
              <Eye className="h-3 w-3" />
              Medewerker weergave
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium">{profile?.full_name || 'Gebruiker'}</p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabel}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span>{profile?.full_name || 'Gebruiker'}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {profile?.email || user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>

              {/* View Switcher */}
              {canSwitchView && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Weergave wisselen
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={handleSwitchToAdmin}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Beheerder
                    </span>
                    {isInAdminView && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSwitchToEmployee}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Medewerker
                    </span>
                    {isInEmployeeView && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Mijn Profiel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Instellingen
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Uitloggen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
