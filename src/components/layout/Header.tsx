import { Shield, User, Settings, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
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

export function Header() {
  const { currentRole, setCurrentRole, getCurrentUser } = useAppStore();
  const user = getCurrentUser();

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

        {/* Role Toggle & User Menu */}
        <div className="flex items-center gap-4">
          {/* Role Toggle */}
          <div className="flex items-center gap-2 rounded-full bg-secondary p-1">
            <button
              onClick={() => setCurrentRole('user')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                currentRole === 'user'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Gebruiker
            </button>
            <button
              onClick={() => setCurrentRole('org_admin')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                currentRole === 'org_admin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Org Admin
            </button>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium">{user?.name || 'Gebruiker'}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentRole === 'org_admin' ? 'Administrator' : 'Medewerker'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span>{user?.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.email}
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
                  variant={user?.license?.status === 'active' ? 'default' : 'secondary'}
                  className={user?.license?.status === 'active' ? 'status-approved' : ''}
                >
                  {user?.license?.status === 'active' 
                    ? 'Licentie Actief' 
                    : user?.license?.status === 'expired'
                    ? 'Licentie Verlopen'
                    : 'Geen Licentie'}
                </Badge>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
