import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminPageLayoutProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminPageLayout({
  title,
  breadcrumbs,
  actions,
  children,
  className,
}: AdminPageLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Uitgelogd', description: 'Je bent succesvol uitgelogd.' });
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with logout */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Admin</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Uitloggen
          </Button>
        </div>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="h-4 w-4" />}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Content */}
        <div className={cn(className)}>{children}</div>
      </div>
    </div>
  );
}
