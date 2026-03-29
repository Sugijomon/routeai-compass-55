import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useOrgNotifications } from '@/hooks/useOrgNotifications';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useUserRole } from '@/hooks/useUserRole';

const SEVERITY_STYLES = {
  info: 'border-l-primary bg-primary/5',
  warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
  critical: 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
} as const;

export function NotificationsBell() {
  const { canManageOrg, canManageScan } = useUserRole();
  const { notifications, unreadCount, markRead, markAllRead } = useOrgNotifications();
  const [open, setOpen] = useState(false);

  // Alleen tonen voor org_admin, dpo en super_admin
  if (!canManageOrg && !canManageScan) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">Meldingen</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Alles gelezen
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Geen meldingen
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markRead.mutate(n.id);
                    if (n.action_url) window.location.href = n.action_url;
                  }}
                  className={`w-full text-left px-4 py-3 border-l-2 transition-colors hover:bg-muted/30 ${
                    SEVERITY_STYLES[n.severity as keyof typeof SEVERITY_STYLES] ?? ''
                  } ${!n.is_read ? 'font-medium' : 'opacity-70'}`}
                >
                  <p className="text-sm text-foreground">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground/60">
                    {format(new Date(n.created_at), 'd MMM HH:mm', { locale: nl })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
