import { Shield, User, Settings, ChevronDown } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
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
  org_admin: 'Org Admin',
  content_editor: 'Content Editor',
  manager: 'Manager',
  moderator: 'Moderator',
  user: 'Gebruiker',
};

function getRoleDisplayLabel(roles: AppRole[]): string {
  if (!roles || roles.length === 0) return 'Gebruiker';
  
  // Filter out 'user' role if there are other meaningful roles
  const meaningfulRoles = roles.filter(role => role !== 'user');
  
  // If no meaningful roles, show 'Gebruiker'
  if (meaningfulRoles.length === 0) return 'Gebruiker';
  
  // Return all meaningful roles joined
  return meaningfulRoles.map(role => ROLE_LABELS[role] || role).join(' / ');
}

export function Header() {
  const { user } = useAuth();
  const { profile, hasAiRijbewijs } = useUserProfile();

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

  const roleLabel = getRoleDisplayLabel(userRoles || []);

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
        <div className="flex items-center gap-4">
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
              <div className="px-2 py-1.5">
                <Badge 
                  variant={hasAiRijbewijs ? 'default' : 'secondary'}
                  className={hasAiRijbewijs ? 'status-approved' : ''}
                >
                  {hasAiRijbewijs 
                    ? 'AI-Rijbewijs Actief' 
                    : 'Geen AI-Rijbewijs'}
                </Badge>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
