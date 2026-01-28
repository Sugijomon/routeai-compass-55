import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Award, 
  Users,
  BarChart3,
  FileText,
  BookOpen,
  ChevronRight,
  Edit,
  Shield,
  Building2
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export function Sidebar() {
  const location = useLocation();
  const { isSuperAdmin, isContentEditor, canManageOrg } = useUserRole();

  // Base navigation items for all users
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Training', href: '/learn', icon: GraduationCap },
    { label: 'Mijn Licentie', href: '/license', icon: Award },
  ];

  // Content Editor navigation
  const editorItems: NavItem[] = [
    { label: 'Content Editor', href: '/editor', icon: Edit },
    { label: 'Lessen', href: '/admin/lessons', icon: BookOpen },
    { label: 'Cursussen', href: '/admin/courses', icon: FileText },
  ];

  // Admin navigation
  const adminItems: NavItem[] = [];
  
  if (isSuperAdmin) {
    adminItems.push(
      { label: 'Super Admin', href: '/super-admin', icon: Shield },
      { label: 'Organisaties', href: '/super-admin', icon: Building2 }
    );
  }
  
  if (canManageOrg) {
    adminItems.push(
      { label: 'Org Beheer', href: '/admin', icon: Users },
      { label: 'Gebruikersrollen', href: '/admin/users/roles', icon: Shield },
      { label: 'Rapportages', href: '/admin/reports', icon: BarChart3 }
    );
  }

  // Show editor section if user has content editor or super admin role
  const showEditorSection = isSuperAdmin || isContentEditor;
  // Show admin section if user has any admin role
  const showAdminSection = adminItems.length > 0;

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

        {/* Content Editor Navigation */}
        {showEditorSection && (
          <div className="mt-6 space-y-1">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Content
            </p>
            {editorItems.map((item) => (
              <NavLink key={item.href} item={item} isActive={location.pathname === item.href || location.pathname.startsWith(item.href + '/')} />
            ))}
          </div>
        )}

        {/* Admin Navigation */}
        {showAdminSection && (
          <div className="mt-6 space-y-1">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Beheer
            </p>
            {adminItems.map((item) => (
              <NavLink key={item.href + item.label} item={item} isActive={location.pathname === item.href} />
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
