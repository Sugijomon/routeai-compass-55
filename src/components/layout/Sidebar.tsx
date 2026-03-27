import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Award, 
  Users,
  BarChart3,
  ChevronRight,
  Shield,
  Building2,
  HelpCircle,
  BookOpen,
  Wrench,
  Library
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const location = useLocation();
  const { isSuperAdmin, isContentEditor, canManageOrg, isDpo } = useUserRole();

  let sections: NavSection[] = [];

  if (isSuperAdmin) {
    sections = [
      {
        title: 'Platform',
        items: [
          { label: 'Dashboard', href: '/super-admin', icon: Shield, exact: true },
          { label: 'Organisaties', href: '/super-admin/organizations', icon: Building2 },
          { label: 'Gebruikers', href: '/super-admin/users', icon: Users },
        ],
      },
      {
        title: 'Beheer',
        items: [
          { label: 'Tools Library', href: '/super-admin/tools', icon: Wrench },
          { label: 'Model Library', href: '/super-admin/model-library', icon: Library },
          { label: 'Learning Library', href: '/super-admin/content', icon: BookOpen },
        ],
      },
    ];
  } else if (isDpo) {
    sections = [
      {
        title: 'Shadow AI Scan',
        items: [
          { label: 'Scan beheer', href: '/admin/shadow', icon: Shield },
        ],
      },
    ];
  } else if (isContentEditor) {
    sections = [
      {
        title: 'Content',
        items: [
          { label: 'Dashboard', href: '/editor/dashboard', icon: LayoutDashboard },
          { label: 'Cursussen', href: '/editor/cursussen', icon: GraduationCap },
          { label: 'Lessen', href: '/admin/lessons', icon: BookOpen },
          { label: 'Vragenbank', href: '/editor/vragen', icon: HelpCircle },
        ],
      },
    ];
  } else if (canManageOrg) {
    sections = [
      {
        title: 'Menu',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { label: 'Training', href: '/learn', icon: GraduationCap },
          { label: 'Mijn Licentie', href: '/license', icon: Award },
        ],
      },
      {
        title: 'Beheer',
        items: [
          { label: 'Overzicht', href: '/admin', icon: Users },
          { label: 'Gebruikersrollen', href: '/admin/users/roles', icon: Shield },
          { label: 'Rapportages', href: '/admin/reports', icon: BarChart3 },
        ],
      },
    ];
  } else {
    sections = [
      {
        title: 'Menu',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { label: 'Mijn AI Checks', href: '/assessments', icon: Shield },
          { label: 'Training', href: '/learn', icon: GraduationCap },
          { label: 'Mijn Licentie', href: '/license', icon: Award },
        ],
      },
    ];
  }

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-card lg:block">
      <nav className="flex h-full flex-col gap-2 p-4">
        {sections.map((section, idx) => (
          <div key={section.title} className={cn(idx > 0 && 'mt-6', 'space-y-1')}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.href + item.label}
                item={item}
                isActive={
                  item.exact
                    ? location.pathname === item.href
                    : location.pathname === item.href || location.pathname.startsWith(item.href + '/')
                }
              />
            ))}
          </div>
        ))}

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