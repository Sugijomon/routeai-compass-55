import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Award, 
  Wrench,
  Users,
  BarChart3,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Training', href: '/training', icon: GraduationCap },
  { label: 'Mijn Licentie', href: '/license', icon: Award },
  { label: 'AI Tools', href: '/tools', icon: Wrench },
];

const adminItems: NavItem[] = [
  { label: 'Team Overzicht', href: '/admin/team', icon: Users, adminOnly: true },
  { label: 'Licenties', href: '/admin/licenses', icon: FileText, adminOnly: true },
  { label: 'Rapportages', href: '/admin/reports', icon: BarChart3, adminOnly: true },
];

export function Sidebar() {
  const location = useLocation();
  const { currentRole } = useAppStore();
  const isAdmin = currentRole === 'org_admin';

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-card lg:block">
      <nav className="flex h-full flex-col gap-2 p-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={location.pathname === item.href} />
          ))}
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="mt-6 space-y-1">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Beheer
            </p>
            {adminItems.map((item) => (
              <NavLink key={item.href} item={item} isActive={location.pathname === item.href} />
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-auto rounded-lg bg-accent p-4">
          <h4 className="font-medium text-accent-foreground">Hulp nodig?</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Bekijk onze documentatie of neem contact op.
          </p>
          <Link 
            to="/help" 
            className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Documentatie
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </nav>
    </aside>
  );
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  
  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      {item.label}
      {item.badge && (
        <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
