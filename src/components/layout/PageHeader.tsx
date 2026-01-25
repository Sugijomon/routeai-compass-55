import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardRedirect } from '@/hooks/useDashboardRedirect';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  backButton?: {
    label?: string;
    onClick?: () => void;
  };
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  backButton,
  actions,
}: PageHeaderProps) {
  const dashboardUrl = useDashboardRedirect();
  const navigate = useNavigate();

  return (
    <div className="border-b bg-card px-page py-6">
      <div className="container max-w-5xl mx-auto">
        {backButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={backButton.onClick || (() => navigate(dashboardUrl))}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backButton.label || 'Terug naar Dashboard'}
          </Button>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
