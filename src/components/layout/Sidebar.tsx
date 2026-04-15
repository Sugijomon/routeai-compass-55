import { useState, useEffect } from 'react';
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
  Library,
  Rocket,
  Trophy,
  Settings,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, isLoading: authLoading } = useAuth();
  const { isSuperAdmin, isContentEditor, canManageOrg, isDpo, isLoading: roleLoading } = useUserRole();

  // Veiligheidstimeout: na 3s forceer render met beschikbare data
  const [forceRender, setForceRender] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setForceRender(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = authLoading || !user || roleLoading;

  // DPO early-render: als isDpo al bekend is en user bestaat, niet wachten op volledige load
  const canRenderEarly = isDpo && !!user;

  if (isLoading && !forceRender && !canRenderEarly) {
    return (
      <aside className="hidden w-64 flex-shrink-0 border-r bg-card lg:block">
        <div className="flex h-full flex-col gap-2 p-4 pt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 rounded-md bg-muted animate-pulse mx-3" />
          ))}
        </div>
      </aside>
    );
  }

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
          { label: 'Pre-launch checklist', href: '/super-admin/test-checklist', icon: Rocket },
        ],
      },
    ];
  } else if (isDpo) {
    sections = [
      {
        title: 'Shadow AI Scan',
        items: [
          { label: 'Instellingen', href: '/admin/shadow/instellingen', icon: Settings },
          { label: 'Overzicht', href: '/admin/shadow/overzicht', icon: BarChart3 },
          { label: 'Scoreboard', href: '/admin/shadow/scoreboard', icon: Trophy },
          { label: 'Rapportage', href: '/admin/shadow/rapportage', icon: FileText },
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
          { label: 'Mijn AI Checks', href: '/assessments', icon: Shield },
          { label: 'Training', href: '/learn', icon: GraduationCap },
          // TODO: activeer zodra /license route bestaat
          // { label: 'Mijn Licentie', href: '/license', icon: Award },
        ],
      },
      {
        title: 'Beheer',
        items: [
          { label: 'Overzicht', href: '/admin', icon: Users },
          { label: 'Passport', href: '/admin/passport', icon: BookOpen },
          { label: 'Gebruikersrollen', href: '/admin/users/roles', icon: Shield },
          // TODO: activeer zodra /admin/reports route bestaat
          // { label: 'Rapportages', href: '/admin/reports', icon: BarChart3 },
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
          // TODO: activeer zodra /license route bestaat
          // { label: 'Mijn Licentie', href: '/license', icon: Award },
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

        {/* TODO: activeer help-sectie zodra /help route bestaat */}
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